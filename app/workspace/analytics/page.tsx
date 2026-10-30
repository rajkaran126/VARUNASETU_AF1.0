'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';

export default function AnalyticsReportsPage() {
  const { cables, simulationResult, selectedStrategy, snapshots, activeFault } = useWorkspace();
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>(snapshots[0]?.snapshotId || '');
  const [exportNotice, setExportNotice] = useState<string>('');

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
    { cause: 'Underwater Seismic / Earthquakes', share: '14%', count: 58, color: 'bg-sky-500' },
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

    setExportNotice('✓ Subsea Telemetry CSV Exported Successfully');
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
          <h1 className="font-grotesk text-2xl lg:text-3xl font-bold text-[#0E2A47] tracking-tight mt-1">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D5CCBC] bg-white hover:bg-[#FAF7F1] text-xs font-semibold text-[#153B5B] shadow-2xs transition-all"
          >
            <svg className="w-4 h-4 text-[#185382]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2A47] hover:bg-[#153B5B] text-white text-xs font-semibold shadow-xs transition-all"
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
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono">
          {exportNotice}
        </div>
      )}

      {/* Regional Risk Index Breakdown */}
      <div className="bg-white rounded-2xl border border-[#E2DBD0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
          <div>
            <h2 className="font-grotesk text-base font-bold text-[#0E2A47]">
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
                <span className="font-bold text-xs text-[#0E2A47]">{item.region}</span>
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
            <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
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
                  <span className="text-[#0E2A47] font-medium">{item.cause}</span>
                  <span className="font-mono font-bold text-[#0E2A47]">{item.share} ({item.count})</span>
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
              <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
                Simulation Snapshot History & Audit Trail
              </h3>
              <p className="font-mono text-[10px] text-[#59738A]">
                Immutable, deterministic simulation checkpoints
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#0E2A47] bg-[#F5F0E6] px-2.5 py-1 rounded-lg">
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
                  <span className="font-bold text-xs text-[#0E2A47]">{snap.name}</span>
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
              <span className="font-mono text-[10px] uppercase font-bold text-[#0E2A47]">
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
    </div>
  );
}

