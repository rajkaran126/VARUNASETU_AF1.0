'use client';

import React, { useState } from 'react';
import { FaultIncident, SimulationResult } from '@/lib/types';

export const REPAIR_STAGES = [
  { id: 1, name: 'Fault Pinpoint', desc: 'OTDR reflection isolates break at km 480', durationDays: 0.5 },
  { id: 2, name: 'Vessel Dispatch', desc: 'CS Sovereign departs Djibouti Port', durationDays: 1.0 },
  { id: 3, name: 'Vessel On-Site', desc: 'DP2 thrusters lock over benthic coordinates', durationDays: 0.5 },
  { id: 4, name: 'ROV Deployment', desc: 'Mini-ROV Guardian enters water column', durationDays: 0.5 },
  { id: 5, name: 'Model 12 Sonar Sweep', desc: 'Multibeam sonar identifies severed ends', durationDays: 1.0 },
  { id: 6, name: 'Transponder Tagging', desc: 'Acoustic beacons attached to seabed bight', durationDays: 0.5 },
  { id: 7, name: 'Cable Grappling', desc: 'Crane hook block hoists end #1 to ship deck', durationDays: 2.0 },
  { id: 8, name: 'Cable Preparation', desc: 'Armor peeled, buffer cleaned with alcohol', durationDays: 1.0 },
  { id: 9, name: 'Model 9 Fusion Splicing', desc: 'Ceramic v-groove alignment & electric arc weld', durationDays: 1.5 },
  { id: 10, name: 'Joint Sealing', desc: 'Universal Joint sealed with beryllium collars', durationDays: 1.0 },
  { id: 11, name: 'Integrity Testing', desc: 'Optical return loss <0.15 dB/km verified', durationDays: 0.5 },
  { id: 12, name: 'Cable Lowering', desc: 'Bight lowered to abyssal plain with tension control', durationDays: 1.0 },
  { id: 13, name: 'ROV Post-Lay Survey', desc: 'ROV inspects burial depth in sediment', durationDays: 0.5 },
  { id: 14, name: 'Network Handover', desc: 'Optical DWDM restored; carrier traffic normalized', durationDays: 0.5 },
];

interface GhostModeOverlayProps {
  activeFault: FaultIncident;
  simulationResult: SimulationResult;
  currentStageIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onSetStage: (index: number) => void;
  onSetSpeed: (speed: number) => void;
  onExportReport: () => void;
  onExitGhostMode: () => void;
}

export function GhostModeOverlay({
  activeFault,
  simulationResult,
  currentStageIndex,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onSetStage,
  onSetSpeed,
  onExportReport,
  onExitGhostMode,
}: GhostModeOverlayProps) {
  const [activeTab, setActiveTab] = useState<'theatre' | 'operations' | 'analysis' | 'copilot'>('theatre');

  const currentStage = REPAIR_STAGES[currentStageIndex] || REPAIR_STAGES[0];
  const progressPct = Math.round(((currentStageIndex + 1) / REPAIR_STAGES.length) * 100);

  // Compute live recovery values based on current stage
  const isSpliced = currentStageIndex >= 10;
  const recoveredThroughput = isSpliced
    ? activeFault.affectedTrafficTbps
    : +((activeFault.affectedTrafficTbps * (currentStageIndex / 14)) * 0.4).toFixed(1);
  const remainingLossDb = isSpliced
    ? 0.18
    : +(activeFault.opticalLossDb * (1 - currentStageIndex / 14)).toFixed(1);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 text-white font-body">
      {/* Top Bar: Ghost Status & Quick Mode Switcher */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-[#0B1D33]/92 backdrop-blur-md p-3 rounded-2xl border border-[#102A46] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-grotesk text-sm font-bold text-white tracking-wider">
              GHOST MODE // OPERATIONAL REPLAY
            </span>
          </div>
          <span className="text-white/20">|</span>
          <span className="font-mono text-[11px] text-cyan-300">
            INCIDENT: {activeFault.cableName} ({activeFault.nearestLandingStation})
          </span>
        </div>

        {/* Four Primary Area Tabs */}
        <div className="flex items-center gap-1 bg-[#102A46] p-1 rounded-xl border border-[#153A5B]">
          {(['theatre', 'operations', 'analysis', 'copilot'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-[#1677B8] text-white font-bold shadow-xs'
                  : 'text-[#91A1AF] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'theatre' ? 'Theatre' : tab === 'operations' ? 'Operations' : tab === 'analysis' ? 'Analysis' : 'Ghost Copilot'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportReport}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Dossier PDF</span>
          </button>

          <button
            onClick={onExitGhostMode}
            className="px-3 py-1.5 rounded-xl bg-[#102A46] hover:bg-[#153A5B] text-white font-mono text-xs transition-all border border-[#153A5B]"
          >
            Exit Ghost
          </button>
        </div>
      </div>

      {/* Floating Side Drawer for Active Area (Operations, Analysis, Copilot) */}
      {activeTab !== 'theatre' && (
        <div className="pointer-events-auto self-end w-96 max-w-full bg-[#0B1D33]/95 backdrop-blur-md p-5 rounded-2xl border border-[#153A5B] shadow-2xl space-y-4 my-auto animate-in fade-in slide-in-from-right-4">
          {/* AREA B: OPERATIONS & RESULTS */}
          {activeTab === 'operations' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-grotesk text-sm font-bold text-white">Simulation Operations & KPIs</span>
                <span className="text-cyan-300 font-bold">{progressPct}% RESTORED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#102A46] border border-[#153A5B]">
                  <span className="text-[#91A1AF] text-[9px] block">RECOVERED CAPACITY</span>
                  <strong className="text-emerald-400 text-sm">{recoveredThroughput} Tbps</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#102A46] border border-[#153A5B]">
                  <span className="text-[#91A1AF] text-[9px] block">OPTICAL ATTENUATION</span>
                  <strong className="text-rose-400 text-sm">{remainingLossDb} dB</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#102A46] border border-[#153A5B]">
                  <span className="text-[#91A1AF] text-[9px] block">SERVED TRAFFIC</span>
                  <strong className="text-white text-sm">{simulationResult.servedDemandTbps} Tbps</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#102A46] border border-[#153A5B]">
                  <span className="text-[#91A1AF] text-[9px] block">LATENCY PENALTY</span>
                  <strong className="text-amber-400 text-sm">+{isSpliced ? '0.0' : simulationResult.latencyDeltaMs}ms</strong>
                </div>
              </div>
              <p className="text-[10px] text-[#91A1AF] leading-relaxed pt-1">
                * Mathematical graph solver recalculates path allocation synchronously as optical splicing milestones complete.
              </p>
            </div>
          )}

          {/* AREA C: ANALYSIS & COMPARISONS */}
          {activeTab === 'analysis' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-grotesk text-sm font-bold text-white">Strategy Tradeoff Analysis</span>
                <span className="text-amber-300 font-bold">MODEL 2.4</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#102A46] border border-cyan-400/40">
                  <div className="flex justify-between items-center text-cyan-300 font-bold">
                    <span>A: Direct Splicing (Active)</span>
                    <span>12.5 Days</span>
                  </div>
                  <p className="text-[10px] text-[#91A1AF] mt-1">Universal Joint repair restores 100% capacity at $1.8M mobilization cost.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#091728] border border-white/5 opacity-70">
                  <div className="flex justify-between items-center text-white">
                    <span>B: Permanent Highway Reroute</span>
                    <span>2.0 Days</span>
                  </div>
                  <p className="text-[10px] text-[#91A1AF] mt-1">Leaves cable severed; permanent +44ms latency penalty via Cape of Good Hope.</p>
                </div>
              </div>
            </div>
          )}

          {/* AREA D: GHOST COPILOT */}
          {activeTab === 'copilot' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-grotesk text-sm font-bold text-white">Ghost Copilot Intelligence</span>
                </div>
                <span className="text-cyan-300 text-[10px]">DETERMINISTIC BUS</span>
              </div>
              <div className="p-3 rounded-xl bg-[#102A46] border border-[#153A5B] space-y-2 text-[11px] leading-relaxed text-[#DDF8FA]">
                <p>
                  <strong>Phase {currentStage.id}:</strong> {currentStage.name} is currently executing.
                </p>
                <p className="text-[#91A1AF]">
                  {currentStage.desc}. Vessel DP2 thrusters counteracting 2.4-knot Red Sea surface current.
                </p>
                <p className="text-emerald-400 font-semibold">
                  {isSpliced ? '✓ Optical circuit closed. Latency restored to nominal baseline.' : '⚡ Optical loss active. Network graph routing over AAE-1 & 2Africa.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Area A: Simulation Theatre Scrubber & Transport Controls */}
      <div className="pointer-events-auto bg-[#0B1D33]/94 backdrop-blur-md p-4 rounded-2xl border border-[#102A46] shadow-2xl space-y-3">
        {/* Scrubber Progress Bar with 14 Milestone Ticks */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-cyan-300 font-bold">
              STAGE {currentStage.id}/14: {currentStage.name.toUpperCase()}
            </span>
            <span className="text-[#91A1AF]">
              EST. DURATION: {currentStage.durationDays} DAYS · {progressPct}% RESTORED
            </span>
          </div>

          <div className="relative w-full h-3 bg-[#102A46] rounded-full overflow-hidden cursor-pointer">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-[#1677B8] to-[#13BFD3] transition-all duration-300"
            />
          </div>

          {/* Clickable Stage Ticks */}
          <div className="flex justify-between items-center pt-1.5 font-mono text-[9px] text-[#60758A]">
            {REPAIR_STAGES.map((st, idx) => (
              <button
                key={st.id}
                onClick={() => onSetStage(idx)}
                className={`transition-colors hover:text-white ${
                  idx === currentStageIndex ? 'text-cyan-400 font-bold' : idx < currentStageIndex ? 'text-emerald-400' : ''
                }`}
                title={`${st.id}: ${st.name}`}
              >
                {st.id}
              </button>
            ))}
          </div>
        </div>

        {/* Transport Controls (Play, Pause, Reset, Speeds) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#102A46]">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="px-4 py-1.5 rounded-xl bg-[#1677B8] hover:bg-[#075B91] text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95"
            >
              {isPlaying ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>PLAY REPLAY</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSetStage(0)}
              className="p-2 rounded-xl bg-[#102A46] hover:bg-[#153A5B] text-white transition-all"
              title="Reset to Stage 1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            <button
              onClick={() => onSetStage(Math.max(0, currentStageIndex - 1))}
              className="px-2.5 py-1.5 rounded-xl bg-[#102A46] hover:bg-[#153A5B] text-white font-mono text-xs"
            >
              PREV
            </button>
            <button
              onClick={() => onSetStage(Math.min(REPAIR_STAGES.length - 1, currentStageIndex + 1))}
              className="px-2.5 py-1.5 rounded-xl bg-[#102A46] hover:bg-[#153A5B] text-white font-mono text-xs"
            >
              NEXT
            </button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 font-mono text-xs bg-[#102A46] p-1 rounded-xl">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  playbackSpeed === spd
                    ? 'bg-[#1677B8] text-white font-bold'
                    : 'text-[#91A1AF] hover:text-white'
                }`}
              >
                {spd}X
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
