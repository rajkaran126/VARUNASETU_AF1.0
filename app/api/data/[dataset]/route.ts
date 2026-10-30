/**
 * GET  /api/data/cables        — all 692 real cables
 * GET  /api/data/landing-points — all 1910 landing points
 * GET  /api/data/incidents      — 100 real GeoCables events
 * GET  /api/data/vessels        — synthetic repair vessels
 * GET  /api/data/traffic        — 25920 rows traffic demand
 * GET  /api/data/telemetry      — cable telemetry
 * GET  /api/data/weather        — marine weather windows
 * GET  /api/data/risk           — cable risk scores
 * GET  /api/data/graph          — network graph nodes+edges
 * GET  /api/data/regions        — region definitions
 * GET  /api/data/status         — seed file inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCables, getLandingPoints, getIncidents, getRepairVessels,
  getTrafficDemand, getCableTelemetry, getMarineWeather, getCableRisk,
  getGraphNodes, getGraphEdges, getRegions, getLatencyEvents,
  getFaultScenarios, getCapacityUtilization, getRecoveryExperiments,
  getRecoveryScenarios, getCascadingFailures, getReroutingDecisions,
  getRepairCosts, getMonteCarlo, getMLFaultFeatures, getIncidentHistory,
  getIncidentTimeline, getLatencyHistory, getBackupConnectivity,
  getUncertainty, getNOAACables, getCableLandingRelations,
  getSeedStatus,
  broadcast, readSeed, writeSeed } from '@/lib/data-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROUTE_MAP: Record<string, () => unknown> = {
  cables:              getCables,
  'landing-points':    getLandingPoints,
  'cable-relations':   getCableLandingRelations,
  incidents:           getIncidents,
  'latency-events':    getLatencyEvents,
  vessels:             getRepairVessels,
  traffic:             getTrafficDemand,
  telemetry:           getCableTelemetry,
  weather:             getMarineWeather,
  risk:                getCableRisk,
  regions:             getRegions,
  'fault-scenarios':   getFaultScenarios,
  'capacity':          getCapacityUtilization,
  'recovery-experiments': getRecoveryExperiments,
  'recovery-scenarios': getRecoveryScenarios,
  'cascading-failures': getCascadingFailures,
  'rerouting':         getReroutingDecisions,
  'repair-costs':      getRepairCosts,
  'monte-carlo':       getMonteCarlo,
  'ml-features':       getMLFaultFeatures,
  'incident-history':  getIncidentHistory,
  'incident-timeline': getIncidentTimeline,
  'latency-history':   getLatencyHistory,
  'backup-connectivity': getBackupConnectivity,
  'uncertainty':       getUncertainty,
  'noaa-cables':       getNOAACables,
  status:              getSeedStatus,
  graph: () => ({ nodes: getGraphNodes(), edges: getGraphEdges() }),
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dataset: string }> }
) {
  const { dataset } = await params;
  const loader = ROUTE_MAP[dataset];
  if (!loader) {
    return NextResponse.json(
      { error: `Unknown dataset "${dataset}". Available: ${Object.keys(ROUTE_MAP).join(', ')}` },
      { status: 404 }
    );
  }

  const data = loader();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
      'X-VARUNASETU-Source': 'data/seeds',
      'X-VARUNASETU-Provenance': 'public-source-derived',
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dataset: string }> }
) {
  const { dataset } = await params;
  try {
    const body = await req.json();
    const recordsToInject = Array.isArray(body)
      ? body
      : body.records
      ? (Array.isArray(body.records) ? body.records : [body.records])
      : [body];

    const fileMap: Record<string, string> = {
      cables: 'cables.json',
      incidents: 'incidents.json',
      'latency-events': 'latency_events.json',
      vessels: 'repair_vessels.json',
      traffic: 'traffic_demand.json',
      telemetry: 'cable_telemetry.json',
      weather: 'marine_weather.json',
      risk: 'cable_risk.json',
    };

    const targetFile = fileMap[dataset];
    let totalCount = 0;

    if (targetFile) {
      const existing = readSeed<Record<string, unknown>[]>(targetFile);
      const merged = [...recordsToInject, ...existing];
      writeSeed(targetFile, merged);
      totalCount = merged.length;
    }

    // Broadcast SSE update event to all active clients
    broadcast({
      type: (dataset in fileMap ? dataset : 'all') as any,
      timestamp: new Date().toISOString(),
      recordCount: totalCount,
      message: `Injected ${recordsToInject.length} records into ${dataset}. Real-time platform updated.`,
    });

    return NextResponse.json({
      success: true,
      injectedCount: recordsToInject.length,
      totalCount,
      dataset,
      timestamp: new Date().toISOString(),
      message: `Successfully injected ${recordsToInject.length} records into ${dataset}. Broadcasted across live SSE stream.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to inject dataset records';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
