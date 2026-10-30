'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { ContourlinesGlobe, ContourlinesGlobeHandle, GlobeViewState } from '@/components/earth/ContourlinesGlobe';
import { CableNetworkOverlay } from '@/components/earth/CableNetworkOverlay';
import { UnderwaterScene, UnderwaterSceneHandle, CameraPerspective } from '@/components/digital-twin/UnderwaterScene';
import { TransitionCoordinator, TransitionState } from '@/components/digital-twin/TransitionCoordinator';
import { GhostModeOverlay, REPAIR_STAGES } from '@/components/digital-twin/GhostModeOverlay';
import { generateSimulationPDFReport, ReportScreenshot } from '@/lib/pdf-report-generator';

export default function UnderwaterDigitalTwinPage() {
  const {
    cables,
    selectedCable,
    setSelectedCable,
    activeFault,
    simulationResult,
    executeSimulation,
  } = useWorkspace();

  // Mode: 'earth' | 'transition' | 'underwater' | 'ghost'
  const [activeMode, setActiveMode] = useState<'earth' | 'underwater' | 'ghost'>('earth');
  const [activeTelemetryMode, setActiveTelemetryMode] = useState<'Optical' | 'Acoustic' | 'Hydrodynamic'>('Optical');

  // Handle references
  const globeHandleRef = useRef<ContourlinesGlobeHandle | null>(null);
  const underwaterHandleRef = useRef<UnderwaterSceneHandle | null>(null);
  const transitionCoordinatorRef = useRef<TransitionCoordinator | null>(null);

  // View state tracking
  const [globeView, setGlobeView] = useState<GlobeViewState>({
    lon: activeFault.lon,
    lat: activeFault.lat,
    scale: 2.4,
    morph: 1.0,
    seaLevel: 0.0,
    viewportWidth: 800,
    viewportHeight: 600,
  });

  // Transition state
  const [transitionState, setTransitionState] = useState<TransitionState>({
    currentStage: 'idle',
    stageProgress: 0.0,
    currentDepthMeters: 0,
    earthOpacity: 1.0,
    underwaterOpacity: 0.0,
    statusMessage: 'Contourlines NOAA Earth Active',
  });

  // Simulation timeline playback
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(4); // Default to Model 12 Sonar Sweep
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [capturedFrames, setCapturedFrames] = useState<ReportScreenshot[]>([]);

  // Initialize Transition Coordinator
  useEffect(() => {
    const coordinator = new TransitionCoordinator((state) => {
      setTransitionState(state);
      if (state.currentStage === 'repair_active') {
        setActiveMode('underwater');
      }
    });
    transitionCoordinatorRef.current = coordinator;
  }, []);

  // Update coordinator with active handles
  useEffect(() => {
    if (transitionCoordinatorRef.current) {
      transitionCoordinatorRef.current.registerGlobe(globeHandleRef.current);
      transitionCoordinatorRef.current.registerUnderwater(underwaterHandleRef.current);
    }
  });

  // Project coordinates for overlays
  const projectCoordinates = useCallback(
    (lon: number, lat: number) => {
      if (globeHandleRef.current) {
        return globeHandleRef.current.project(lon, lat);
      }
      return { x: -1000, y: -1000, visible: false, z: -1 };
    },
    []
  );

  // Trigger Earth-to-Underwater Transition
  const handleStartTransition = () => {
    if (transitionCoordinatorRef.current) {
      setActiveMode('underwater');
      transitionCoordinatorRef.current.startDescentJourney(
        activeFault.lon,
        activeFault.lat,
        activeFault.depthMeters,
        () => {
          // Capture descent frame for evidence dossier
          captureCurrentSimulationFrame('Benthic Reveal & Seafloor Inspection');
        }
      );
    }
  };

  // Return to Earth view
  const handleReturnToEarth = () => {
    if (transitionCoordinatorRef.current) {
      transitionCoordinatorRef.current.returnToEarth(() => {
        setActiveMode('earth');
      });
    } else {
      setActiveMode('earth');
    }
  };

  // Capture real simulation frame from Three.js canvas
  const captureCurrentSimulationFrame = useCallback(
    (caption: string) => {
      if (underwaterHandleRef.current) {
        const dataUrl = underwaterHandleRef.current.captureFrame();
        if (dataUrl) {
          const stageName = REPAIR_STAGES[currentStageIndex]?.name || 'Physical Splice';
          const newScreenshot: ReportScreenshot = {
            dataUrl,
            caption: `${caption} — Cable ${activeFault.cableName} at ${activeFault.nearestLandingStation}`,
            timestamp: new Date().toISOString(),
            stageName,
          };
          setCapturedFrames((prev) => [newScreenshot, ...prev.slice(0, 3)]);
        }
      }
    },
    [activeFault, currentStageIndex]
  );

  // Simulation timeline ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        const next = prev + 1;
        if (next >= REPAIR_STAGES.length) {
          setIsPlaying(false);
          return prev;
        }

        // Notify 3D scene
        if (underwaterHandleRef.current) {
          underwaterHandleRef.current.setSimulationStage(next, next / REPAIR_STAGES.length);
        }

        // Capture frame at key milestones
        if (next === 8 || next === 10 || next === 13) {
          captureCurrentSimulationFrame(REPAIR_STAGES[next].name);
        }

        // When physical repair completes (Stage 11/14), trigger network simulation update
        if (next === 11) {
          executeSimulation();
        }

        return next;
      });
    }, 2800 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, executeSimulation, captureCurrentSimulationFrame]);

  // Set explicit stage
  const handleSetStage = (stageIdx: number) => {
    setCurrentStageIndex(stageIdx);
    if (underwaterHandleRef.current) {
      underwaterHandleRef.current.setSimulationStage(stageIdx, stageIdx / REPAIR_STAGES.length);
    }
    captureCurrentSimulationFrame(REPAIR_STAGES[stageIdx].name);
  };

  // Export PDF Report with captured frames
  const handleExportPDF = () => {
    // If no frames captured yet, capture immediate frame
    if (capturedFrames.length === 0 && underwaterHandleRef.current) {
      const dataUrl = underwaterHandleRef.current.captureFrame();
      if (dataUrl) {
        const immediate: ReportScreenshot = {
          dataUrl,
          caption: `Live Inspection Capture — ${activeFault.cableName} at -${activeFault.depthMeters}m`,
          timestamp: new Date().toISOString(),
          stageName: REPAIR_STAGES[currentStageIndex].name,
        };
        generateSimulationPDFReport(activeFault, simulationResult, [immediate]);
        return;
      }
    }
    generateSimulationPDFReport(activeFault, simulationResult, capturedFrames);
  };

  return (
    <div className="space-y-4">
      {/* Title & Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D4C4A8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A69B89] uppercase tracking-widest">
              SECTION 02 // SUBSEA DIGITAL TWIN ENCLAVE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8D9BF] text-[#454640] border border-[#D4C4A8]">
              PHASE 3 CERTIFIED // DUAL-ENGINE
            </span>
          </div>
          <h1 className="font-grotesk text-2xl lg:text-3xl font-bold text-[#454640] tracking-tight mt-1">
            Underwater Digital Twin & Earth Visualization
          </h1>
          <p className="text-xs text-[#A69B89] mt-0.5 max-w-2xl">
            NOAA ETOPO1 Contourlines Earth, seamless subsea descent flight, physical cable repair simulation, and Ghost Mode operational replay.
          </p>
        </div>

        {/* Viewport Mode Switcher & PDF Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#E8D9BF] p-1 rounded-xl border border-[#D4C4A8] shadow-2xs font-mono text-xs">
            <button
              onClick={() => {
                setActiveMode('earth');
                handleReturnToEarth();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'earth' ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-xs' : 'text-[#454640] hover:bg-[#D4C4A8]'
              }`}
            >
              Earth (Contourlines)
            </button>
            <button
              onClick={() => {
                setActiveMode('underwater');
                handleStartTransition();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'underwater' ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-xs' : 'text-[#454640] hover:bg-[#D4C4A8]'
              }`}
            >
              Underwater 3D
            </button>
            <button
              onClick={() => setActiveMode('ghost')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeMode === 'ghost' ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-xs' : 'text-[#454640] hover:bg-[#D4C4A8]'
              }`}
            >
              Ghost Mode
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="btn-primary"
            title="Download PDF report with captured simulation frames"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Dossier PDF</span>
          </button>
        </div>
      </div>

      {/* Main Coordinated Dual-Renderer Viewport */}
      <div className="relative w-full rounded-2xl bg-[#F7F3EA] border border-[#D4C4A8] overflow-hidden shadow-xl aspect-[16/9] min-h-[580px]">
        {/* Layer 1: Contourlines Earth WebGL2 Canvas */}
        <div
          style={{ opacity: transitionState.earthOpacity }}
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeMode === 'ghost' ? 'pointer-events-none' : ''
          }`}
        >
          <ContourlinesGlobe
            ref={globeHandleRef}
            initialLon={activeFault.lon}
            initialLat={activeFault.lat}
            initialScale={2.4}
            onViewChange={setGlobeView}
          />

          {/* Submarine Cable & Fault SVG Overlay */}
          <CableNetworkOverlay
            cables={cables}
            selectedCable={selectedCable}
            activeFault={activeFault}
            viewState={globeView}
            project={projectCoordinates}
            onSelectCable={setSelectedCable}
            onInitiateRepairTransition={handleStartTransition}
            vesselProgress={transitionState.currentStage === 'vessel_transit' ? transitionState.stageProgress : 0}
          />
        </div>

        {/* Layer 2: Three.js Underwater Digital Twin Canvas */}
        <div
          style={{ opacity: activeMode === 'earth' ? transitionState.underwaterOpacity : 1.0 }}
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeMode === 'earth' && transitionState.underwaterOpacity === 0 ? 'pointer-events-none' : ''
          }`}
        >
          <UnderwaterScene
            ref={underwaterHandleRef}
            activeFault={activeFault}
            isGhostMode={activeMode === 'ghost'}
          />
        </div>

        {/* Transition Status HUD (Visible during descent journey) */}
        {transitionState.currentStage !== 'idle' && transitionState.currentStage !== 'repair_active' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-[#F7F3EA]/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-[#D4C4A8] shadow-xl flex items-center gap-3 font-mono text-xs text-[#454640] animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C87954]" />
            <span className="font-semibold">{transitionState.statusMessage}</span>
            <span className="px-2 py-0.5 rounded bg-[#E8D9BF] text-[#454640] font-bold border border-[#D4C4A8]">
              DEPTH: -{transitionState.currentDepthMeters}M
            </span>
          </div>
        )}

        {/* Layer 3: Ghost Mode Overlay */}
        {activeMode === 'ghost' && (
          <GhostModeOverlay
            activeFault={activeFault}
            simulationResult={simulationResult}
            currentStageIndex={currentStageIndex}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSetStage={handleSetStage}
            onSetSpeed={setPlaybackSpeed}
            onExportReport={handleExportPDF}
            onExitGhostMode={() => setActiveMode('underwater')}
          />
        )}
      </div>

      {/* Telemetry and Navigation Footer */}
      <div className="bg-white rounded-2xl border border-[#D4C4A8] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="text-xs font-semibold text-[#C87954] hover:underline flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Return to Global Overview</span>
          </Link>
          <span className="text-[#DDD3C3]">|</span>
          <span className="font-mono text-[11px] text-[#A69B89]">
            Current Fault Target: <strong>{activeFault.nearestLandingStation}</strong> ({activeFault.depthMeters}m depth)
          </span>
          <span className="text-[#DDD3C3]">|</span>
          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            DEMO / SIMULATED ENVIRONMENT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/workspace/operations" className="btn-secondary">
            <span>Simulate Disruption</span>
          </Link>

          <Link href="/workspace/war-room" className="btn-primary">
            <span>Recovery War Room</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
