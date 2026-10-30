'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';

export default function UnderwaterDigitalTwinPage() {
  const { selectedCable, activeFault } = useWorkspace();
  const [cameraView, setCameraView] = useState<'Surface Vessel' | 'ROV Descent' | 'Seabed Tether' | 'Splice Enclosure'>('Seabed Tether');
  const [activeTelemetryMode, setActiveTelemetryMode] = useState<'Optical' | 'Acoustic' | 'Hydrodynamic'>('Optical');

  return (
    <div className="space-y-6">
      {/* Title & Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 02 // SUBSEA SIMULATION ENCLAVE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              PHASE 3 VIEWPORT FOUNDATION
            </span>
          </div>
          <h1 className="font-grotesk text-2xl lg:text-3xl font-bold text-[#0E2A47] tracking-tight mt-1">
            Underwater Digital Twin
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            High-fidelity subsea telemetry and bathymetric spatial foundation. Prepares the 3D scene architecture, ROV inspection parameters, and operational replay pipeline.
          </p>
        </div>

        {/* Canonical Sync Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DDD3C3] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] text-[#0E2A47] font-semibold">
            Target: {selectedCable.name}
          </span>
        </div>
      </div>

      {/* Main 3D Simulation Viewport Enclave */}
      <div className="relative w-full rounded-2xl bg-[#030914] border border-[#142B47] overflow-hidden shadow-lg aspect-[16/9] min-h-[520px] flex flex-col justify-between p-6">
        {/* HUD Brackets */}
        <div className="hud-bracket-tl" />
        <div className="hud-bracket-tr" />
        <div className="hud-bracket-bl" />
        <div className="hud-bracket-br" />

        {/* Viewport Top HUD Overlay */}
        <div className="flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3 bg-[#071322]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-cyan-300 font-semibold tracking-wider text-[11px]">
              TWIN SENSOR FEED: -{activeFault.depthMeters}M BENTHIC
            </span>
            <span className="text-white/30">|</span>
            <span className="font-mono text-white/70 text-[11px]">
              LAT: {activeFault.lat.toFixed(4)}°N · LON: {activeFault.lon.toFixed(4)}°E
            </span>
          </div>

          {/* Telemetry Sensor Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#071322]/85 backdrop-blur-md p-1 rounded-xl border border-white/10">
            {(['Optical', 'Acoustic', 'Hydrodynamic'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveTelemetryMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                  activeTelemetryMode === mode
                    ? 'bg-[#184872] text-white font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>

          {/* Camera Perspective Switcher */}
          <div className="flex items-center gap-1.5 bg-[#071322]/85 backdrop-blur-md p-1 rounded-xl border border-white/10">
            {(['Surface Vessel', 'ROV Descent', 'Seabed Tether', 'Splice Enclosure'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCameraView(view)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                  cameraView === view
                    ? 'bg-[#184872] text-white font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Center 3D Simulation Enclave Display */}
        <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 z-10 px-4">
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center relative shadow-[0_0_60px_rgba(6,182,212,0.18)]">
            <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="3" fill="#06B6D4" fillOpacity="0.4" />
            </svg>
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 animate-spin-slow" />
          </div>

          <div className="max-w-lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-semibold mb-1">
              CAMERA PERSPECTIVE: {cameraView.toUpperCase()} · SENSOR: {activeTelemetryMode.toUpperCase()}
            </p>
            <h2 className="font-grotesk text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Benthic Seabed & Subsea Cable Enclave
            </h2>
            <p className="text-white/65 text-xs font-body leading-relaxed mt-1.5">
              Physical bathymetry coordinates, ROV thruster vectoring, and optical fiber armor mesh are primed. 
              The interactive 3D Earth, ocean floor physics, and subsea repair simulation will execute within this viewport in Phase 3.
            </p>
          </div>
        </div>

        {/* Viewport Bottom Live Telemetry Overlay */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#071322]/85 backdrop-blur-md p-3.5 rounded-xl border border-white/10 z-10 text-left">
          <div>
            <p className="font-mono text-[9px] text-white/50 uppercase">Hydrostatic Pressure</p>
            <p className="font-mono text-xs font-bold text-cyan-300">42.8 MPa (422 atm)</p>
          </div>
          <div>
            <p className="font-mono text-[9px] text-white/50 uppercase">Water Temperature</p>
            <p className="font-mono text-xs font-bold text-emerald-300">1.9°C (Abyssal Plain)</p>
          </div>
          <div>
            <p className="font-mono text-[9px] text-white/50 uppercase">Seafloor Substrate</p>
            <p className="font-mono text-xs font-bold text-amber-300">Basalt & Pelagic Silt</p>
          </div>
          <div>
            <p className="font-mono text-[9px] text-white/50 uppercase">Optical Attenuation</p>
            <p className="font-mono text-xs font-bold text-rose-300">42.8 dB (Cut Isolated)</p>
          </div>
        </div>
      </div>

      {/* Rebalanced Bottom Action & Navigation Bar */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="text-xs font-semibold text-[#185382] hover:underline flex items-center gap-1.5"
          >
            <span>← Return to Global Topology</span>
          </Link>
          <span className="text-[#DDD3C3]">|</span>
          <span className="font-mono text-[11px] text-[#5A738A]">
            Current Fault Target: <strong>{activeFault.nearestLandingStation}</strong> ({activeFault.depthMeters}m depth)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/workspace/operations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D5CCBC] bg-white hover:bg-[#FAF7F1] text-xs font-semibold text-[#153B5B] shadow-2xs transition-all"
          >
            <span>Simulate Disruption</span>
          </Link>

          <Link
            href="/workspace/war-room"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E2A47] hover:bg-[#153B5B] text-white text-xs font-semibold shadow-xs transition-all"
          >
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
