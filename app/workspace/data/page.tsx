'use client';

import React, { useState } from 'react';
import { useRealtimeData, RealCable, RealIncident } from '@/lib/hooks/useRealtimeData';

// ── Status dot ────────────────────────────────────────────────────────────────
function LiveDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      <span className={`text-[10px] font-mono font-bold ${connected ? 'text-emerald-700' : 'text-rose-700'}`}>
        {connected ? 'LIVE' : 'RECONNECTING…'}
      </span>
    </span>
  );
}

// ── Seed file row ─────────────────────────────────────────────────────────────
function SeedRow({ entry }: { entry: { key: string; file: string; exists: boolean; count: number; sizeKb: number } }) {
  const colour = entry.exists
    ? entry.count > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
    : 'bg-rose-50 border-rose-200';
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${colour}`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.exists && entry.count > 0 ? 'bg-emerald-500' : entry.exists ? 'bg-amber-500' : 'bg-rose-500'}`} />
        <span className="font-mono text-[#0E2A47] font-medium">{entry.file}</span>
      </div>
      <div className="flex items-center gap-4 font-mono text-[10px] text-[#59738A]">
        <span>{entry.exists ? `${entry.count.toLocaleString()} rows` : 'MISSING'}</span>
        <span>{entry.sizeKb > 0 ? `${entry.sizeKb} KB` : '—'}</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RealTimeDataPage() {
  const {
    cables, landingPoints, incidents, vessels, traffic,
    weather, risk, seedStatus, connected, lastEvent, loading, error
  } = useRealtimeData();

  const [activeTab, setActiveTab] = useState<'overview' | 'cables' | 'incidents' | 'vessels' | 'traffic' | 'seeds'>('overview');
  const [cableSearch, setCableSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('all');

  const filteredCables = cables.filter(c =>
    cableSearch === '' ||
    c.cable_name?.toLowerCase().includes(cableSearch.toLowerCase()) ||
    c.cable_id?.toLowerCase().includes(cableSearch.toLowerCase())
  );

  const filteredIncidents = incidents.filter(i =>
    incidentFilter === 'all' || i.status === incidentFilter
  );

  const totalRecords = cables.length + landingPoints.length + incidents.length + vessels.length + traffic.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DBD0]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-[#4A647D] uppercase tracking-widest">
              SECTION 07 // REAL-TIME DATA REGISTRY
            </span>
            <LiveDot connected={connected} />
            {lastEvent && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800">
                ↻ {lastEvent.message || lastEvent.type} · {new Date(lastEvent.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          <h1 className="font-sans font-bold text-2xl lg:text-3xl text-[#0E2A47] tracking-tight mt-1">
            Data & Infrastructure Hub
          </h1>
          <p className="text-xs text-[#4A647D] mt-0.5 max-w-2xl">
            Live-synced from <code className="bg-[#F0EBE0] px-1 rounded">data/seeds/</code> — SSE stream auto-refreshes on file change.
            Source: TeleGeography-style export (Group A) + GeoCables incidents (Group C) + Synthetic (Groups B, D, E, G).
          </p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="px-4 py-3 rounded-xl bg-white border border-[#E2DBD0] shadow-xs text-right">
            <p className="font-mono text-[10px] text-[#59738A]">Total Seeded Records</p>
            <p className="font-mono text-xl font-bold text-[#C87954]">
              {loading ? '…' : totalRecords.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">{error}</div>
      )}
      {loading && (
        <div className="p-3 rounded-xl bg-[#F5F0E6] border border-[#E2DBD0] text-[#59738A] text-xs font-mono flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-[#C87954] border-t-transparent rounded-full animate-spin" />
          Loading real-time data from API…
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { v: cables.length, l: 'Cables', c: 'text-[#C87954]', src: 'Group A Observed' },
          { v: landingPoints.length, l: 'Landing Points', c: 'text-[#185382]', src: 'Group A Observed' },
          { v: incidents.length, l: 'Incidents', c: 'text-rose-700', src: 'Group C Observed' },
          { v: vessels.length, l: 'Vessels', c: 'text-amber-700', src: 'Group B Synthetic' },
          { v: traffic.length, l: 'Traffic Rows', c: 'text-purple-700', src: 'Group B Synthetic' },
          { v: weather.length, l: 'Weather Rows', c: 'text-[#83B9A9]', src: 'Group G Synthetic' },
          { v: risk.length, l: 'Risk Records', c: 'text-[#A8B99A]', src: 'Group G Synthetic' },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-xl border border-[#E2DBD0] p-3 text-center shadow-xs">
            <p className={`font-mono text-xl font-bold ${s.c}`}>{s.v.toLocaleString()}</p>
            <p className="text-[10px] font-semibold text-[#0E2A47]">{s.l}</p>
            <p className="text-[9px] font-mono text-[#A69B89]">{s.src}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0EBE0] rounded-xl p-1 flex-wrap">
        {(['overview', 'cables', 'incidents', 'vessels', 'traffic', 'seeds'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-white text-[#C87954] shadow-xs' : 'text-[#69829A] hover:text-[#454640]'
            }`}
          >
            {tab === 'cables' ? `Cables (${cables.length})` :
             tab === 'incidents' ? `Incidents (${incidents.length})` :
             tab === 'vessels' ? `Vessels (${vessels.length})` :
             tab === 'traffic' ? `Traffic (${traffic.length.toLocaleString()})` :
             tab === 'seeds' ? `Seed Files (${seedStatus.length})` :
             'Overview'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Live Event Feed */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0] mb-3">
              <h2 className="font-sans font-bold text-sm text-[#0E2A47]">Live Sync Stream</h2>
              <LiveDot connected={connected} />
            </div>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="p-2 rounded-lg bg-[#F5F0E6] border border-[#E2DBD0]">
                <p className="text-[#59738A]">SSE Endpoint: <span className="text-[#0E2A47] font-bold">/api/stream</span></p>
              </div>
              <div className="p-2 rounded-lg bg-[#F5F0E6] border border-[#E2DBD0]">
                <p className="text-[#59738A]">Data API: <span className="text-[#0E2A47] font-bold">/api/data/[dataset]</span></p>
              </div>
              {lastEvent && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-emerald-800">Last event: <strong>{lastEvent.type}</strong></p>
                  <p className="text-emerald-700">{lastEvent.message}</p>
                  <p className="text-emerald-600">{lastEvent.recordCount?.toLocaleString()} records · {lastEvent.timestamp}</p>
                </div>
              )}
              <p className="text-[#A69B89] pt-1">
                File watcher monitors <code>data/seeds/</code> — any change auto-pushes SSE and the UI re-fetches.
              </p>
            </div>
          </div>

          {/* Provenance Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs">
            <h2 className="font-sans font-bold text-sm text-[#0E2A47] pb-3 border-b border-[#F0EBE0] mb-3">Data Provenance</h2>
            <div className="space-y-2">
              {[
                { label: 'Group A — Observed/Derived', note: 'TeleGeography-style cable map. Public-source-derived. Licence: PENDING.', count: cables.length + landingPoints.length, colour: 'bg-emerald-500' },
                { label: 'Group B — Synthetic', note: 'Fleet, traffic, telemetry, fault scenarios. SYNTHETIC_DEMO. Not operational.', count: vessels.length + traffic.length, colour: 'bg-purple-500' },
                { label: 'Group C — Observed', note: 'GeoCables latency monitor. Real network events. Licence: user-provided.', count: incidents.length, colour: 'bg-[#C87954]' },
                { label: 'Group G — Synthetic', note: 'Marine weather, bathymetry, risk scores. SYNTHETIC only.', count: weather.length + risk.length, colour: 'bg-amber-500' },
              ].map(p => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-[#0E2A47]">{p.label}</span>
                    <span className="text-[10px] font-mono text-[#59738A]">{p.count.toLocaleString()} records</span>
                  </div>
                  <div className="h-1.5 bg-[#F0EBE0] rounded-full overflow-hidden mb-1">
                    <div className={`h-full ${p.colour} rounded-full`} style={{ width: `${Math.min(100, (p.count / Math.max(totalRecords, 1)) * 100)}%` }} />
                  </div>
                  <p className="text-[9px] font-mono text-[#69829A]">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cables tab */}
      {activeTab === 'cables' && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search cable name or ID…"
              value={cableSearch}
              onChange={e => setCableSearch(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDD3C3] rounded-xl text-xs focus:outline-none focus:border-[#C87954] w-72"
            />
            <span className="text-xs text-[#69829A] self-center font-mono">{filteredCables.length.toLocaleString()} of {cables.length.toLocaleString()}</span>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#FAF7F2] z-10">
                  <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Cable ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3 text-right">Length (km)</th>
                    <th className="py-2.5 px-3 text-right">RFS Year</th>
                    <th className="py-2.5 px-3 text-right">Landings</th>
                    <th className="py-2.5 px-3">Data Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0]">
                  {filteredCables.map((c, i) => (
                    <tr key={c.cable_id || i} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] text-[#185382] font-bold">{c.cable_id}</td>
                      <td className="py-2 px-3 font-semibold text-[#0E2A47]">{c.cable_name}</td>
                      <td className="py-2 px-3 text-right font-mono">{c.length_km ? Number(c.length_km).toLocaleString() : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono">{c.rfs_year || '—'}</td>
                      <td className="py-2 px-3 text-right font-mono">{c.landing_point_count || '—'}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {c.data_class || 'observed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incidents tab */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <select
              value={incidentFilter}
              onChange={e => setIncidentFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDD3C3] rounded-xl text-xs focus:outline-none focus:border-[#C87954]"
            >
              <option value="all">All Statuses</option>
              <option value="monitoring">Monitoring (Active)</option>
              <option value="resolved">Resolved</option>
            </select>
            <span className="text-xs text-[#69829A] self-center font-mono">{filteredIncidents.length} events</span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg self-center">
              ⚠ Source: GeoCables API extract — user-provided. Licence status: pending.
            </span>
          </div>
          <div className="space-y-2">
            {filteredIncidents.map((inc, i) => {
              const rttBase = Number(inc.rtt_baseline_ms);
              const rttCurr = Number(inc.rtt_current_ms);
              const spike = rttCurr > rttBase ? rttCurr - rttBase : 0;
              return (
                <div key={i} className={`p-4 rounded-xl border transition-colors ${inc.status === 'monitoring' ? 'bg-rose-50 border-rose-200' : 'bg-white border-[#E2DBD0]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-xs text-[#0E2A47]">{inc.cable_name}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${inc.status === 'monitoring' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {inc.status?.toUpperCase()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border bg-amber-50 text-amber-700 border-amber-200">
                          {inc.alert_type}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1.5 font-mono text-[10px] text-[#59738A] flex-wrap">
                        <span>RTT baseline: {inc.rtt_baseline_ms}ms</span>
                        <span>RTT current: <strong className={spike > 20 ? 'text-rose-700' : 'text-[#0E2A47]'}>{inc.rtt_current_ms}ms</strong></span>
                        {spike > 0 && <span className="text-rose-700">+{spike.toFixed(0)}ms spike</span>}
                        <span>Verdict: {inc.verdict}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-mono text-[#59738A]">{new Date(inc.detected_at).toLocaleDateString()}</p>
                      {inc.url && (
                        <a href={inc.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-[#185382] underline hover:text-[#C87954]">
                          GeoCables ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vessels tab */}
      {activeTab === 'vessels' && (
        <div className="space-y-3">
          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-[10px] font-mono text-purple-800">⚠ Repair fleet data is SYNTHETIC (provenance: synthetic_demo). Vessel positions, speeds and availability are not real.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vessels.map((v, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E2DBD0] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-[#0E2A47]">{v.vessel_name}</p>
                    <p className="text-[10px] font-mono text-[#59738A]">{v.vessel_id} · Region: {v.current_region}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${v.available === 'TRUE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {v.available === 'TRUE' ? 'AVAILABLE' : 'UNAVAILABLE'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { v: `${v.speed_knots_synthetic}kt`, l: 'Speed' },
                    { v: `${v.mobilization_hours_synthetic}h`, l: 'Mobilise' },
                    { v: `$${Number(v.daily_cost_usd_synthetic).toLocaleString()}`, l: 'Daily Cost' },
                  ].map(s => (
                    <div key={s.l} className="p-2 bg-[#FAF7F2] rounded-lg border border-[#E8E1D5]">
                      <p className="font-mono text-sm font-bold text-[#0E2A47]">{s.v}</p>
                      <p className="text-[9px] text-[#59738A]">{s.l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] font-mono text-[#59738A]">Capability: {v.repair_capability}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traffic tab */}
      {activeTab === 'traffic' && (
        <div className="space-y-3">
          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-[10px] font-mono text-purple-800">
              ⚠ {traffic.length.toLocaleString()} rows of SYNTHETIC hourly traffic demand. Not real operator data. Showing first 100 rows.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#FAF7F2] z-10">
                  <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Src Region</th>
                    <th className="py-2.5 px-3">Dst Region</th>
                    <th className="py-2.5 px-3 text-right">Demand (Tbps)</th>
                    <th className="py-2.5 px-3 text-right">Surge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0]">
                  {traffic.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-[#FAF7F2]">
                      <td className="py-1.5 px-3 font-mono text-[10px] text-[#59738A]">{row.timestamp_utc_synthetic?.slice(0, 16) || '—'}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-[#185382]">{row.source_region}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-[#185382]">{row.target_region}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-[#0E2A47]">{Number(row.demand_tbps_synthetic).toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right font-mono">
                        <span className={Number(row.surge_factor) > 1 ? 'text-rose-700 font-bold' : 'text-[#59738A]'}>
                          {Number(row.surge_factor).toFixed(2)}×
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Seeds tab */}
      {activeTab === 'seeds' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#F5F0E6] border border-[#E2DBD0]">
            <p className="text-xs font-semibold text-[#0E2A47] mb-1">Seed File Registry — <code>data/seeds/</code></p>
            <p className="text-[10px] font-mono text-[#59738A]">
              Files are watched by the SSE stream. Editing or replacing a seed file instantly triggers a push event and the platform re-fetches.
            </p>
          </div>
          <div className="space-y-1.5">
            {seedStatus.length === 0 ? (
              <p className="text-xs text-[#69829A] font-mono">Loading seed status…</p>
            ) : (
              seedStatus.map(entry => <SeedRow key={entry.key} entry={entry} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
