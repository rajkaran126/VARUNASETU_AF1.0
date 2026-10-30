'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';

export default function UnderwaterDigitalTwinPage() {
  const { selectedCable, activeFault } = useWorkspace();
  const [selectedDepthLayer, setSelectedDepthLayer] = useState<string>('Benthic');
  const [cameraView, setCameraView] = useState<'Surface Vessel' | 'ROV Descent' | 'Seabed Tether' | 'Splice Enclosure'>('Seabed Tether');
  const [ghostSimRunning, setGhostSimRunning] = useState<boolean>(false);
  const [ghostSimStep, setGhostSimStep] = useState<number>(0);

  const depthLayers = [
    { name: 'Surface (0m)', key: 'Surface', pressure: '0.10 MPa', temp: '26.4°C', light: '100% Sunlight' },
    { name: 'Epipelagic (-200m)', key: 'Epipelagic', pressure: '2.11 MPa', temp: '18.2°C', light: '1% Euphotic' },
    { name: 'Mesopelagic (-1,000m)', key: 'Mesopelagic', pressure: '10.2 MPa', temp: '6.1°C', light: '0% Aphotic' },
    { name: 'Bathypelagic (-4,000m)', key: 'Bathypelagic', pressure: '41.5 MPa', temp: '2.4°C', light: 'Bioluminescent' },
    { name: 'Benthic Bed (-4,120m)', key: 'Benthic', pressure: '42.8 MPa', temp: '1.9°C', light: 'ROV LED Illuminator' },
  ];

  const ghostSequenceSteps = [
    { title: '1. Cable Rupture Alarm', status: 'Detected', time: 'T+00:00', detail: 'DWDM signal loss on Segment 4 (OTDR reflection at 640km).' },
    { title: '2. Autonomous ROV Deployment', status: 'Standby', time: 'T+38:00', detail: 'Hector 6000 ROV descends to -4,120m benthic furrow.' },
    { title: '3. Acoustic Beacon Pinpoint', status: 'Queued', time: 'T+42:30', detail: 'Sonar transponder locates severed fiber end in silt.' },
    { title: '4. Bight Grapnel Retrieval', status: 'Queued', time: 'T+48:00', detail: 'Hydraulic grapnel hauls cable bight to vessel deck.' },
    { title: '5. Universal Joint Fusion Splice', status: 'Queued', time: 'T+72:00', detail: 'Cleanroom fusion splicing of 12 fiber cores with steel armor.' },
    { title: '6. Optical Loopback Restoration', status: 'Queued', time: 'T+96:00', detail: 'Continuity verified; cable re-laid into seabed trench.' },
  ];

  const registered3DAssets = [
    { name: 'cargo-ship.glb', type: 'Vessel Hull', size: '2.4 MB', status: 'Validated (Ready for Three.js)' },
    { name: 'mini-rov-guardian.zip', type: 'ROV Submersible', size: '7.5 MB', status: 'Validated' },
    { name: 'oceanfloor.zip', type: 'Bathymetric Mesh', size: '23.6 MB', status: 'Validated' },
    { name: 'crane-hook-block.glb', type: 'Deck Rigging', size: '1.7 MB', status: 'Validated' },
    { name: 'robotic_manipulator.glb', type: 'ROV Grabber Arm', size: '1.9 MB', status: 'Validated' },
    { name: 'model.glb / one-person-submarine.glb', type: 'Auxiliary Sub', size: '600 KB', status: 'Validated' },
  ];

  const handleTriggerGhostReplay = () => {
    setGhostSimRunning(true);
    setGhostSimStep(1);
    const interval = setInterval(() => {
      setGhostSimStep(prev => {
        if (prev >= 6) {
          clearInterval(interval);
          setGhostSimRunning(false);
          return 6;
        }
        return prev + 1;
      });
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Title & Section Subheading */}
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
            Synced with {selectedCable.name}
          </span>
        </div>
      </div>

      {/* Main 3D Simulation Viewport Enclave (Dark interior strictly within viewport as allowed for simulation) */}
      <div className="relative w-full rounded-2xl bg-[#030914] border border-[#142B47] overflow-hidden shadow-lg aspect-[16/9] min-h-[440px] flex flex-col justify-between p-6">
        {/* HUD Brackets */}
        <div className="hud-bracket-tl" />
        <div className="hud-bracket-tr" />
        <div className="hud-bracket-bl" />
        <div className="hud-bracket-br" />

        {/* Viewport Top HUD Overlay */}
        <div className="flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3 bg-[#071322]/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-cyan-300 font-semibold tracking-wider text-[11px]">
              TWIN SENSOR FEED: -{activeFault.depthMeters}M BENTHIC
            </span>
            <span className="text-white/30">|</span>
            <span className="font-mono text-white/70 text-[11px]">
              LAT: {activeFault.lat.toFixed(4)}°N · LON: {activeFault.lon.toFixed(4)}°E
            </span>
          </div>

          {/* Camera View Switcher */}
          <div className="flex items-center gap-1.5 bg-[#071322]/80 backdrop-blur-md p-1 rounded-xl border border-white/10">
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
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="3" fill="#06B6D4" fillOpacity="0.4" />
            </svg>
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 animate-spin-slow" />
          </div>

          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-semibold mb-1">
              CAMERA PERSPECTIVE: {cameraView.toUpperCase()}
            </p>
            <h2 className="font-grotesk text-2xl font-bold text-white tracking-tight">
              Benthic Seabed & Subsea Cable Enclave
            </h2>
            <p className="text-white/60 text-xs font-body leading-relaxed mt-1">
              Physical bathymetry coordinates, ROV thruster vectoring, and optical fiber armor mesh are primed. 
              Three.js WebGL physics integration initializes in Phase 3.
            </p>
          </div>

          {/* Action Trigger for Ghost Mode */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleTriggerGhostReplay}
              disabled={ghostSimRunning}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold font-mono tracking-wider transition-all shadow-md ${
                ghostSimRunning
                  ? 'bg-amber-600 text-white cursor-wait'
                  : 'bg-white hover:bg-slate-100 text-[#09182B]'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-cyan-700" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{ghostSimRunning ? `EXECUTING GHOST STEP ${ghostSimStep}/6...` : 'REPLAY GHOST RECOVERY SIMULATION'}</span>
            </button>
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
            <p className="font-mono text-xs font-bold text-emerald-300">1.9°C (Abyssal)</p>
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

      {/* Two-Column Section: Bathymetric Depth Layers & Ghost Sequence Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bathymetric Layer Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
            <div>
              <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
                Bathymetric Environmental Layers
              </h3>
              <p className="font-mono text-[10px] text-[#59738A]">Depth attenuation model</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#0E2A47] bg-[#F5F0E6] px-2.5 py-1 rounded-lg">
              5 Layers
            </span>
          </div>

          <div className="space-y-2">
            {depthLayers.map((layer) => {
              const isSelected = selectedDepthLayer === layer.key;
              return (
                <div
                  key={layer.key}
                  onClick={() => setSelectedDepthLayer(layer.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBF3FA] border-[#A8CBE5] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#E8E1D5] hover:bg-white hover:border-[#D5CCBC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#0E2A47]">{layer.name}</span>
                    <span className="font-mono text-[10px] text-[#1E5685] font-semibold">{layer.pressure}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#59738A]">
                    <span>Temp: {layer.temp}</span>
                    <span>Illumination: {layer.light}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3D Asset Readiness Verification */}
          <div className="pt-3 border-t border-[#F0EBE0]">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-2 font-semibold">
              3D GLB Asset Pipeline Readiness (Phase 3 Assets)
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {registered3DAssets.map((asset, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8E1D5] text-[11px]">
                  <span className="font-mono font-bold text-[#0E2A47]">{asset.name}</span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                    {asset.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Ghost Simulation Sequence Progression (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
            <div>
              <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
                Operational Sequence & Repair Replay
              </h3>
              <p className="font-mono text-[10px] text-[#59738A]">
                End-to-end Benthic Cable Restoration Sequence
              </p>
            </div>
            <span className="font-mono text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              {ghostSimRunning ? 'Simulating Live...' : 'Ready for Execution'}
            </span>
          </div>

          {/* Step Progression Timeline */}
          <div className="space-y-3">
            {ghostSequenceSteps.map((step, idx) => {
              const isCurrent = ghostSimStep === idx + 1;
              const isPast = ghostSimStep > idx + 1;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50'
                      : isPast
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-[#FAF7F2] border-[#E8E1D5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#0E2A47]">
                      {step.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#59738A]">{step.time}</span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isPast
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrent
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-[#EAE4D7] text-[#556E84]'
                        }`}
                      >
                        {isPast ? 'COMPLETED' : isCurrent ? 'IN PROGRESS' : step.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#3E576F] leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#F0EBE0]">
            <Link
              href="/workspace"
              className="text-xs font-semibold text-[#185382] hover:underline"
            >
              ← Back to Global Topology
            </Link>

            <Link
              href="/workspace/war-room"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E2A47] hover:bg-[#153B5B] text-white text-xs font-semibold shadow-xs"
            >
              <span>Proceed to Recovery War Room</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
