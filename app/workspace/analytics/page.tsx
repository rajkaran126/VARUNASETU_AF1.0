'use client';

import React, { useState, useMemo } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { detectAllSRLGGroups, buildFalseRedundancyMatrix } from '@/lib/services/srlg.service';
import { getManifestStats } from '@/lib/services/ingestion.service';

export default function AnalyticsReportsPage() {
  const { cables, simulationResult, selectedStrategy, snapshots, activeFault } = useWorkspace();
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>(snapshots[0]?.snapshotId || '');
  const [exportNotice, setExportNotice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'risk' | 'intelligence' | 'resilience' | 'datasets'>('risk');

  const srlgGroups = useMemo(() => detectAllSRLGGroups(cables), [cables]);
  const fraMatrix = useMemo(() => buildFalseRedundancyMatrix(cables, srlgGroups), [cables, srlgGroups]);
  const manifestStats = useMemo(() => getManifestStats(), []);

  const fraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of fraMatrix) {
      counts[a.classification] = (counts[a.classification] || 0) + 1;
    }
    return counts;
  }, [fraMatrix]);

  const nonIndependentPairs = fraMatrix.filter(
    (a) => !['Independent_Based_On_Available_Evidence', 'Insufficient_Evidence'].includes(a.classification)
  );
  const sharedLandingGroups = srlgGroups.filter((g) => g.groupType === 'shared_landing');
  const corridorGroups = srlgGroups.filter((g) => g.groupType === 'geographic_corridor');

  const regionalRisks = [
    { region: 'Red Sea / Bab el-Mandeb Corridor', riskScore: 0.88, level: 'Critical', cables: 16, detail: 'High maritime anchor congestion and active geopolitical instability.' },
    { region: 'Malacca Strait / Singapore Enclave', riskScore: 0.76, level: 'High', cables: 24, detail: 'High commercial shipping density and shallow seabed crossings.' },
    { region: 'Luzon Strait / Taiwan Basin', riskScore: 0.72, level: 'High', cables: 14, detail: 'Severe underwater seismic faults and turbidity currents.' },
    { region: 'North Atlantic Backbone (US-UK)', riskScore: 0.34, level: 'Low-Moderate', cables: 18, detail: 'Deep water burial with high geodiverse landing dispersal.' },
    { region: 'Transpacific Southern Trunk', riskScore: 0.28, level: 'Low', cables: 8, detail: 'Deep abyssal plain installation with low commercial trawler traffic.' },
  ];

  const incidentCauses = [
    { cause: 'Commercial Anchor Dragging', share: '44%', count: 182, color: 'bg-rose-500' },
    { cause: 'Deepsea Fishing Trawler Gear', share: '26%', count: 108, color: 'bg-amber-500' },
    { cause: 'Underwater Seismic / Earthquakes', share: '14%', count: 58, color: 'bg-[#83B9A9]' },
    { cause: 'Optical Repeater & Power Shunts', share: '11%', count: 45, color: 'bg-indigo-500' },
    { cause: 'Submarine Landslides & Current', share: '5%', count: 21, color: 'bg-slate-400' },
  ];

  const handleExportCSV = () => {
    // Generate deterministic CSV of cables telemetry
    const headers = 'ID,Name,Region,LengthKm,LitCapacityTbps,Status,Provenance\n';
    const rows = cables.map(c => 
      `"${c.id}","${c.name}","${c.region}",${c.lengthKm},${c.litCapacityTbps},"${c.status}","${c.provenance}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `varunasetu_subsea_cables_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Subsea Telemetry CSV Exported Successfully');
    setTimeout(() => setExportNotice(''), 3000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Section Subheading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 06 // AUDIT, RISK & EXECUTIVE BRIEFINGS
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8F1F8] text-[#154670]">
              ANALYTICS ENGINE 2.4
            </span>
          </div>
          <h1 className="font-sans font-bold text-2xl lg:text-3xl font-bold text-[#1C1917] tracking-tight mt-1">
            Analytics & Reports
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Corridor vulnerability indices, historical benthic incident telemetry, simulation snapshot replay, and executive briefing generator.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 text-[#C87954]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="btn-primary"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Executive Dossier</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0EBE0] rounded-xl p-1 w-fit flex-wrap">
        {(['risk', 'intelligence', 'resilience', 'datasets'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-white text-[#C87954] shadow-xs' : 'text-[#69829A] hover:text-[#454640]'
            }`}
          >
            {tab === 'risk' ? 'Risk & Incidents' : tab === 'intelligence' ? 'Network Intelligence' : tab === 'resilience' ? `Resilience (${srlgGroups.length} SRLGs)` : `Dataset Audit (${manifestStats.total})`}
          </button>
        ))}
      </div>

      {/* Tab: Intelligence */}
      {activeTab === 'intelligence' && (
        <div className="space-y-4">
          {/* SRLG Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { v: srlgGroups.length, l: 'Total SRLG Groups', c: 'text-[#C87954]' },
              { v: sharedLandingGroups.length, l: 'Shared Landing Deps', c: 'text-rose-700' },
              { v: corridorGroups.length, l: 'Corridor Overlaps', c: 'text-amber-700' },
              { v: nonIndependentPairs.length, l: 'Non-Independent Pairs', c: 'text-red-700' },
            ].map((s) => (
              <div key={s.l} className="bg-white rounded-xl border border-[#E2DBD0] p-4 text-center shadow-xs">
                <p className={`font-mono text-2xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-[#59738A] font-mono mt-0.5">{s.l}</p>
                <p className="text-[9px] text-[#A69B89] font-mono">DERIVED</p>
              </div>
            ))}
          </div>

          {/* FRA Classification Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs">
            <h2 className="font-sans font-bold text-base text-[#1C1917] pb-3 border-b border-[#F0EBE0] mb-4">
              False Redundancy Classification Matrix
            </h2>
            <p className="text-[10px] text-[#59738A] font-mono mb-4">
               Route coordinates are approximate centrelines. Confidence annotated per assessment. Dataset: v1.0-phase4a-2026-10-30.
            </p>
            <div className="space-y-2">
              {[
                { cls: 'Shared_Corridor_Exposure', colour: 'bg-red-50 border-red-300 text-red-800' },
                { cls: 'Shared_Landing_Station_Dependency', colour: 'bg-rose-50 border-rose-300 text-rose-800' },
                { cls: 'Potentially_Shared_Risk', colour: 'bg-amber-50 border-amber-300 text-amber-800' },
                { cls: 'Shared_Hazard_Exposure', colour: 'bg-purple-50 border-purple-200 text-purple-800' },
                { cls: 'Independent_Based_On_Available_Evidence', colour: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                { cls: 'Insufficient_Evidence', colour: 'bg-gray-50 border-gray-200 text-gray-600' },
              ].map(({ cls, colour }) => {
                const count = fraCounts[cls] || 0;
                if (count === 0) return null;
                const pct = Math.round((count / fraMatrix.length) * 100);
                return (
                  <div key={cls} className="flex items-center gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border w-56 flex-shrink-0 ${colour}`}>
                      {cls.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-[#F0EBE0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C87954] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1C1917] w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Landing Dependencies */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs">
            <h2 className="font-sans font-bold text-base text-[#1C1917] pb-3 border-b border-[#F0EBE0] mb-4">
              Critical Single-Point Landing Station Dependencies
            </h2>
            <div className="space-y-2">
              {sharedLandingGroups
                .sort((a, b) => b.memberCableIds.length - a.memberCableIds.length)
                .map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E2DBD0]">
                    <div>
                      <p className="text-xs font-bold text-[#1C1917]">{g.sharedLandingStationIds?.[0]}</p>
                      <p className="text-[10px] text-[#59738A] font-mono">{g.memberCableIds.join(' · ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-rose-700">{g.memberCableIds.length} cables</p>
                      <p className="text-[9px] font-mono text-[#A69B89]">Confidence: {g.confidence}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Resilience */}
      {activeTab === 'resilience' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-mono text-amber-800">
               All SRLG detections are DERIVED from approximate cable route centrelines.
              Hazard exposure SRLGs use SYNTHETIC data only. Confidence is annotated per group.
              None of these outputs should be used as operational network documentation without independent verification.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {srlgGroups.map((g) => (
              <div key={g.id} className="bg-white rounded-xl border border-[#E2DBD0] p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-bold text-[#1C1917] flex-1 pr-2">{g.name}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border flex-shrink-0 ${
                    g.confidence === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    g.confidence === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>{g.confidence}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {g.memberCableIds.map((id) => (
                    <span key={id} className="px-1.5 py-0.5 bg-[#E8D9BF] text-[#454640] rounded text-[9px] font-mono">{id.toUpperCase()}</span>
                  ))}
                </div>
                <p className="text-[10px] text-[#59738A] leading-relaxed">{g.notes.slice(0, 120)}...</p>
                <p className="text-[9px] text-[#A69B89] font-mono mt-1">Evidence: {g.evidenceClass} · Method: {g.detectionMethod.slice(0, 50)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Dataset Audit */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { v: manifestStats.total, l: 'Total Datasets', c: 'text-[#1C1917]' },
              { v: manifestStats.readyCount, l: 'Ready to Ingest', c: 'text-emerald-700' },
              { v: manifestStats.pendingLicence, l: 'Pending Licence', c: 'text-amber-700' },
              { v: manifestStats.syntheticCount, l: 'Synthetic Only', c: 'text-purple-700' },
            ].map((s) => (
              <div key={s.l} className="bg-white rounded-xl border border-[#E2DBD0] p-4 text-center shadow-xs">
                <p className={`font-mono text-2xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-[#59738A] font-mono mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs">
            <h2 className="font-sans font-bold text-base text-[#1C1917] pb-3 border-b border-[#F0EBE0] mb-4">
              Dataset Provenance Breakdown
            </h2>
            <div className="space-y-3">
              {[
                { label: 'OBSERVED_SOURCE', count: manifestStats.observedCount, c: 'bg-emerald-500', note: ' Pending licence verification for Groups A & C' },
                { label: 'DERIVED', count: manifestStats.derivedCount, c: 'bg-[#83B9A9]', note: 'Computed from observed sources. Preserve transformation logic.' },
                { label: 'SYNTHETIC', count: manifestStats.syntheticCount, c: 'bg-purple-500', note: 'Must be labelled in all UI outputs. Not for operational use.' },
                { label: 'ASSUMPTION', count: manifestStats.assumptionCount, c: 'bg-amber-500', note: 'Documented parameters. All outputs must be tagged ASSUMED.' },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#1C1917]">{p.label}</span>
                    <span className="text-xs font-mono text-[#59738A]">{p.count} datasets</span>
                  </div>
                  <div className="h-2 bg-[#F0EBE0] rounded-full overflow-hidden mb-1">
                    <div className={`h-full ${p.c} rounded-full`} style={{ width: `${(p.count / manifestStats.total) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-[#69829A] font-mono">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-bold text-amber-900 mb-1">Outstanding Real-World Data Gaps</p>
            <ul className="space-y-1">
              {[
                'Real historical AIS vessel positions (MarineTraffic, exactEarth — licensed)',
                'Real cable capacity & utilisation (operator-held, commercially sensitive)',
                'Real traffic demand matrices (operator-held)',
                'Licensed high-resolution bathymetry (GEBCO 2024 open; others licensed)',
                'Real marine weather data (Copernicus/ECMWF API)',
                'Real seismic/hazard data (USGS open; local surveys licensed)',
              ].map((gap) => (
                <li key={gap} className="flex items-start gap-1.5 text-[10px] text-amber-800 font-mono">
                  <span className="text-amber-500 mt-0.5">·</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Risk & Incidents (original content) */}
      {activeTab === 'risk' && <>

      {/* Regional Risk Index Breakdown */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
          <div>
            <h2 className="font-sans font-bold text-base font-bold text-[#1C1917]">
              Regional Subsea Corridor Vulnerability Matrix
            </h2>
            <p className="font-mono text-[10px] text-[#59738A]">
              Composite risk evaluated across shipping density, geological faults, and route concentration
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-[#1E5685] bg-[#E9F0F6] px-2.5 py-1 rounded-lg">
            5 Critical Corridors Assessed
          </span>
        </div>

        <div className="space-y-3">
          {regionalRisks.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-[#1C1917]">{item.region}</span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.level === 'Critical'
                      ? 'bg-rose-100 text-rose-800'
                      : item.level === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.level.toUpperCase()} ({item.riskScore})
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[#E2DBD0] overflow-hidden mb-1.5">
                <div
                  className={`h-full ${
                    item.level === 'Critical'
                      ? 'bg-rose-600'
                      : item.level === 'High'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${item.riskScore * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[10px] text-[#59738A]">
                <span>{item.detail}</span>
                <span>Active Systems: <strong>{item.cables} Cables</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column: Incident Causes Distribution & Simulation Snapshot History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Historical Root Cause Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#F0EBE0]">
            <h3 className="font-sans font-bold text-base font-bold text-[#1C1917]">
              Subsea Failure Root Cause Breakdown
            </h3>
            <p className="font-mono text-[10px] text-[#59738A]">
              Historical dataset of 414 international benthic faults
            </p>
          </div>

          <div className="space-y-3">
            {incidentCauses.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#1C1917] font-medium">{item.cause}</span>
                  <span className="font-mono font-bold text-[#1C1917]">{item.share} ({item.count})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE4D7] overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.share }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#F0EBE0]">
            <p className="font-mono text-[10px] text-[#69829A] leading-relaxed">
              * Source: International Cable Protection Committee (ICPC) verified historical subsea telemetry.
            </p>
          </div>
        </div>

        {/* Right Column: Simulation Snapshot Registry & Replay (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
            <div>
              <h3 className="font-sans font-bold text-base font-bold text-[#1C1917]">
                Simulation Snapshot History & Audit Trail
              </h3>
              <p className="font-mono text-[10px] text-[#59738A]">
                Immutable, deterministic simulation checkpoints
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#1C1917] bg-[#F5F0E6] px-2.5 py-1 rounded-lg">
              {snapshots.length} Snapshots
            </span>
          </div>

          <div className="space-y-3">
            {snapshots.map((snap) => (
              <div
                key={snap.snapshotId}
                onClick={() => setSelectedSnapshot(snap.snapshotId)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedSnapshot === snap.snapshotId
                    ? 'bg-[#EBF3FA] border-[#A8CBE5] shadow-xs'
                    : 'bg-[#FAF7F2] border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#1C1917]">{snap.name}</span>
                  <span className="font-mono text-[10px] text-[#59738A]">
                    {new Date(snap.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-[#36506A] mt-2">
                  <div>
                    <span className="text-[9px] text-[#7A8E9F] block">Cables Severed:</span>
                    <strong>{snap.scenario.selectedCableIds.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#7A8E9F] block">Served Demand:</span>
                    <strong className="text-emerald-700">{snap.result.servedDemandTbps} Tbps</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#7A8E9F] block">Latency Delta:</span>
                    <strong className="text-amber-700">+{snap.result.latencyDeltaMs} ms</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Printable Executive Summary Card */}
          <div className="p-4 rounded-xl bg-[#F5F0E6] border border-[#DDD3C3] space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-[#1C1917]">
                Active Briefing Summary
              </span>
              <span className="font-mono text-[9px] text-[#69829A]">CLASSIFICATION: RESTRICTED</span>
            </div>
            <p className="text-xs text-[#2A435C] leading-relaxed">
              Dual severance in the Bab el-Mandeb corridor isolates <strong>{simulationResult.unservedDemandTbps} Tbps</strong> of demand with an average latency inflation of <strong>+{simulationResult.latencyDeltaMs}ms</strong>. The Recovery War Room has recommended <strong>{selectedStrategy.title.split(':')[0]}</strong> with prioritized mobilization of <strong>CS Ile de Sein</strong> from Port Said.
            </p>
          </div>
        </div>
      </div>
    </> }
    </div>
  );
}
