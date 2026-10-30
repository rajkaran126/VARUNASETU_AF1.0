'use client';

import React from 'react';
import { CableRoute, FaultIncident } from '@/lib/types';
import { GlobeViewState } from './ContourlinesGlobe';

interface CableNetworkOverlayProps {
  cables: CableRoute[];
  selectedCable: CableRoute;
  activeFault: FaultIncident;
  viewState: GlobeViewState;
  project: (lon: number, lat: number) => { x: number; y: number; visible: boolean; z: number };
  onSelectCable: (cable: CableRoute) => void;
  onInitiateRepairTransition: () => void;
  vesselProgress?: number; // 0.0 to 1.0 (transit from Djibouti to Bab el-Mandeb)
}

export function CableNetworkOverlay({
  cables,
  selectedCable,
  activeFault,
  viewState,
  project,
  onSelectCable,
  onInitiateRepairTransition,
  vesselProgress = 0.0,
}: CableNetworkOverlayProps) {
  // Fault coordinate projection
  const faultPos = project(activeFault.lon, activeFault.lat);

  // Simulated Vessel dispatch path: from Djibouti Port (43.15, 11.60) to Fault (43.30, 12.30)
  const portLon = 43.15;
  const portLat = 11.60;
  const vesselLon = portLon + (activeFault.lon - portLon) * Math.min(1.0, vesselProgress);
  const vesselLat = portLat + (activeFault.lat - portLat) * Math.min(1.0, vesselProgress);
  const vesselPos = project(vesselLon, vesselLat);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <svg className="w-full h-full">
        <defs>
          {/* Cyan Glow for Selected Cable */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Fault Pulse Glow */}
          <radialGradient id="faultGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* 1. Render All Submarine Cable Trunkline Segments */}
        {cables.map((cable) => {
          const isSelected = cable.id === selectedCable.id;
          const isDamaged = cable.id === activeFault.cableId;

          if (cable.landingStations.length < 2) return null;

          // Project connected points
          const points = cable.landingStations.map((ls) => project(ls.lon, ls.lat));
          const allVisible = points.some((p) => p.visible);
          if (!allVisible) return null;

          // Build SVG path
          let d = `M ${points[0].x} ${points[0].y}`;
          for (let i = 1; i < points.length; i++) {
            const p = points[i];
            const prev = points[i - 1];
            // Smooth curve
            const midX = (prev.x + p.x) / 2;
            const midY = (prev.y + p.y) / 2;
            d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY} T ${p.x} ${p.y}`;
          }

          return (
            <g key={cable.id} className="pointer-events-auto cursor-pointer" onClick={() => onSelectCable(cable)}>
              {/* Invisible wider hit area for easy selection */}
              <path d={d} fill="none" stroke="transparent" strokeWidth="16" />

              {/* Base Cable Glow / Line */}
              <path
                d={d}
                fill="none"
                stroke={
                  isSelected
                    ? '#13BFD3'
                    : isDamaged
                    ? '#DC2626'
                    : '#1677B8'
                }
                strokeWidth={isSelected ? '2.5' : '1.2'}
                strokeOpacity={isSelected ? '0.95' : '0.45'}
                strokeDasharray={isDamaged ? '4 3' : undefined}
                filter={isSelected ? 'url(#cyanGlow)' : undefined}
                className="transition-all duration-300"
              />
            </g>
          );
        })}

        {/* 2. Landing Stations */}
        {selectedCable.landingStations.map((ls) => {
          const pos = project(ls.lon, ls.lat);
          if (!pos.visible) return null;
          return (
            <g key={ls.id} className="pointer-events-auto">
              <circle cx={pos.x} cy={pos.y} r="3" fill="#DDF8FA" stroke="#13BFD3" strokeWidth="1.5" />
              {viewState.scale > 4.0 && (
                <text
                  x={pos.x + 6}
                  y={pos.y + 3}
                  fill="#F5FAFF"
                  fontSize="9"
                  fontFamily="monospace"
                  className="select-none pointer-events-none drop-shadow"
                >
                  {ls.city}
                </text>
              )}
            </g>
          );
        })}

        {/* 3. Simulated Vessel Transit Path */}
        {vesselPos.visible && (
          <g>
            <circle cx={vesselPos.x} cy={vesselPos.y} r="5" fill="#13BFD3" className="animate-pulse" />
            <circle cx={vesselPos.x} cy={vesselPos.y} r="10" fill="none" stroke="#13BFD3" strokeWidth="1" opacity="0.6" />
            <text
              x={vesselPos.x + 10}
              y={vesselPos.y + 4}
              fill="#13BFD3"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              CS SOVEREIGN (DP2)
            </text>
          </g>
        )}

        {/* 4. Active Fault Beacon */}
        {faultPos.visible && (
          <g
            className="pointer-events-auto cursor-pointer"
            onClick={onInitiateRepairTransition}
          >
            <title>Click to initiate Earth-to-Underwater Dive & Repair Simulation</title>
            <circle cx={faultPos.x} cy={faultPos.y} r="28" fill="url(#faultGlow)" className="animate-pulse" />
            <circle cx={faultPos.x} cy={faultPos.y} r="14" fill="none" stroke="#DC2626" strokeWidth="1.5" className="animate-ping" />
            <circle cx={faultPos.x} cy={faultPos.y} r="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Floating Floating Fault Card Overlay */}
      {faultPos.visible && (
        <div
          style={{
            left: `${Math.min(window.innerWidth - 320, Math.max(20, faultPos.x + 18))}px`,
            top: `${Math.min(window.innerHeight - 240, Math.max(20, faultPos.y - 40))}px`,
          }}
          className="absolute pointer-events-auto bg-[#0B1D33]/92 backdrop-blur-md p-3.5 rounded-xl border border-[#DC2626]/40 shadow-2xl w-64 text-white z-20 space-y-2 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-600/40">
              ACTIVE SEVERANCE
            </span>
            <span className="font-mono text-[9px] text-cyan-300 animate-pulse">
              DEPTH: -{activeFault.depthMeters}M
            </span>
          </div>

          <div>
            <h4 className="font-grotesk text-xs font-bold text-white tracking-wide">
              {activeFault.cableName}
            </h4>
            <p className="font-mono text-[10px] text-[#91A1AF] mt-0.5">
              {activeFault.nearestLandingStation} ({activeFault.lat.toFixed(2)}°N, {activeFault.lon.toFixed(2)}°E)
            </p>
          </div>

          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between font-mono text-[9px] text-white/70">
            <span>Attenuation: <strong className="text-rose-400">{activeFault.opticalLossDb} dB</strong></span>
            <span>Flow: <strong className="text-amber-400">{activeFault.affectedTrafficTbps} T</strong></span>
          </div>

          <button
            onClick={onInitiateRepairTransition}
            className="w-full py-1.5 px-3 rounded-lg bg-[#1677B8] hover:bg-[#075B91] text-white text-[11px] font-mono font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <span>DESCEND & REPAIR</span>
            <svg className="w-3 h-3 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
