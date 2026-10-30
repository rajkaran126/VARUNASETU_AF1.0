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

  const [activeTab, setActiveTab] = useState<'overview' | 'inject' | 'cables' | 'incidents' | 'vessels' | 'traffic' | 'seeds'>('overview');
  const [cableSearch, setCableSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('all');

  // Real-Time Data Injection State
  const [injectDataset, setInjectDataset] = useState<string>('incidents');
  const [injectJson, setInjectJson] = useState<string>(
    JSON.stringify({
      alert_number: `ALERT-${Date.now().toString().slice(-4)}`,
      cable_name: "SEA-ME-WE 4",
      alert_type: "Physical Anchor Drag",
      severity: "Critical",
      status: "Active",
      detected_at: new Date().toISOString(),
      resolved_at: "",
      rtt_baseline_ms: "42.5",
      rtt_current_ms: "192.0",
      affected_countries: "EG, SA, DJ, IN",
      verdict: "Confirmed Benthic Severance",
      url: "",
      data_origin: "Live Sensor Ingest",
      record_completeness: "Complete"
    }, null, 2)
  );
  const [injectLoading, setInjectLoading] = useState<boolean>(false);
  const [injectStatus, setInjectStatus] = useState<{ success: boolean; message: string } | null>(null);

  const getTemplateForDataset = (ds: string) => {
    switch (ds) {
      case 'incidents':
        return {
          alert_number: `ALERT-${Date.now().toString().slice(-4)}`,
          cable_name: "SEA-ME-WE 4",
          alert_type: "Physical Anchor Drag",
          severity: "Critical",
          status: "Active",
          detected_at: new Date().toISOString(),
          resolved_at: "",
          rtt_baseline_ms: "42.5",
          rtt_current_ms: "192.0",
          affected_countries: "EG, SA, DJ, IN",
          verdict: "Confirmed Benthic Severance",
          url: "",
          data_origin: "Live Sensor Ingest",
          record_completeness: "Complete"
        };
      case 'telemetry':
        return {
          cable_id: "smw4",
          timestamp_utc: new Date().toISOString(),
          osnr_db: "13.8",
          attenuation_db_per_km: "0.45",
          chromatic_dispersion_ps_nm: "18.2",
          pre_fec_ber: "3.2e-3",
          bgp_flaps_last_hour: "16",
          status: "Alarming"
        };
      case 'vessels':
        return {
          vessel_id: `VESSEL-${Date.now().toString().slice(-4)}`,
          vessel_name: "CS Oceanic Surveyor",
          current_region: "Red Sea / Bab el-Mandeb",
          speed_knots_synthetic: "14.8",
          available: "true",
          repair_capability: "DP2 Class + Hector 6000 ROV",
          mobilization_hours_synthetic: "12",
          daily_cost_usd_synthetic: "68000",
          provenance: "Live Consortium AIS"
        };
      case 'weather':
        return {
          region_id: "red_sea_south",
          timestamp_utc: new Date().toISOString(),
          wave_height_m: "3.4",
          wind_speed_knots: "28",
          sea_state_code: "5",
          current_velocity_knots: "1.8",
          repair_window_open: "false",
          advisory: "Gale force winds near Bab el-Mandeb. ROV operations delayed."
        };
      case 'traffic':
        return {
          timestamp_utc_synthetic: new Date().toISOString(),
          source_region: "Asia-Pacific",
          target_region: "Europe-West",
          demand_tbps_synthetic: "48.5",
          daily_factor: "1.15",
          weekly_factor: "1.05",
          surge_factor: "1.25",
          provenance: "Real-Time NetFlow Ingest"
        };
      default:
        return {
          id: `rec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "Live Injection"
        };
    }
  };

  const handleDatasetChange = (ds: string) => {
    setInjectDataset(ds);
    setInjectJson(JSON.stringify(getTemplateForDataset(ds), null, 2));
    setInjectStatus(null);
  };

  const handleInject = async (targetDataset: string, payload: unknown) => {
    setInjectLoading(true);
    setInjectStatus(null);
    try {
      const res = await fetch(`/api/data/${targetDataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inject record');
      }
      setInjectStatus({
        success: true,
        message: `Successfully injected ${data.injectedCount || 1} record(s) into "${targetDataset}". Broadcasted live over SSE stream!`
      });
    } catch (err: unknown) {
      setInjectStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Injection failed'
      });
    } finally {
      setInjectLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(injectJson);
      handleInject(injectDataset, parsed);
    } catch (err) {
      setInjectStatus({
        success: false,
        message: 'Invalid JSON payload. Please verify format before injection.'
      });
    }
  };

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
              SECTION 07 // REAL-TIME DATA REGISTRY & INJECTION
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
        {(['overview', 'inject', 'cables', 'incidents', 'vessels', 'traffic', 'seeds'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-white text-[#C87954] shadow-xs' : 'text-[#69829A] hover:text-[#454640]'
            }`}
          >
            {tab === 'inject' ? '⚡ Inject Data' :
             tab === 'cables' ? `Cables (${cables.length})` :
             tab === 'incidents' ? `Incidents (${incidents.length})` :
             tab === 'vessels' ? `Vessels (${vessels.length})` :
             tab === 'traffic' ? `Traffic (${traffic.length.toLocaleString()})` :
             tab === 'seeds' ? `Seed Files (${seedStatus.length})` :
             'Overview'}
          </button>
        ))}
      </div>

      {/* 
        ========================================================================
        INJECT DATA TAB (Real-Time Ingestion & SSE Auto-Update)
        ========================================================================
      */}
      {activeTab === 'inject' && (
        <div className="space-y-5">
          {/* Quick Presets */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div>
                <h2 className="font-grotesk text-base font-bold text-[#0E2A47]">
                  1-Click Real-Time Data Injections
                </h2>
                <p className="font-mono text-[10px] text-[#59738A]">
                  Inject synthetic or observed events into the live pipeline · Triggers instant SSE push to all connected nodes
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                SSE Live Broadcast Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleInject('incidents', getTemplateForDataset('incidents'))}
                disabled={injectLoading}
                className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-rose-900">💥 Benthic Severance Incident</span>
                  <span className="font-mono text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">INCIDENT</span>
                </div>
                <p className="font-mono text-[10px] text-rose-700">
                  Injects an anchor drag alert on SEA-ME-WE 4 into <code>incidents.json</code>
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleInject('telemetry', getTemplateForDataset('telemetry'))}
                disabled={injectLoading}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-amber-900">⚡ Optical Telemetry Anomaly</span>
                  <span className="font-mono text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">TELEMETRY</span>
                </div>
                <p className="font-mono text-[10px] text-amber-700">
                  Injects high attenuation (0.45 dB/km) and BGP flaps on DWDM transponders
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleInject('weather', getTemplateForDataset('weather'))}
                disabled={injectLoading}
                className="p-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-teal-900">🌊 Marine Weather Advisory</span>
                  <span className="font-mono text-[9px] bg-teal-200 text-teal-900 px-1.5 py-0.5 rounded">WEATHER</span>
                </div>
                <p className="font-mono text-[10px] text-teal-700">
                  Broadcasts gale force winds & 3.4m wave heights delaying ROV deployment
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleInject('vessels', getTemplateForDataset('vessels'))}
                disabled={injectLoading}
                className="p-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-purple-900">🚢 Vessel AIS Update</span>
                  <span className="font-mono text-[9px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">FLEET</span>
                </div>
                <p className="font-mono text-[10px] text-purple-700">
                  Mobilizes CS Oceanic Surveyor to Bab el-Mandeb coordinates
                </p>
              </button>
            </div>
          </div>

          {/* Custom JSON Injection Studio */}
          <div className="bg-white rounded-2xl border border-[#E2DBD0] p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0EBE0]">
              <div>
                <h3 className="font-grotesk text-base font-bold text-[#0E2A47]">
                  Custom Real-Time Payload Injection Studio
                </h3>
                <p className="font-mono text-[10px] text-[#59738A]">
                  Directly append custom records to the seed registry via <code>POST /api/data/[dataset]</code>
                </p>
              </div>

              {/* Target dataset picker */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#59738A]">Target Dataset:</span>
                <select
                  value={injectDataset}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  className="px-3 py-1.5 bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-xs font-mono font-bold text-[#0E2A47]"
                >
                  <option value="incidents">incidents (GeoCables)</option>
                  <option value="telemetry">telemetry (DWDM/OTDR)</option>
                  <option value="vessels">vessels (Repair Fleet)</option>
                  <option value="traffic">traffic (Demand Rows)</option>
                  <option value="weather">weather (Marine Windows)</option>
                  <option value="cables">cables (Trunk Geometry)</option>
                  <option value="risk">risk (Vulnerability Index)</option>
                </select>
              </div>
            </div>

            {/* Status Message */}
            {injectStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono ${
                  injectStatus.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {injectStatus.message}
              </div>
            )}

            {/* JSON Payload Editor */}
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <textarea
                value={injectJson}
                onChange={(e) => setInjectJson(e.target.value)}
                rows={10}
                className="w-full p-3 font-mono text-xs bg-[#FAF7F2] border border-[#DDD3C3] rounded-xl text-[#0E2A47] focus:outline-none focus:border-[#C87954]"
                placeholder="Enter valid JSON payload or array of records..."
              />

              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#A69B89]">
                  JSON will be written directly into <code>data/seeds/{injectDataset}.json</code> and broadcasted.
                </span>
                <button
                  type="submit"
                  disabled={injectLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0E2A47] hover:bg-[#153B5B] text-white font-mono text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {injectLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Injecting & Broadcasting…</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Inject into Live Stream</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          <div className="flex gap-2 flex-wrap">
            {['all', 'Active', 'Resolved'].map(filter => (
              <button
                key={filter}
                onClick={() => setIncidentFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  incidentFilter === filter ? 'bg-[#0E2A47] text-white' : 'bg-white border border-[#DDD3C3] text-[#59738A]'
                }`}
              >
                {filter === 'all' ? `All (${incidents.length})` : `${filter} (${incidents.filter(i => i.status === filter).length})`}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#FAF7F2] z-10">
                  <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Alert</th>
                    <th className="py-2.5 px-3">Cable</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">RTT Base</th>
                    <th className="py-2.5 px-3 text-right">RTT Current</th>
                    <th className="py-2.5 px-3">Detected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0]">
                  {filteredIncidents.map((inc, i) => (
                    <tr key={inc.alert_number || i} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] text-[#185382] font-bold">{inc.alert_number}</td>
                      <td className="py-2 px-3 font-semibold text-[#0E2A47]">{inc.cable_name}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          inc.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          inc.severity === 'Major' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                          inc.status === 'Active' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{inc.rtt_baseline_ms ? `${inc.rtt_baseline_ms}ms` : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">{inc.rtt_current_ms ? `${inc.rtt_current_ms}ms` : '—'}</td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[#7A8E9F]">{inc.detected_at?.slice(0, 16) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vessels tab */}
      {activeTab === 'vessels' && (
        <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#FAF7F2] z-10">
                <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Vessel ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Current Region</th>
                  <th className="py-2.5 px-3 text-right">Speed (kts)</th>
                  <th className="py-2.5 px-3 text-right">Mobilisation (hrs)</th>
                  <th className="py-2.5 px-3 text-right">Daily Cost (USD)</th>
                  <th className="py-2.5 px-3">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0]">
                {vessels.map((v, i) => (
                  <tr key={v.vessel_id || i} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-2 px-3 font-mono text-[10px] text-[#185382] font-bold">{v.vessel_id}</td>
                    <td className="py-2 px-3 font-semibold text-[#0E2A47]">{v.vessel_name}</td>
                    <td className="py-2 px-3 text-[#59738A]">{v.current_region}</td>
                    <td className="py-2 px-3 text-right font-mono">{v.speed_knots_synthetic || '—'}</td>
                    <td className="py-2 px-3 text-right font-mono">{v.mobilization_hours_synthetic || '—'}h</td>
                    <td className="py-2 px-3 text-right font-mono">${v.daily_cost_usd_synthetic ? Number(v.daily_cost_usd_synthetic).toLocaleString() : '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        v.available === 'true' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {v.available === 'true' ? 'Available' : 'Deployed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Traffic tab */}
      {activeTab === 'traffic' && (
        <div className="space-y-3">
          <p className="text-xs font-mono text-[#59738A]">
            Showing first 50 rows of {traffic.length.toLocaleString()} synthetic traffic demand records.
          </p>
          <div className="bg-white rounded-2xl border border-[#E2DBD0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#FAF7F2] z-10">
                  <tr className="border-b border-[#E8E1D5] text-[#69829A] font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Source Region</th>
                    <th className="py-2.5 px-3">Target Region</th>
                    <th className="py-2.5 px-3 text-right">Demand (Tbps)</th>
                    <th className="py-2.5 px-3 text-right">Surge Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0]">
                  {traffic.slice(0, 50).map((t, i) => (
                    <tr key={i} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] text-[#7A8E9F]">{t.timestamp_utc_synthetic}</td>
                      <td className="py-2 px-3 font-semibold text-[#0E2A47]">{t.source_region}</td>
                      <td className="py-2 px-3 text-[#59738A]">{t.target_region}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#185382]">{t.demand_tbps_synthetic}</td>
                      <td className="py-2 px-3 text-right font-mono">{t.surge_factor || '1.0'}</td>
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
