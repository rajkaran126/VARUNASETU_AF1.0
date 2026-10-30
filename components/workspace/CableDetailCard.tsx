'use client';

import React from 'react';
import Link from 'next/link';
import { CableRoute } from '@/lib/types';
import { useWorkspace } from '@/lib/workspace-context';

interface CableDetailCardProps {
  cable: CableRoute;
}

export function CableDetailCard({ cable }: CableDetailCardProps) {
  const { setActiveScenario, activeFault } = useWorkspace();

  const isFaulted = activeFault.cableId === cable.id;

  const handleInjectFault = () => {
    setActiveScenario({
      id: `scen-${cable.id}-rupture`,
      name: `${cable.name} Subsea Severance`,
      selectedCableIds: [cable.id],
      faultType: 'Physical Anchor Drag',
      faultLocation: {
        lat: activeFault.lat,
        lon: activeFault.lon,
        depthM: activeFault.depthMeters,
        description: `${cable.name} Deepwater Segment`
      },
      trafficDemandAssumptionTbps: typeof cable.litCapacityTbps === 'number' ? cable.litCapacityTbps : 20.0,
      failureDurationHours: 240,
      availableAlternateRoutes: ['aae1', '2africa', 'marea', 'faster']
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs relative">
      {/* Top Header & Badges */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#F0EBE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-[#5A738A] uppercase tracking-widest">
              SYSTEM ID: {cable.id.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#E9F0F6] text-[#123E63]">
              {cable.region}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              PROVENANCE: {cable.provenance}
            </span>
          </div>
          <h2 className="font-grotesk text-xl font-bold text-[#1C1917] tracking-tight">
            {cable.name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
              cable.status === 'Operational'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : cable.status === 'Degraded'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {cable.status}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-[#F0EBE0]">
        <div>
          <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">Route Length</p>
          <p className="font-mono text-base font-bold text-[#1C1917] mt-0.5">
            {typeof cable.lengthKm === 'number' ? `${cable.lengthKm.toLocaleString()} km` : 'Unmeasured'}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">Lit Capacity</p>
          <p className="font-mono text-base font-bold text-[#1C1917] mt-0.5">
            {typeof cable.litCapacityTbps === 'number' ? `${cable.litCapacityTbps} Tbps` : 'Unknown'}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">Fiber Pairs</p>
          <p className="font-mono text-base font-bold text-[#1C1917] mt-0.5">
            {typeof cable.fiberPairs === 'number' ? `${cable.fiberPairs} Pairs` : 'Unmeasured'}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">RFS Year</p>
          <p className="font-mono text-base font-bold text-[#1C1917] mt-0.5">
            {typeof cable.rfsYear === 'number' ? cable.rfsYear : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Description & Engineering Notes */}
      <div className="py-4 border-b border-[#F0EBE0]">
        <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider mb-1">
          OPERATIONAL PROFILE & SUBSEA ROUTE NOTES
        </p>
        <p className="text-xs text-[#2E4964] leading-relaxed font-body">
          {cable.notes}
        </p>
      </div>

      {/* Landing Stations & Consortium Owners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-[#F0EBE0]">
        <div>
          <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider mb-2">
            CONNECTED LANDING TERMINALS ({cable.landingStations.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cable.landingStations.map((ls) => (
              <span
                key={ls.id}
                className="px-2 py-1 rounded-md bg-[#FAF7F1] border border-[#E4DDD0] font-mono text-[11px] text-[#1E3A5F]"
              >
                {ls.city}, {ls.country}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider mb-2">
            CONSORTIUM OWNERS & CARRIERS
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cable.owners.map((owner, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md bg-[#F4EFE6] border border-[#DFD6C7] font-body text-[11px] text-[#364F68]"
              >
                {owner}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Active Fault Status & Actions */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#69829A] uppercase tracking-wider">
            LAST TELEMETRY AUDIT:
          </span>
          <span className="font-mono text-xs text-[#1E3A5F] font-semibold">
            {new Date(cable.lastUpdated).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/workspace/operations"
            onClick={handleInjectFault}
            className="btn-primary"
          >
            <span>Simulate Disruption</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <Link
            href="/workspace/war-room"
            className="btn-secondary"
          >
            <span>Recovery War Room</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

