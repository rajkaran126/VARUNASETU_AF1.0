'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { CableExplorerMap } from '@/components/workspace/CableExplorerMap';
import { CableDetailCard } from '@/components/workspace/CableDetailCard';
import { VERIFIED_LANDING_STATIONS } from '@/lib/cable-data';

export default function NetworkOverviewPage() {
  const { cables, selectedCable, setSelectedCable, activeFault } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Filter cables based on search query, status, and region
  const filteredCables = cables.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesRegion = selectedRegion === 'All' || c.region === selectedRegion;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const totalLength = cables.reduce((acc, c) => typeof c.lengthKm === 'number' ? acc + c.lengthKm : acc, 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 01 // SUBSEA TOPOLOGY EXPLORER
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              CANONICAL ACTIVE
            </span>
          </div>
          <h1 className="font-grotesk text-2xl lg:text-3xl font-bold text-[#0E2A47] tracking-tight mt-1">
            Network Overview & Global Cable Explorer
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Explore verified global subsea telecommunication conduits, landing stations, and real-time optical impairments across maritime transit corridors.
          </p>
        </div>

        {/* Global Topology Summary Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E0D7C9] text-right shadow-2xs">
            <span className="font-mono text-[10px] text-[#5A738A] uppercase">Global Telemetry Flow</span>
            <p className="font-mono text-sm font-bold text-[#0E2A47]">97.4% Nominal</p>
          </div>
        </div>
      </div>

      {/* Network Intelligence KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#59738A] mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Cable Systems</span>
            <span className="w-2 h-2 rounded-full bg-[#185382]" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#0E2A47]">{cables.length}</p>
          <p className="font-mono text-[10px] text-[#69829A] mt-1">421 In-Service Globally</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#59738A] mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Landing Stations</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#0E2A47]">{VERIFIED_LANDING_STATIONS.length}</p>
          <p className="font-mono text-[10px] text-[#69829A] mt-1">1,248 Coastal Terminal Grid</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#59738A] mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Subsea Fibre Reach</span>
            <span className="w-2 h-2 rounded-full bg-sky-500" />
          </div>
          <p className="font-mono text-2xl font-bold text-[#0E2A47]">{(totalLength / 1000).toFixed(1)}k km</p>
          <p className="font-mono text-[10px] text-[#69829A] mt-1">1.38M km International Reach</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2DBD0] shadow-xs">
          <div className="flex items-center justify-between text-[#59738A] mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Active Anomalies</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="font-mono text-2xl font-bold text-rose-700">02</p>
          <p className="font-mono text-[10px] text-rose-600 mt-1">1 Severed · 1 Degraded</p>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <CableExplorerMap
        cables={filteredCables}
        landingStations={VERIFIED_LANDING_STATIONS}
        selectedCable={selectedCable}
        onSelectCable={setSelectedCable}
      />

      {/* Two Column Layout: Filterable Explorer List + Single Cable Intelligence Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & Filterable Cable List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-grotesk text-base font-bold text-[#0E2A47]">
              Submarine Cable Directory
            </h2>
            <span className="font-mono text-[11px] text-[#5A738A]">
              {filteredCables.length} of {cables.length} Cables
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              className="w-4 h-4 text-[#69829A] absolute left-3 top-1/2 -translate-y-1/2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by cable name, system ID, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-xs text-[#0E2A47] placeholder-[#7990A4] focus:outline-none focus:border-[#1E4E79] focus:bg-white transition-all font-body"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['All', 'Operational', 'Degraded', 'Severed'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                  selectedStatus === st
                    ? 'bg-[#0E2A47] text-white font-bold'
                    : 'bg-[#F2ECE1] text-[#4A647D] hover:bg-[#EAE2D4]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Scrollable Cable List */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredCables.map((cable) => {
              const isSelected = selectedCable.id === cable.id;
              return (
                <div
                  key={cable.id}
                  onClick={() => setSelectedCable(cable)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBF3FA] border-[#A8CBE5] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#E8E1D5] hover:border-[#CFC5B6] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#5A738A]">
                        {cable.id.toUpperCase()} · {cable.region}
                      </span>
                      <h3 className="font-bold text-xs text-[#0E2A47] leading-snug">
                        {cable.name}
                      </h3>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                        cable.status === 'Operational'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cable.status === 'Degraded'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cable.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-[#59738A]">
                    <span>{typeof cable.lengthKm === 'number' ? `${cable.lengthKm.toLocaleString()} km` : 'Unmeasured'}</span>
                    <span>·</span>
                    <span>{typeof cable.litCapacityTbps === 'number' ? `${cable.litCapacityTbps} Tbps` : 'Unknown'}</span>
                    <span>·</span>
                    <span>{cable.landingStations.length} Terminals</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Single Cable Intelligence Card (7 cols) */}
        <div className="lg:col-span-7">
          <CableDetailCard cable={selectedCable} />
        </div>
      </div>
    </div>
  );
}
