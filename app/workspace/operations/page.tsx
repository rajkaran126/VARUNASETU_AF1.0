'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { FaultType, ScenarioConfig } from '@/lib/types';

export default function NetworkOperationsPage() {
  const { 
    cables, 
    selectedCable, 
    activeFault, 
    activeScenario, 
    setActiveScenario, 
    simulationResult, 
    executeSimulation,
    saveCurrentSnapshot
  } = useWorkspace();

  // Form state for scenario configuration
  const [selectedCableIds, setSelectedCableIds] = useState<string[]>(activeScenario.selectedCableIds);
  const [faultType, setFaultType] = useState<FaultType>(activeScenario.faultType);
  const [trafficDemand, setTrafficDemand] = useState<number>(activeScenario.trafficDemandAssumptionTbps);
  const [durationHours, setDurationHours] = useState<number>(activeScenario.failureDurationHours);
  const [alternateRoutes, setAlternateRoutes] = useState<string[]>(activeScenario.availableAlternateRoutes);
  const [snapshotName, setSnapshotName] = useState<string>('');
  const [snapshotSaved, setSnapshotSaved] = useState<boolean>(false);

  // Available fault types
  const faultTypes: FaultType[] = [
    'Physical Anchor Drag',
    'Benthic Rupture / Seismic',
    'Subsea Landslide',
    'Repeater / Amplifier Failure',
    'Shunt Fault (Insulation Breakdown)',
    'Commercial Fishing Gear Entanglement'
  ];

  const handleToggleCable = (cableId: string) => {
    setSelectedCableIds(prev => 
      prev.includes(cableId) 
        ? (prev.length > 1 ? prev.filter(id => id !== cableId) : prev) 
        : [...prev, cableId]
    );
  };

  const handleToggleAlternateRoute = (routeId: string) => {
    setAlternateRoutes(prev =>
      prev.includes(routeId)
        ? (prev.length > 1 ? prev.filter(id => id !== routeId) : prev)
        : [...prev, routeId]
    );
  };

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedScenario: ScenarioConfig = {
      ...activeScenario,
      selectedCableIds,
      faultType,
      trafficDemandAssumptionTbps: trafficDemand,
      failureDurationHours: durationHours,
      availableAlternateRoutes: alternateRoutes
    };
    setActiveScenario(updatedScenario);
    executeSimulation(updatedScenario);
  };

  const handleSaveSnapshot = () => {
    saveCurrentSnapshot(snapshotName || `Scenario ${selectedCableIds.join('+')} (${faultType})`);
    setSnapshotSaved(true);
    setTimeout(() => setSnapshotSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title & Section Subheading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 03 // OPERATIONS & RESILIENCE MODELING
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              DETERMINISTIC SIMKERNEL 2.4
            </span>
          </div>
          <h1 className="font-grotesk text-2xl lg:text-3xl font-bold text-[#0E2A47] tracking-tight mt-1">
            Network Operations & Simulation
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Live optical layer telemetry monitoring, multi-point benthic severance modeling, and deterministic capacity/latency simulation.
          </p>
        </div>

        {/* Engine Seed & Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DDD3C3] shadow-2xs font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[#59738A]">Seed:</span>
          <span className="font-bold text-[#0E2A47]">{simulationResult.randomSeed}</span>
          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            DETERMINISTIC
          </span>
        </div>
      </div>

      {/* Optical Layer Monitoring Diagnostics (Real-time Telemetry Grid) */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0EBE0] mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-grotesk text-base font-bold text-[#0E2A47]">
              Optical DWDM Layer Telemetry Diagnostics
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#59738A]">
            Monitored: Segment 4 (Bab el-Mandeb) · OTDR Ingest
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
            <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">OSNR Margin</p>
            <p className="font-mono text-lg font-bold text-amber-700 mt-0.5">14.2 dB</p>
            <p className="font-mono text-[9px] text-[#7A8E9F] mt-1">Nominal: ≥18.5 dB</p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
            <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">Power Attenuation</p>
            <p className="font-mono text-lg font-bold text-rose-700 mt-0.5">0.38 dB/km</p>
            <p className="font-mono text-[9px] text-[#7A8E9F] mt-1">High attenuation alert</p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
            <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">Chromatic Dispersion</p>
            <p className="font-mono text-lg font-bold text-[#0E2A47] mt-0.5">17.8 ps/nm</p>
            <p className="font-mono text-[9px] text-emerald-700 mt-1">DSP compensated</p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
            <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">Pre-FEC BER</p>
            <p className="font-mono text-lg font-bold text-amber-700 mt-0.5">2.4 × 10⁻³</p>
            <p className="font-mono text-[9px] text-[#7A8E9F] mt-1">Correctable range</p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
            <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">BGP Flaps (1hr)</p>
            <p className="font-mono text-lg font-bold text-rose-700 mt-0.5">12 Flaps</p>
            <p className="font-mono text-[9px] text-[#7A8E9F] mt-1">Transit ASN 4755</p>
          </div>
        </div>

        <div className="mt-3 p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Analytical Caution:</strong> Optical attenuation anomalies indicate physical microbending or optical amplifier degradation; verification by subsea ROV or marine survey is required before declaring complete physical severance.
          </span>
        </div>
      </div>

      {/* Two-Column: Scenario Configuration Form & Deterministic Output Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scenario Configuration Panel (5 cols) */}
        <form onSubmit={handleRunSimulation} className="lg:col-span-5 bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
            <div>
              <h2 className="font-grotesk text-base font-bold text-[#0E2A47]">
                Failure Scenario Injection
              </h2>
              <p className="font-mono text-[10px] text-[#59738A]">
                Configure disruption parameters
              </p>
            </div>
            <button
              type="submit"
              className="btn-primary"
            >
              Run Model
            </button>
          </div>

          {/* Target Cable Selection (Multi-select) */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-1.5">
              Impacted Subsea Cables ({selectedCableIds.length} Selected)
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {cables.map((c) => {
                const isSelected = selectedCableIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleCable(c.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                        : 'bg-[#FAF7F2] border-[#E8E1D5] text-[#36506A] hover:bg-white'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="font-mono text-[10px]">{isSelected ? 'SEVERED' : 'NOMINAL'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failure Type Dropdown */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-1.5">
              Failure Hazard Type
            </label>
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value as FaultType)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-xs text-[#0E2A47] focus:outline-none focus:border-[#1E4E79] font-body"
            >
              {faultTypes.map((ft) => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          </div>

          {/* Traffic Demand Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#69829A]">
                Offered Traffic Demand Assumption
              </label>
              <span className="font-mono text-xs font-bold text-[#0E2A47]">
                {trafficDemand} Tbps
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={trafficDemand}
              onChange={(e) => setTrafficDemand(Number(e.target.value))}
              className="w-full accent-[#0E2A47]"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#7A8E9F]">
              <span>10 Tbps</span>
              <span>80 Tbps</span>
              <span>150 Tbps</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#69829A]">
                Estimated Outage Duration
              </label>
              <span className="font-mono text-xs font-bold text-[#0E2A47]">
                {durationHours} Hours ({Math.round(durationHours / 24)} Days)
              </span>
            </div>
            <input
              type="range"
              min="24"
              max="720"
              step="24"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full accent-[#0E2A47]"
            />
          </div>

          {/* Alternate Routing Pool Selection */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#69829A] mb-1.5">
              Designated Alternate Carrier Routes ({alternateRoutes.length})
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
              {cables.filter(c => !selectedCableIds.includes(c.id)).map((c) => {
                const isSelected = alternateRoutes.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleAlternateRoute(c.id)}
                    className={`p-1.5 rounded-lg text-[10px] font-mono text-left truncate border ${
                      isSelected
                        ? 'bg-[#EBF3FA] border-[#A8CBE5] text-[#0A3052] font-bold'
                        : 'bg-[#FAF7F2] border-[#E8E1D5] text-[#59738A]'
                    }`}
                  >
                    + {c.name.split('(')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Snapshot Section */}
          <div className="pt-3 border-t border-[#F0EBE0] flex items-center gap-2">
            <input
              type="text"
              placeholder="Snapshot label..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[#FAF7F2] border border-[#DDD3C3] rounded-lg text-xs text-[#0E2A47] placeholder-[#7990A4]"
            />
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="btn-outline text-xs whitespace-nowrap"
            >
              {snapshotSaved ? (
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Saved</span>
                </span>
              ) : (
                'Save Snapshot'
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Deterministic Simulation Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Performance Indicators */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div>
                <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
                  Deterministic Capacity & Latency Impact
                </h3>
                <p className="font-mono text-[10px] text-[#59738A]">
                  Mathematical model output from network graph topology
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#1E5685] bg-[#E9F0F6] px-2.5 py-1 rounded-lg">
                Engine: {simulationResult.engineVersion}
              </span>
            </div>

            {/* Demand Served vs Unserved Bar Gauge */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-[#0E2A47]">
                  Served Demand: <strong className="text-emerald-700">{simulationResult.servedDemandTbps} Tbps</strong>
                </span>
                <span className="font-medium text-[#0E2A47]">
                  Unserved Demand: <strong className="text-rose-700">{simulationResult.unservedDemandTbps} Tbps</strong>
                </span>
              </div>
              <div className="w-full h-4 rounded-full bg-[#E8E1D5] overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${simulationResult.capacityUtilizationPct}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${100 - simulationResult.capacityUtilizationPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-[#69829A] mt-1">
                <span>0 Tbps</span>
                <span>Capacity Resilience: {simulationResult.capacityUtilizationPct}%</span>
                <span>{simulationResult.totalOfferedDemandTbps} Tbps Total</span>
              </div>
            </div>

            {/* Latency Comparison Card */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
              <div>
                <p className="font-mono text-[10px] text-[#69829A] uppercase">Baseline Latency</p>
                <p className="font-mono text-lg font-bold text-[#0E2A47] mt-0.5">
                  {simulationResult.baselineLatencyMs} ms
                </p>
                <p className="text-[10px] text-[#7A8E9F]">Direct Subsea Path</p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-[#69829A] uppercase">Impacted Latency</p>
                <p className="font-mono text-lg font-bold text-amber-700 mt-0.5">
                  {simulationResult.impactedLatencyMs} ms
                </p>
                <p className="text-[10px] text-[#7A8E9F]">Via Alternate Consortia</p>
              </div>

              <div>
                <p className="font-mono text-[10px] text-[#69829A] uppercase">Net Latency Delta</p>
                <p className="font-mono text-lg font-bold text-rose-700 mt-0.5">
                  +{simulationResult.latencyDeltaMs} ms
                </p>
                <p className="text-[10px] text-[#7A8E9F]">Inflation Penalty</p>
              </div>
            </div>
          </div>

          {/* Alternate Routes Load Matrix */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
            <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
              Alternate Route Absorption & Headroom Analysis
            </h3>

            <div className="space-y-3">
              {simulationResult.affectedRoutes.map((route) => (
                <div key={route.routeId} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#0E2A47] truncate max-w-[280px]">
                      {route.routeName}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        route.congested
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {route.congested ? 'CONGESTION WARNING' : 'HEADROOM NOMINAL'}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#E2DBD0] overflow-hidden mb-1.5">
                    <div
                      className={`h-full transition-all duration-500 ${
                        route.congested ? 'bg-rose-600' : 'bg-[#185382]'
                      }`}
                      style={{ width: `${route.postFailureLoadPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between font-mono text-[10px] text-[#59738A]">
                    <span>Post-Rupture Load: <strong>{route.postFailureLoadPct}%</strong></span>
                    <span>Throughput: {route.postFailureThroughputTbps} / {route.maxCapacityTbps} Tbps</span>
                    <span>Remaining Headroom: <strong>{route.headroomTbps} Tbps</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action to War Room */}
            <div className="pt-2 flex justify-end">
              <Link
                href="/workspace/war-room"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E2A47] hover:bg-[#153B5B] text-white text-xs font-semibold shadow-xs"
              >
                <span>Formulate Recovery Strategy in War Room</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

