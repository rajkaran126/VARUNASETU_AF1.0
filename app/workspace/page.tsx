'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { CableExplorerMap } from '@/components/workspace/CableExplorerMap';
import { CableGlobe3D } from '@/components/workspace/CableGlobe3D';
import { CableDetailCard } from '@/components/workspace/CableDetailCard';
import { VERIFIED_LANDING_STATIONS } from '@/lib/cable-data';

export default function NetworkOverviewPage() {
  const { 
    cables, 
    selectedCable, 
    setSelectedCable, 
    activeFault 
  } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  // Filter cables based on search query, status, and region
  const filteredCables = cables.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesRegion = selectedRegion === 'All' || c.region === selectedRegion;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D4C4A8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 01 // SUBSEA TOPOLOGY EXPLORER
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              CANONICAL ACTIVE
            </span>
          </div>
          <h1 className="font-sans font-bold text-2xl lg:text-3xl font-bold text-[#0E2A47] tracking-tight mt-1">
            Network Overview & Global Cable Explorer
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Explore verified global subsea telecommunication conduits, landing stations, and real-time optical impairments across maritime transit corridors.
          </p>
        </div>

        {/* Global Topology Summary Telemetry Strip & 3D / 2D View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: 3D Globe Model 1 vs 2D Mercator */}
          <div className="flex items-center p-1 bg-white rounded-xl border border-[#D4C4A8] shadow-2xs font-mono text-xs">
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewMode === '3D'
                  ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-xs'
                  : 'text-[#A69B89] hover:text-[#454640]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C87954]" />
              <span>3D Cable Model</span>
            </button>
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === '2D'
                  ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-xs'
                  : 'text-[#A69B89] hover:text-[#454640]'
              }`}
            >
              <span>2D Grid</span>
            </button>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#D4C4A8] font-mono text-xs shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C87954]" />
            <span className="text-[#A69B89]">Systems:</span>
            <strong className="text-[#454640]">{cables.length} Active</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#D4C4A8] font-mono text-xs shadow-2xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#A69B89]">Landing Stations:</span>
            <strong className="text-[#454640]">{VERIFIED_LANDING_STATIONS.length} Grid</strong>
          </div>
        </div>
      </div>

      {/* Main Interactive Submarine Cable Visualization (3D Model 1 vs 2D Explorer Map) */}
      {viewMode === '3D' ? (
        <CableGlobe3D
          cables={filteredCables}
          selectedCable={selectedCable}
          activeFault={activeFault}
          onSelectCable={setSelectedCable}
        />
      ) : (
        <CableExplorerMap
          cables={filteredCables}
          landingStations={VERIFIED_LANDING_STATIONS}
          selectedCable={selectedCable}
          onSelectCable={setSelectedCable}
        />
      )}

      {/* Two Column Layout: Filterable Explorer List + Single Cable Intelligence Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & Filterable Cable List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#D4C4A8] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-bold text-base font-bold text-[#0E2A47]">
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
              placeholder="Search by cable name, code, or transit region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F8F9FA] rounded-xl text-xs font-mono text-[#454640] placeholder-[#91A1AF] border border-[#D4C4A8] focus:outline-none focus:border-[#C87954] focus:bg-white transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-[#A69B89] mr-1">STATUS:</span>
            {['All', 'Operational', 'Degraded', 'Severed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  selectedStatus === status
                    ? 'bg-[#152D46] text-white shadow-2xs'
                    : 'bg-[#EDF3F7] text-[#A69B89] hover:bg-[#E2EBF2]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Scrollable Cable List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredCables.map((cable) => {
              const isSelected = cable.id === selectedCable.id;
              const isFault = cable.id === activeFault.cableId;

              return (
                <div
                  key={cable.id}
                  onClick={() => setSelectedCable(cable)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8D9BF] border-[#83B9A9] shadow-xs'
                      : isFault
                      ? 'bg-[#FEF2F2] border-rose-300 hover:border-rose-400'
                      : 'bg-white border-[#D4C4A8] hover:border-[#D4C4A8] hover:bg-[#FAFBF9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isFault
                            ? 'bg-rose-500 animate-pulse'
                            : cable.status === 'Operational'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-sans font-bold font-bold text-xs text-[#0E2A47]">
                        {cable.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#5A738A]">
                      {cable.region}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#EDF1F4] font-mono text-[10px] text-[#A69B89]">
                    <div>
                      <span className="block text-[#91A1AF] text-[9px]">CAPACITY</span>
                      <strong className="text-[#454640]">{cable.designCapacityTbps} Tbps</strong>
                    </div>
                    <div>
                      <span className="block text-[#91A1AF] text-[9px]">LENGTH</span>
                      <strong className="text-[#454640]">{cable.lengthKm.toLocaleString()} km</strong>
                    </div>
                    <div>
                      <span className="block text-[#91A1AF] text-[9px]">STATUS</span>
                      <strong className={isFault ? 'text-rose-600' : 'text-emerald-700'}>
                        {isFault ? 'SEVERANCE' : cable.status}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Cable Intelligence Panel (7 cols) */}
        <div className="lg:col-span-7">
          <CableDetailCard cable={selectedCable} />
        </div>
      </div>
    </div>
  );
}
