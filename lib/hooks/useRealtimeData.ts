'use client';

/**
 * useRealtimeData — React hook for VARUNASETU real-time data synchronisation.
 *
 * Connects to /api/stream (SSE), fetches initial data from /api/data/[dataset],
 * and updates state whenever the server broadcasts a change event.
 *
 * Usage:
 *   const { cables, incidents, vessels, status, connected } = useRealtimeData();
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types matching the seed JSON schema ──────────────────────────────────────
export interface RealCable {
  cable_id: string;
  cable_name: string;
  length_km: string;
  capacity_tbps: string;
  rfs_year: string;
  landing_point_count: string;
  geometry_type: string;
  source_dataset: string;
  data_class: string;
  notes: string;
}

export interface RealLandingPoint {
  landing_point_id: string;
  landing_point_name: string;
  longitude: string;
  latitude: string;
  is_tbd: string;
  source_dataset: string;
  data_class: string;
}

export interface RealIncident {
  alert_number: string;
  cable_name: string;
  alert_type: string;
  severity: string;
  status: string;
  detected_at: string;
  resolved_at: string;
  rtt_baseline_ms: string;
  rtt_current_ms: string;
  affected_countries: string;
  verdict: string;
  url: string;
  data_origin: string;
  record_completeness: string;
}

export interface RealVessel {
  vessel_id: string;
  vessel_name: string;
  current_region: string;
  speed_knots_synthetic: string;
  available: string;
  repair_capability: string;
  mobilization_hours_synthetic: string;
  daily_cost_usd_synthetic: string;
  provenance: string;
}

export interface RealTrafficRow {
  timestamp_utc_synthetic: string;
  source_region: string;
  target_region: string;
  demand_tbps_synthetic: string;
  daily_factor: string;
  weekly_factor: string;
  surge_factor: string;
  provenance: string;
}

export interface RealWeatherRow {
  [key: string]: string;
}

export interface RealRiskRow {
  [key: string]: string;
}

export interface SeedStatusEntry {
  key: string;
  file: string;
  exists: boolean;
  count: number;
  sizeKb: number;
}

export interface StreamEvent {
  type: string;
  timestamp: string;
  recordCount?: number;
  message?: string;
}

interface RealtimeState {
  cables: RealCable[];
  landingPoints: RealLandingPoint[];
  incidents: RealIncident[];
  vessels: RealVessel[];
  traffic: RealTrafficRow[];
  weather: RealWeatherRow[];
  risk: RealRiskRow[];
  seedStatus: SeedStatusEntry[];
  connected: boolean;
  lastEvent: StreamEvent | null;
  loading: boolean;
  error: string | null;
}

const INITIAL: RealtimeState = {
  cables: [],
  landingPoints: [],
  incidents: [],
  vessels: [],
  traffic: [],
  weather: [],
  risk: [],
  seedStatus: [],
  connected: false,
  lastEvent: null,
  loading: true,
  error: null,
};

// ── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchDataset<T>(dataset: string): Promise<T[]> {
  try {
    const res = await fetch(`/api/data/${dataset}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useRealtimeData(): RealtimeState {
  const [state, setState] = useState<RealtimeState>(INITIAL);
  const esRef = useRef<EventSource | null>(null);

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [cables, landingPoints, incidents, vessels, traffic, weather, risk, seedStatus] = await Promise.all([
        fetchDataset<RealCable>('cables'),
        fetchDataset<RealLandingPoint>('landing-points'),
        fetchDataset<RealIncident>('incidents'),
        fetchDataset<RealVessel>('vessels'),
        fetchDataset<RealTrafficRow>('traffic'),
        fetchDataset<RealWeatherRow>('weather'),
        fetchDataset<RealRiskRow>('risk'),
        fetch('/api/data/status', { cache: 'no-store' }).then(r => r.json()).catch(() => []),
      ]);
      setState(prev => ({
        ...prev,
        cables,
        landingPoints,
        incidents,
        vessels,
        traffic,
        weather,
        risk,
        seedStatus: Array.isArray(seedStatus) ? seedStatus : [],
        loading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: String(err) }));
    }
  }, []);

  // Refresh specific dataset on SSE event
  const refreshDataset = useCallback(async (type: string) => {
    const typeToDataset: Record<string, string> = {
      cables: 'cables',
      incidents: 'incidents',
      vessels: 'vessels',
      traffic: 'traffic',
      telemetry: 'telemetry',
      weather: 'weather',
      risk: 'risk',
      all: 'all',
      seed_complete: 'all',
    };
    const dataset = typeToDataset[type];
    if (!dataset || dataset === 'all') {
      await fetchAll();
      return;
    }
    const data = await fetchDataset(dataset);
    setState(prev => ({ ...prev, [dataset === 'cables' ? 'cables' : dataset]: data }));
  }, [fetchAll]);

  useEffect(() => {
    // Initial fetch
    fetchAll();

    // Connect SSE stream
    const connect = () => {
      if (esRef.current) { esRef.current.close(); }
      const es = new EventSource('/api/stream');
      esRef.current = es;

      es.onopen = () => setState(prev => ({ ...prev, connected: true }));
      es.onerror = () => {
        setState(prev => ({ ...prev, connected: false }));
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };
      es.onmessage = (e) => {
        try {
          const event: StreamEvent = JSON.parse(e.data);
          setState(prev => ({ ...prev, lastEvent: event }));
          if (event.type !== 'connected') {
            refreshDataset(event.type);
          }
        } catch { /* malformed event */ }
      };
    };

    connect();
    return () => {
      esRef.current?.close();
    };
  }, [fetchAll, refreshDataset]);

  return state;
}
