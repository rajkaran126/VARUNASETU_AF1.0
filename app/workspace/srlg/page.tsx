'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import {
  detectAllSRLGGroups,
  detectSharedLanding,
  detectCorridorOverlap,
  buildFalseRedundancyMatrix,
} from '@/lib/services/srlg.service';
import { SRLGGroup, FalseRedundancyAssessment, SRLGGroupType } from '@/lib/types-phase4a';

const GROUP_TYPE_LABELS: Record<SRLGGroupType, string> = {
  geographic_corridor: 'Geographic Corridor',
  shared_landing: 'Shared Landing Station',
  coastal_approach: 'Coastal Approach',
  hazard_exposure: 'Hazard Exposure',
  shared_infrastructure: 'Shared Infrastructure',
};

const GROUP_TYPE_COLOURS: Record<SRLGGroupType, string> = {
  geographic_corridor: 'bg-amber-50 text-amber-800 border-amber-300',
  shared_landing: 'bg-rose-50 text-rose-800 border-rose-300',
  coastal_approach: 'bg-blue-50 text-blue-800 border-blue-300',
  hazard_exposure: 'bg-purple-50 text-purple-800 border-purple-200',
  shared_infrastructure: 'bg-orange-50 text-orange-800 border-orange-300',
};

const CONFIDENCE_COLOURS: Record<string, string> = {
  High: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-rose-50 text-rose-700 border-rose-200',
  Insufficient_Evidence: 'bg-gray-50 text-gray-500 border-gray-200',
};

const FRA_COLOURS: Record<string, string> = {
  Independent_Based_On_Available_Evidence: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  Potentially_Shared_Risk: 'bg-amber-50 text-amber-700 border-amber-300',
  Shared_Landing_Station_Dependency: 'bg-rose-50 text-rose-700 border-rose-300',
  Shared_Corridor_Exposure: 'bg-red-50 text-red-800 border-red-300',
  Shared_Hazard_Exposure: 'bg-purple-50 text-purple-700 border-purple-200',
  Insufficient_Evidence: 'bg-gray-50 text-gray-500 border-gray-200',
};

function SRLGGroupCard({ group, onClick, selected }: { group: SRLGGroup; onClick: () => void; selected: boolean }) {
  const isSynthetic = group.evidenceClass === 'Synthetic';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        selected ? 'border-[#C87954] bg-[#FDF8F2] shadow-sm' : 'border-[#E2DBD0] bg-white hover:border-[#C87954]/40 hover:bg-[#FAF7F2]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${GROUP_TYPE_COLOURS[group.groupType]}`}>
          {GROUP_TYPE_LABELS[group.groupType]}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${CONFIDENCE_COLOURS[group.confidence]}`}>
          {group.confidence}
        </span>
      </div>
      <p className="text-xs font-bold text-[#0E2A47] leading-snug">{group.name}</p>
      {isSynthetic && (
        <p className="text-[9px] text-purple-600 font-mono mt-0.5">⚠ SYNTHETIC DATA</p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {group.memberCableIds.map((id) => (
          <span key={id} className="px-1 py-0.5 bg-[#E8D9BF] text-[#454640] rounded text-[9px] font-mono">
            {id.toUpperCase()}
          </span>
        ))}
      </div>
    </button>
  );
}

function FRARow({ assessment }: { assessment: FalseRedundancyAssessment }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${FRA_COLOURS[assessment.classification]?.includes('border') ? '' : 'border-[#E2DBD0]'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#FAF7F2] transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0E2A47]">{assessment.cableNameA}</span>
              <span className="text-[10px] text-[#59738A]">↔</span>
              <span className="text-xs font-bold text-[#0E2A47]">{assessment.cableNameB}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${FRA_COLOURS[assessment.classification] ?? ''}`}>
            {assessment.classification.replace(/_/g, ' ')}
          </span>
          <svg className={`w-3.5 h-3.5 text-[#A69B89] transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F0EBE0] bg-[#FAF7F2] space-y-2">
          <p className="text-[11px] text-[#454640] leading-relaxed mt-3">{assessment.rationale}</p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            {assessment.geographicSeparationKm !== null && (
              <span className="px-2 py-0.5 rounded bg-white border border-[#E2DBD0] text-[#454640]">
                Min separation: {assessment.geographicSeparationKm.toFixed(0)} km
              </span>
            )}
            {assessment.sharedLandingStationIds.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                Shared landings: {assessment.sharedLandingStationIds.join(', ')}
              </span>
            )}
            {assessment.sharedSRLGIds.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
                SRLGs: {assessment.sharedSRLGIds.join(', ')}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded border ${CONFIDENCE_COLOURS[assessment.confidence]}`}>
              Confidence: {assessment.confidence}
            </span>
          </div>
          <p className="text-[9px] text-[#69829A] font-mono italic">{assessment.limitations}</p>
        </div>
      )}
    </div>
  );
}

export default function SRLGPage() {
  const { cables } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'groups' | 'false-redundancy' | 'detail'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<SRLGGroup | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const srlgGroups = useMemo(() => detectAllSRLGGroups(cables), [cables]);
  const fraMatrix = useMemo(() => buildFalseRedundancyMatrix(cables, srlgGroups), [cables, srlgGroups]);

  const filteredGroups = useMemo(() => {
    return srlgGroups.filter((g) => {
      const matchType = filterType === 'all' || g.groupType === filterType;
      const matchSearch = searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.memberCableIds.some((id) => id.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [srlgGroups, filterType, searchQuery]);

  const fraByClass = useMemo(() => {
    const map: Record<string, FalseRedundancyAssessment[]> = {};
    fraMatrix.forEach((a) => {
      if (!map[a.classification]) map[a.classification] = [];
      map[a.classification].push(a);
    });
    return map;
  }, [fraMatrix]);

  const sharedLandingCount = srlgGroups.filter((g) => g.groupType === 'shared_landing').length;
  const corridorCount = srlgGroups.filter((g) => g.groupType === 'geographic_corridor').length;
  const hazardCount = srlgGroups.filter((g) => g.groupType === 'hazard_exposure').length;
  const nonIndependentCount = fraMatrix.filter(
    (a) => !['Independent_Based_On_Available_Evidence', 'Insufficient_Evidence'].includes(a.classification)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#D4C4A8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 09 // SHARED RISK LINK GROUP ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">SRLG</span>
          </div>
          <h1 className="font-sans font-bold text-2xl lg:text-3xl text-[#0E2A47] tracking-tight mt-1">
            SRLG Analysis
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Identifies dependencies where multiple cables or network components can fail from one common event. Combines geographic corridor proximity, shared landing stations, and hazard exposure analysis.
          </p>
          <p className="text-[10px] text-amber-700 mt-1 font-mono">
            ⚠ Route coordinates are approximate centreline representations. Proximity does NOT confirm shared physical infrastructure. Hazard zones are SYNTHETIC. Confidence is annotated per group.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 flex-shrink-0">
          {[
            { v: srlgGroups.length, l: 'Total SRLG Groups', c: 'text-[#C87954]' },
            { v: sharedLandingCount, l: 'Shared Landings', c: 'text-rose-700' },
            { v: corridorCount, l: 'Corridor Overlaps', c: 'text-amber-700' },
            { v: nonIndependentCount, l: 'Non-Independent Pairs', c: 'text-red-700' },
          ].map((s) => (
            <div key={s.l} className="px-3 py-2 bg-white rounded-xl border border-[#E2DBD0] shadow-xs text-center">
              <p className={`font-mono text-xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-[9px] text-[#59738A] font-mono leading-tight">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0EBE0] rounded-xl p-1 w-fit">
        {(['groups', 'false-redundancy', 'detail'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-white text-[#C87954] shadow-xs' : 'text-[#69829A] hover:text-[#454640]'
            }`}
          >
            {tab === 'groups' ? `SRLG Groups (${srlgGroups.length})` : tab === 'false-redundancy' ? `False Redundancy (${fraMatrix.length})` : 'Group Detail'}
          </button>
        ))}
      </div>

      {/* SRLG Groups Tab */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: filter + list */}
          <div className="lg:col-span-1 space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search groups or cables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD3C3] rounded-xl text-xs focus:outline-none focus:border-[#C87954]"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD3C3] rounded-xl text-xs focus:outline-none focus:border-[#C87954]"
              >
                <option value="all">All Types ({srlgGroups.length})</option>
                <option value="shared_landing">Shared Landing ({sharedLandingCount})</option>
                <option value="geographic_corridor">Geographic Corridor ({corridorCount})</option>
                <option value="hazard_exposure">Hazard Exposure ({hazardCount})</option>
              </select>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredGroups.map((g) => (
                <SRLGGroupCard
                  key={g.id}
                  group={g}
                  selected={selectedGroup?.id === g.id}
                  onClick={() => { setSelectedGroup(g); setActiveTab('detail'); }}
                />
              ))}
              {filteredGroups.length === 0 && (
                <p className="text-xs text-[#59738A] font-mono text-center py-8">No groups match filter</p>
              )}
            </div>
          </div>

          {/* Right: summary cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Type breakdown */}
            <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
              <h2 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-4">
                SRLG Group Summary
              </h2>
              <div className="space-y-3">
                {Object.entries(GROUP_TYPE_LABELS).map(([type, label]) => {
                  const count = srlgGroups.filter((g) => g.groupType === type).length;
                  if (count === 0) return null;
                  const pct = Math.round((count / srlgGroups.length) * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${GROUP_TYPE_COLOURS[type as SRLGGroupType]}`}>
                          {label}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#0E2A47]">{count}</span>
                      </div>
                      <div className="h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#C87954] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shared landing stations critical list */}
            <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5">
              <h2 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-4">
                Critical Landing Station Dependencies
              </h2>
              <div className="space-y-2">
                {srlgGroups
                  .filter((g) => g.groupType === 'shared_landing')
                  .sort((a, b) => b.memberCableIds.length - a.memberCableIds.length)
                  .map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
                      <div>
                        <p className="text-xs font-bold text-[#0E2A47]">{g.sharedLandingStationIds?.[0]}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {g.memberCableIds.map((id) => (
                            <span key={id} className="px-1 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[9px] font-mono">{id}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-rose-700">{g.memberCableIds.length}</p>
                        <p className="text-[9px] text-[#59738A]">cables</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* False Redundancy Tab */}
      {activeTab === 'false-redundancy' && (
        <div className="space-y-4">
          {/* Classification summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(FRA_COLOURS).map(([cls, colourClass]) => {
              const count = fraByClass[cls]?.length ?? 0;
              if (count === 0) return null;
              return (
                <div key={cls} className={`rounded-xl border p-3 text-center ${colourClass}`}>
                  <p className="font-mono text-xl font-bold">{count}</p>
                  <p className="text-[9px] font-mono leading-tight mt-0.5">{cls.replace(/_/g, ' ')}</p>
                </div>
              );
            })}
          </div>

          {/* Methodology note */}
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
            <p className="text-[10px] text-[#59738A] font-mono">
              <strong className="text-[#454640]">Methodology:</strong> Assessed {fraMatrix.length} cable pairs from {cables.length} cables.
              Corridor threshold: 50 km (ASSUMPTION). Min overlap: 200 km (ASSUMPTION).
              Route coordinates are approximate centrelines — not as-built paths.
              Hazard zones are SYNTHETIC. Real verification requires licensed AIS, bathymetry, and operator records.
            </p>
          </div>

          {/* FRA list by classification group */}
          {Object.entries(fraByClass)
            .sort(([a], [b]) => {
              const order = ['Shared_Corridor_Exposure', 'Shared_Landing_Station_Dependency', 'Potentially_Shared_Risk', 'Shared_Hazard_Exposure', 'Insufficient_Evidence', 'Independent_Based_On_Available_Evidence'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([cls, items]) => (
              <div key={cls} className="space-y-2">
                <h3 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border w-fit ${FRA_COLOURS[cls]}`}>
                  {cls.replace(/_/g, ' ')} ({items.length})
                </h3>
                <div className="space-y-1">
                  {items.map((a) => <FRARow key={a.id} assessment={a} />)}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Detail Tab */}
      {activeTab === 'detail' && selectedGroup ? (
        <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 space-y-4">
          <div className="flex items-start justify-between pb-4 border-b border-[#F0EBE0]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${GROUP_TYPE_COLOURS[selectedGroup.groupType]}`}>
                  {GROUP_TYPE_LABELS[selectedGroup.groupType]}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${CONFIDENCE_COLOURS[selectedGroup.confidence]}`}>
                  Confidence: {selectedGroup.confidence}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border border-[#D4C4A8] bg-[#E8D9BF] text-[#454640]">
                  {selectedGroup.evidenceClass}
                </span>
              </div>
              <h2 className="font-sans font-bold text-lg text-[#0E2A47]">{selectedGroup.name}</h2>
              <p className="text-[10px] text-[#59738A] font-mono mt-0.5">
                ID: {selectedGroup.id} · Dataset: {selectedGroup.datasetVersion} · Detected: {new Date(selectedGroup.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-mono font-bold text-[#69829A] uppercase mb-1">Detection Method</p>
                <p className="text-xs text-[#454640]">{selectedGroup.detectionMethod}</p>
              </div>
              {selectedGroup.distanceThresholdKm !== undefined && (
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#69829A] uppercase mb-1">Distance Threshold (ASSUMPTION)</p>
                  <p className="text-xs text-[#454640]">{selectedGroup.distanceThresholdKm} km</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-mono font-bold text-[#69829A] uppercase mb-1">Member Cables ({selectedGroup.memberCableIds.length})</p>
                <div className="flex flex-wrap gap-1">
                  {selectedGroup.memberCableIds.map((id) => (
                    <span key={id} className="px-2 py-1 bg-[#E8D9BF] text-[#454640] rounded-lg text-xs font-mono font-bold">{id.toUpperCase()}</span>
                  ))}
                </div>
              </div>
              {selectedGroup.sharedLandingStationIds && selectedGroup.sharedLandingStationIds.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#69829A] uppercase mb-1">Shared Landing Stations</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedGroup.sharedLandingStationIds.map((id) => (
                      <span key={id} className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-mono">{id}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold text-[#69829A] uppercase mb-1">Assessment Notes</p>
              <p className="text-xs text-[#454640] leading-relaxed">{selectedGroup.notes}</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'detail' ? (
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E2DBD0] p-12 text-center">
          <p className="text-xs text-[#59738A] font-mono">Select a group from the SRLG Groups tab to view details here.</p>
        </div>
      ) : null}
    </div>
  );
}
