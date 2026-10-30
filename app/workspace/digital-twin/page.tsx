'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { SubseaSimulation, SubseaSimulationHandle, SimStage } from '@/components/digital-twin/SubseaSimulation';
import { GhostModeOverlay, REPAIR_STAGES } from '@/components/digital-twin/GhostModeOverlay';
import { generateSimulationPDFReport, ReportScreenshot } from '@/lib/pdf-report-generator';

export default function UnderwaterDigitalTwinPage() {
  const {
    activeFault,
    simulationResult,
    executeSimulation,
    selectedCable,
  } = useWorkspace();

  // 4-stage simulation state
  const [simStage, setSimStage] = useState<SimStage>(1);

  // Depth Layers from Vishwas Section 2 architecture
  const [selectedDepthLayer, setSelectedDepthLayer] = useState<string>('Benthic');

  const depthLayers = [
    { name: 'Surface (0m)', key: 'Surface', depthStage: 2 as SimStage, pressure: '0.10 MPa', temp: '26.4°C', light: '100% Sunlight' },
    { name: 'Epipelagic (-200m)', key: 'Epipelagic', depthStage: 3 as SimStage, pressure: '2.11 MPa', temp: '18.2°C', light: '1% Euphotic' },
    { name: 'Mesopelagic (-1,000m)', key: 'Mesopelagic', depthStage: 3 as SimStage, pressure: '10.2 MPa', temp: '6.1°C', light: '0% Aphotic' },
    { name: 'Bathypelagic (-4,000m)', key: 'Bathypelagic', depthStage: 3 as SimStage, pressure: '41.5 MPa', temp: '2.4°C', light: 'Bioluminescent' },
    { name: 'Benthic Bed (-4,120m)', key: 'Benthic', depthStage: 4 as SimStage, pressure: '42.8 MPa', temp: '1.9°C', light: 'ROV LED Illuminator' },
  ];

  // Operational Sequence steps from Vishwas branch
  const [ghostSimRunning, setGhostSimRunning] = useState<boolean>(false);
  const [ghostSimStep, setGhostSimStep] = useState<number>(0);

  const ghostSequenceSteps = [
    { title: '1. Cable Rupture Alarm', status: 'Detected', time: 'T+00:00', detail: 'DWDM signal loss on Segment 4 (OTDR reflection at 640km).' },
    { title: '2. Autonomous ROV Deployment', status: 'Standby', time: 'T+38:00', detail: 'Hector 6000 ROV descends to -4,120m benthic furrow.' },
    { title: '3. Acoustic Beacon Pinpoint', status: 'Queued', time: 'T+42:30', detail: 'Sonar transponder locates severed fiber end in silt.' },
    { title: '4. Bight Grapnel Retrieval', status: 'Queued', time: 'T+48:00', detail: 'Hydraulic grapnel hauls cable bight to vessel deck.' },
    { title: '5. Universal Joint Fusion Splice', status: 'Queued', time: 'T+72:00', detail: 'Cleanroom fusion splicing of 12 fiber cores with steel armor.' },
    { title: '6. Optical Loopback Restoration', status: 'Queued', time: 'T+96:00', detail: 'Continuity verified; cable re-laid into seabed trench.' },
  ];

  // 3D Assets registry from Vishwas branch (including the new ocean surface wave model)
  const registered3DAssets = [
    { name: 'ocean_wave_-__wmaya.glb', type: 'Surface Sea Wave (Maya)', size: '44.7 MB', status: 'Validated (Stage 2 Surface)' },
    { name: 'cargo-ship.glb', type: 'Surface Vessel Hull', size: '2.4 MB', status: 'Validated (Stage 2 Transit)' },
    { name: 'globe_ribbons.gltf (Model 1)', type: 'Planetary Cable Globe', size: '14.7 MB', status: 'Validated (Stage 1 Map)' },
    { name: 'mini-rov-guardian.zip', type: 'ROV Submersible Chassis', size: '7.5 MB', status: 'Validated (Stage 3 & 4)' },
    { name: 'oceanfloor.zip', type: 'Bathymetric Seabed Mesh', size: '23.6 MB', status: 'Validated (Stage 4 Seabed)' },
    { name: 'crane-hook-block.glb', type: 'Deck Rigging & Winch', size: '1.7 MB', status: 'Validated' },
    { name: 'robotic_manipulator.glb', type: 'ROV Grabber Arm', size: '1.9 MB', status: 'Validated' },
    { name: 'model.glb / one-person-submarine.glb', type: 'Auxiliary Sub', size: '600 KB', status: 'Validated' },
  ];

  // Ghost Mode (repair timeline overlay) — accessible in stage 4 only
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [capturedFrames, setCapturedFrames] = useState<ReportScreenshot[]>([]);

  const simRef = useRef<SubseaSimulationHandle | null>(null);

  // Capture frames for PDF
  const captureCurrentSimulationFrame = useCallback(
    (caption: string) => {
      if (simRef.current) {
        const dataUrl = simRef.current.captureFrame();
        if (dataUrl) {
          const newScreenshot: ReportScreenshot = {
            dataUrl,
            caption: `${caption} — Cable ${activeFault.cableName} at ${activeFault.nearestLandingStation}`,
            timestamp: new Date().toISOString(),
            stageName: REPAIR_STAGES[currentStageIndex]?.name || 'Repair',
          };
          setCapturedFrames((prev) => [newScreenshot, ...prev.slice(0, 3)]);
        }
      }
    },
    [activeFault, currentStageIndex]
  );

  // Ghost mode stage ticker
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        const next = prev + 1;
        if (next >= REPAIR_STAGES.length) {
          setIsPlaying(false);
          return prev;
        }
        if (next === 8 || next === 10 || next === 13) {
          captureCurrentSimulationFrame(REPAIR_STAGES[next].name);
        }
        if (next === 11) {
          executeSimulation();
        }
        return next;
      });
    }, 2800 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, executeSimulation, captureCurrentSimulationFrame]);

  const handleSetStage = (stageIdx: number) => {
    setCurrentStageIndex(stageIdx);
    captureCurrentSimulationFrame(REPAIR_STAGES[stageIdx].name);
  };

  const handleExportPDF = () => {
    if (capturedFrames.length === 0 && simRef.current) {
      const dataUrl = simRef.current.captureFrame();
      if (dataUrl) {
        const immediate: ReportScreenshot = {
          dataUrl,
          caption: `Live Inspection Capture — ${activeFault.cableName} at -${activeFault.depthMeters}m`,
          timestamp: new Date().toISOString(),
          stageName: REPAIR_STAGES[currentStageIndex]?.name ?? 'Inspection',
        };
        generateSimulationPDFReport(activeFault, simulationResult, [immediate]);
        return;
      }
    }
    generateSimulationPDFReport(activeFault, simulationResult, capturedFrames);
  };

  // Replay Ghost Recovery Sequence (Vishwas flow)
  const handleTriggerGhostReplay = () => {
    setGhostSimRunning(true);
    setGhostSimStep(1);
    setSimStage(1);

    const interval = setInterval(() => {
      setGhostSimStep((prev) => {
        const next = prev + 1;
        if (next === 2) setSimStage(2);
        if (next === 3) setSimStage(3);
        if (next >= 4) setSimStage(4);

        if (next >= 6) {
          clearInterval(interval);
          setGhostSimRunning(false);
          executeSimulation();
          return 6;
        }
        return next;
      });
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* ── Section Header (Vishwas Section 02 Architecture) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D4C4A8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A69B89] uppercase tracking-widest">
              SECTION 02 // SUBSEA SIMULATION ENCLAVE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8D9BF] text-[#454640] border border-[#D4C4A8]">
              4-STAGE DIGITAL TWIN
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#454640] tracking-tight mt-1 font-sans">
            Underwater Digital Twin
          </h1>
          <p className="text-xs text-[#A69B89] mt-0.5 max-w-2xl">
            High-fidelity subsea telemetry and bathymetric spatial foundation: Earth network overview → ocean vessel transit → ROV descent → seabed cable repair.
          </p>
        </div>

        {/* Canonical Sync Badge & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#D4C4A8] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#83B9A9] animate-pulse" />
            <span className="font-mono text-[11px] text-[#454640] font-semibold">
              Synced with {selectedCable.name}
            </span>
          </div>

          {simStage === 4 && (
            <button
              onClick={() => setIsGhostMode((v) => !v)}
              className={`btn-secondary text-xs ${isGhostMode ? 'bg-[#83B9A9] text-[#454640]' : ''}`}
            >
              {isGhostMode ? 'Exit Ghost Mode' : 'Ghost Mode'}
            </button>
          )}

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

      {/* ── Main 3D Simulation Viewport Enclave ── */}
      <div className="relative w-full rounded-2xl bg-[#021424] border border-[#D4C4A8] overflow-hidden shadow-xl aspect-[16/9] min-h-[580px]">
        <SubseaSimulation
          ref={simRef}
          activeFault={activeFault}
          currentRepairStage={currentStageIndex}
          isGhostMode={isGhostMode}
          onStageChange={setSimStage}
        />

        {/* Ghost Mode overlay (stage 4) */}
        {isGhostMode && simStage === 4 && (
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
            onExitGhostMode={() => setIsGhostMode(false)}
          />
        )}
      </div>

      {/* ── Subsea Telemetry & Operational Sequence (Section 2 Vishwas Architecture) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subsea Bathymetric Stratification & 3D Asset Readiness (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D4C4A8] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
            <div>
              <h3 className="text-base font-bold text-[#454640]">
                Bathymetric Stratification
              </h3>
              <p className="font-mono text-[10px] text-[#A69B89]">
                Depth, Hydrostatic Pressure & Illumination Gradient
              </p>
            </div>
            <span className="font-mono text-[10px] text-[#454640] bg-[#E8D9BF] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-[#D4C4A8]">
              Target: -{activeFault.depthMeters}M
            </span>
          </div>

          {/* Depth Layer Selection Cards */}
          <div className="space-y-2">
            {depthLayers.map((layer) => {
              const isSelected = selectedDepthLayer === layer.key;
              return (
                <div
                  key={layer.key}
                  onClick={() => {
                    setSelectedDepthLayer(layer.key);
                    setSimStage(layer.depthStage);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F7F3EA] border-[#83B9A9] shadow-xs ring-1 ring-[#83B9A9]/50'
                      : 'bg-[#FAF7F2] border-[#E8D9BF] hover:bg-white hover:border-[#D4C4A8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#454640]">{layer.name}</span>
                    <span className="font-mono text-[10px] text-[#C87954] font-semibold">{layer.pressure}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#A69B89]">
                    <span>Temp: {layer.temp}</span>
                    <span>Illumination: {layer.light}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3D Asset Readiness Verification (From Vishwas Section 2) */}
          <div className="pt-3 border-t border-[#FAF7F2]">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#A69B89] mb-2 font-semibold">
              3D GLB Asset Pipeline Readiness
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {registered3DAssets.map((asset, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8D9BF] text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-[#454640] text-[11px]">{asset.name}</span>
                    <span className="text-[10px] text-[#A69B89]">{asset.type} · {asset.size}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#687B59] bg-[#A8B99A]/20 px-2 py-0.5 rounded font-bold border border-[#A8B99A]/40 whitespace-nowrap">
                    {asset.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Ghost Simulation Sequence Progression (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D4C4A8] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
            <div>
              <h3 className="text-base font-bold text-[#454640]">
                Operational Sequence & Repair Replay
              </h3>
              <p className="font-mono text-[10px] text-[#A69B89]">
                End-to-End Benthic Cable Restoration Sequence
              </p>
            </div>
            <button
              onClick={handleTriggerGhostReplay}
              disabled={ghostSimRunning}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold tracking-wide transition-all shadow-xs ${
                ghostSimRunning
                  ? 'bg-[#E99A65] text-white cursor-wait animate-pulse'
                  : 'bg-[#C87954] hover:bg-[#b56843] text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{ghostSimRunning ? `STEP ${ghostSimStep}/6...` : 'REPLAY SEQUENCE'}</span>
            </button>
          </div>

          {/* Step Progression Timeline Cards */}
          <div className="space-y-3">
            {ghostSequenceSteps.map((step, idx) => {
              const isCurrent = ghostSimStep === idx + 1;
              const isPast = ghostSimStep > idx + 1;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#F7F3EA] border-[#C87954] ring-1 ring-[#C87954]/50'
                      : isPast
                      ? 'bg-[#A8B99A]/15 border-[#A8B99A]/40'
                      : 'bg-[#FAF7F2] border-[#E8D9BF]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#454640]">
                      {step.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#A69B89]">{step.time}</span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isPast
                            ? 'bg-[#A8B99A]/30 text-[#454640] border border-[#A8B99A]'
                            : isCurrent
                            ? 'bg-[#C87954] text-white animate-pulse'
                            : 'bg-[#E8D9BF] text-[#454640]'
                        }`}
                      >
                        {isPast ? 'COMPLETED' : isCurrent ? 'IN PROGRESS' : step.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#454640]/80 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#FAF7F2]">
            <Link
              href="/workspace"
              className="text-xs font-semibold text-[#C87954] hover:underline flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Global Topology</span>
            </Link>

            <Link
              href="/workspace/war-room"
              className="btn-primary text-xs"
            >
              <span>Proceed to Recovery War Room</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Status Bar ── */}
      <div className="bg-white rounded-2xl border border-[#D4C4A8] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#A69B89]">
            Active Cable: <strong>{selectedCable.name}</strong>
          </span>
          <span className="text-[#DDD3C3]">|</span>
          <span className="font-mono text-[11px] text-[#A69B89]">
            Fault Location: <strong>{activeFault.nearestLandingStation}</strong> ({activeFault.depthMeters}m depth)
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
