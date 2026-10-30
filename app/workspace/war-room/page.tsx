'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { RecoveryStrategy, RepairVessel } from '@/lib/types';

export default function RecoveryWarRoomPage() {
  const { 
    selectedCable, 
    activeFault, 
    strategies, 
    selectedStrategy, 
    setSelectedStrategy, 
    repairFleet 
  } = useWorkspace();

  const [mobilizedVesselId, setMobilizedVesselId] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);

  // Haversine formula to compute nautical miles between vessel port and active fault
  const calculateDistanceNm = (vesselLat: number, vesselLon: number, faultLat: number, faultLon: number): number => {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = ((faultLat - vesselLat) * Math.PI) / 180;
    const dLon = ((faultLon - vesselLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((vesselLat * Math.PI) / 180) *
        Math.cos((faultLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const handleMobilizeVessel = (vessel: RepairVessel) => {
    setMobilizedVesselId(vessel.id);
    setOrderConfirmed(true);
    setTimeout(() => setOrderConfirmed(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Section Subheading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 04 // CRISIS RESPONSE & ASSET LOGISTICS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              WAR ROOM ACTIVE
            </span>
          </div>
          <h1 className="font-grotesk text-2xl lg:text-3xl font-bold text-[#0E2A47] tracking-tight mt-1">
            Recovery War Room
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Evaluate multidimensional recovery strategies, compare optical vs physical mitigation pathways, and manage cable repair fleet logistics.
          </p>
        </div>

        {/* Active Incident Summary */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-right shadow-2xs">
            <span className="font-mono text-[10px] text-rose-700 uppercase font-semibold">Target Incident:</span>
            <p className="font-mono text-xs font-bold text-rose-900">
              {activeFault.cableName} · {activeFault.faultType}
            </p>
          </div>
        </div>
      </div>

      {/* Recovery Strategies Comparison Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-grotesk text-lg font-bold text-[#0E2A47]">
            Recovery Strategy Evaluation Matrix
          </h2>
          <span className="font-mono text-xs text-[#59738A]">
            Selected: <strong className="text-[#0E2A47]">{selectedStrategy.title.split(':')[0]}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {strategies.map((strat) => {
            const isSelected = selectedStrategy.id === strat.id;

            return (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategy(strat)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#185382] shadow-md ring-2 ring-[#185382]/20'
                    : 'bg-white border-[#E2DBD0] hover:border-[#CFC5B6] shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
                      {strat.strategyType}
                    </span>
                    {strat.recommended && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <h3 className="font-grotesk text-base font-bold text-[#0E2A47] leading-snug">
                    {strat.title}
                  </h3>

                  <p className="text-xs text-[#3E576F] mt-2 font-body leading-relaxed">
                    {strat.description}
                  </p>

                  {/* Quantitative Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-mono text-xs">
                    <div>
                      <p className="text-[9px] text-[#69829A] uppercase">Execution Window</p>
                      <p className="font-bold text-[#0E2A47]">{strat.timeToExecute}</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-[#69829A] uppercase">Capacity Restored</p>
                      <p className="font-bold text-emerald-700">{strat.capacityRestoredPct}%</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-[#69829A] uppercase">Latency Penalty</p>
                      <p className="font-bold text-amber-700">+{strat.latencyImpactMs} ms</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-[#69829A] uppercase">Est. Cost</p>
                      <p className="font-bold text-[#0E2A47]">${(strat.estimatedCostUsd / 1000).toFixed(0)}k USD</p>
                    </div>
                  </div>

                  {/* Action Steps */}
                  <div>
                    <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider mb-1.5 font-semibold">
                      Operational Action Steps:
                    </p>
                    <ul className="space-y-1 text-[11px] text-[#36506A]">
                      {strat.actionSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#185382] font-mono">›</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#F0EBE0]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStrategy(strat);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold font-mono tracking-wider transition-all ${
                      isSelected
                        ? 'bg-[#0E2A47] text-white shadow-xs'
                        : 'border border-[#D5CCBC] bg-[#FAF7F2] text-[#3A536B] hover:bg-white'
                    }`}
                  >
                    {isSelected ? '✓ STRATEGY COMMITTED' : 'SELECT STRATEGY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cable Repair Fleet Inventory & Mobilization Logistics */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0EBE0]">
          <div>
            <h2 className="font-grotesk text-lg font-bold text-[#0E2A47]">
              Subsea Cable Repair Fleet Inventory
            </h2>
            <p className="font-mono text-[10px] text-[#59738A]">
              Dynamic positioning (DP) vessels, subsea ROVs, and transit time calculators
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E8F1F8] text-[#154670] font-semibold">
              AIS Last Reported: Verified Consortium Fleet
            </span>
          </div>
        </div>

        {/* Fleet Table / Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Vessel Name</th>
                <th className="py-2.5 px-3">Type & Rating</th>
                <th className="py-2.5 px-3">Stationed Port</th>
                <th className="py-2.5 px-3">ROV Rating</th>
                <th className="py-2.5 px-3">Spool Capacity</th>
                <th className="py-2.5 px-3">Transit Distance</th>
                <th className="py-2.5 px-3">ETA to Fault</th>
                <th className="py-2.5 px-3">Mobilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {repairFleet.map((vessel) => {
                const distanceNm = calculateDistanceNm(
                  vessel.lat,
                  vessel.lon,
                  activeFault.lat,
                  activeFault.lon
                );
                const transitHours = +(distanceNm / vessel.cruisingSpeedKnots).toFixed(1);
                const isClosest = vessel.id === 'vsl-ile-de-sein';
                const isMobilized = mobilizedVesselId === vessel.id;

                return (
                  <tr key={vessel.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0E2A47]">{vessel.name}</span>
                        {isClosest && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800">
                            CLOSEST
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-[#7A8E9F]">IMO: {vessel.imo}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] font-semibold text-[#185382] bg-[#EAF1F8] px-1.5 py-0.5 rounded">
                        {vessel.dpRating}
                      </span>
                      <p className="text-[10px] text-[#59738A] mt-0.5">{vessel.vesselType}</p>
                    </td>

                    <td className="py-3 px-3 font-mono text-[#0E2A47]">
                      {vessel.currentPort}
                      <p className="text-[9px] text-[#7A8E9F]">{vessel.lat.toFixed(2)}°N, {vessel.lon.toFixed(2)}°E</p>
                    </td>

                    <td className="py-3 px-3 font-mono text-[#0E2A47]">
                      -{vessel.rovDepthRatingM}m
                    </td>

                    <td className="py-3 px-3 font-mono text-[#0E2A47]">
                      {vessel.cableTankCapacityTonnes.toLocaleString()} Tonnes
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-[#0E2A47]">
                      {distanceNm.toLocaleString()} NM
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-sky-800">
                      {transitHours} Hours
                    </td>

                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleMobilizeVessel(vessel)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all shadow-2xs ${
                          isMobilized
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#0E2A47] hover:bg-[#153B5B] text-white'
                        }`}
                      >
                        {isMobilized ? '✓ MOBILIZED' : 'DISPATCH'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orderConfirmed && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>
              <strong>Mobilization Order Transmitted:</strong> Marine dispatch coordinates broadcast to vessel bridge. Universal joint containers and Hector ROV crew alerted for embarkation.
            </span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E8E1D5] text-[11px] text-[#5A738A] font-mono flex items-center justify-between">
          <span>* Transit times calculated via Haversine great-circle at designated cruising speed with Suez Canal maritime scheduling.</span>
          <Link href="/workspace/mission-control" className="text-[#185382] font-bold hover:underline">
            Brief Agents in Mission Control →
          </Link>
        </div>
      </div>
    </div>
  );
}
