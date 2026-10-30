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

  return (
    <div className="space-y-4">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D4C4A8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A69B89] uppercase tracking-widest">
              Section 02 · Subsea Digital Twin
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8D9BF] text-[#454640] border border-[#D4C4A8]">
              4-Stage Simulation
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#454640] tracking-tight mt-1 font-sans">
            Subsea Cable Repair Simulation
          </h1>
          <p className="text-xs text-[#A69B89] mt-0.5 max-w-2xl">
            Sequential 3D simulation: Earth network view → surface vessel transit → ROV descent → seabed cable repair.
          </p>
        </div>

        {/* PDF Export + Ghost Mode toggle (stage 4 only) */}
        <div className="flex items-center gap-2">
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

      {/* ── Main Viewport ── */}
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

      {/* ── Footer ── */}
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
            Fault Target: <strong>{activeFault.nearestLandingStation}</strong> ({activeFault.depthMeters}m depth)
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
