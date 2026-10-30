/**
 * VARUNASETU — Data Store
 * Server-side in-memory store backed by data/seeds/ JSON files.
 * Provides typed getters and a subscriber system for real-time SSE.
 */

import fs from 'fs';
import path from 'path';

export const SEEDS_DIR = path.join(process.cwd(), 'data', 'seeds');

// ── Subscriber registry for SSE ─────────────────────────────────────────────
type Subscriber = (event: DataEvent) => void;
const subscribers = new Set<Subscriber>();

export interface DataEvent {
  type: 'cables' | 'incidents' | 'vessels' | 'traffic' | 'telemetry' |
        'graph' | 'weather' | 'risk' | 'all' | 'seed_complete';
  timestamp: string;
  recordCount?: number;
  message?: string;
}

export function subscribe(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function broadcast(event: DataEvent) {
  subscribers.forEach(fn => fn(event));
}

// ── Safe JSON file reader & writer ───────────────────────────────────────────
export function readSeed<T = Record<string, unknown>[]>(filename: string): T {
  const filePath = path.join(SEEDS_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return [] as unknown as T;
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as T;
  } catch {
    return [] as unknown as T;
  }
}

export function writeSeed<T>(filename: string, data: T): boolean {
  const filePath = path.join(SEEDS_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

// ── Typed loaders ────────────────────────────────────────────────────────────
export function getCables() { return readSeed('cables.json'); }
export function getLandingPoints() { return readSeed('landing_points.json'); }
export function getCableLandingRelations() { return readSeed('cable_landing_relations.json'); }
export function getGraphNodes() { return readSeed('graph_nodes.json'); }
export function getGraphEdges() { return readSeed('graph_edges.json'); }
export function getIncidents() { return readSeed('incidents.json'); }
export function getLatencyEvents() { return readSeed('latency_events.json'); }
export function getRepairVessels() { return readSeed('repair_vessels.json'); }
export function getTrafficDemand() { return readSeed('traffic_demand.json'); }
export function getCableTelemetry() { return readSeed('cable_telemetry.json'); }
export function getFaultScenarios() { return readSeed('fault_scenarios.json'); }
export function getMarineWeather() { return readSeed('marine_weather.json'); }
export function getCableRisk() { return readSeed('cable_risk.json'); }
export function getCapacityUtilization() { return readSeed('capacity_utilization.json'); }
export function getRegions() { return readSeed('regions.json'); }
export function getRecoveryExperiments() { return readSeed('recovery_experiments.json'); }
export function getRecoveryScenarios() { return readSeed('recovery_scenarios.json'); }
export function getCascadingFailures() { return readSeed('cascading_failures.json'); }
export function getReroutingDecisions() { return readSeed('rerouting_decisions.json'); }
export function getRepairCosts() { return readSeed('repair_costs.json'); }
export function getMonteCarlo() { return readSeed('monte_carlo.json'); }
export function getMLFaultFeatures() { return readSeed('ml_fault_features.json'); }
export function getIncidentHistory() { return readSeed('incident_history.json'); }
export function getIncidentTimeline() { return readSeed('incident_timeline.json'); }
export function getLatencyHistory() { return readSeed('latency_history.json'); }
export function getBackupConnectivity() { return readSeed('backup_connectivity.json'); }
export function getUncertainty() { return readSeed('uncertainty.json'); }
export function getNOAACables() { return readSeed('noaa_cables.json'); }
export function getVarunaSetuSyntheticD1() { return readSeed('varunasetu_synthetic_d1.json'); }
export function getVarunaSetuSyntheticD2() { return readSeed('varunasetu_synthetic_d2.json'); }

// ── Summary stats ────────────────────────────────────────────────────────────
export function getSeedStatus() {
  const files = [
    { key: 'cables', file: 'cables.json' },
    { key: 'landing_points', file: 'landing_points.json' },
    { key: 'cable_landing_relations', file: 'cable_landing_relations.json' },
    { key: 'graph_nodes', file: 'graph_nodes.json' },
    { key: 'graph_edges', file: 'graph_edges.json' },
    { key: 'incidents', file: 'incidents.json' },
    { key: 'latency_events', file: 'latency_events.json' },
    { key: 'repair_vessels', file: 'repair_vessels.json' },
    { key: 'traffic_demand', file: 'traffic_demand.json' },
    { key: 'cable_telemetry', file: 'cable_telemetry.json' },
    { key: 'fault_scenarios', file: 'fault_scenarios.json' },
    { key: 'marine_weather', file: 'marine_weather.json' },
    { key: 'cable_risk', file: 'cable_risk.json' },
    { key: 'capacity_utilization', file: 'capacity_utilization.json' },
    { key: 'regions', file: 'regions.json' },
    { key: 'recovery_experiments', file: 'recovery_experiments.json' },
    { key: 'recovery_scenarios', file: 'recovery_scenarios.json' },
    { key: 'cascading_failures', file: 'cascading_failures.json' },
    { key: 'rerouting_decisions', file: 'rerouting_decisions.json' },
    { key: 'repair_costs', file: 'repair_costs.json' },
    { key: 'monte_carlo', file: 'monte_carlo.json' },
    { key: 'ml_fault_features', file: 'ml_fault_features.json' },
    { key: 'incident_history', file: 'incident_history.json' },
    { key: 'backup_connectivity', file: 'backup_connectivity.json' },
    { key: 'uncertainty', file: 'uncertainty.json' },
    { key: 'noaa_cables', file: 'noaa_cables.json' },
  ];
  return files.map(({ key, file }) => {
    const fp = path.join(SEEDS_DIR, file);
    const exists = fs.existsSync(fp);
    let count = 0;
    let sizeKb = 0;
    if (exists) {
      sizeKb = Math.round(fs.statSync(fp).size / 1024);
      try {
        const d = JSON.parse(fs.readFileSync(fp, 'utf-8').replace(/^\uFEFF/, ''));
        count = Array.isArray(d) ? d.length : 0;
      } catch { count = -1; }
    }
    return { key, file, exists, count, sizeKb };
  });
}

// ── File Watcher — broadcasts SSE events on seed file changes ────────────────
const WATCH_MAP: Record<string, DataEvent['type']> = {
  'cables.json': 'cables',
  'incidents.json': 'incidents',
  'repair_vessels.json': 'vessels',
  'traffic_demand.json': 'traffic',
  'cable_telemetry.json': 'telemetry',
  'graph_nodes.json': 'graph',
  'graph_edges.json': 'graph',
  'marine_weather.json': 'weather',
  'cable_risk.json': 'risk',
};

let _watcherStarted = false;
export function startFileWatcher() {
  if (_watcherStarted) return;
  _watcherStarted = true;
  if (!fs.existsSync(SEEDS_DIR)) return;

  fs.watch(SEEDS_DIR, { persistent: false }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.json')) return;
    const type = WATCH_MAP[filename] ?? 'all';
    const fp = path.join(SEEDS_DIR, filename);
    let count = 0;
    try {
      const d = JSON.parse(fs.readFileSync(fp, 'utf-8').replace(/^\uFEFF/, ''));
      count = Array.isArray(d) ? d.length : 0;
    } catch { /* file may still be writing */ }
    broadcast({ type, timestamp: new Date().toISOString(), recordCount: count, message: `${filename} updated` });
  });
}
