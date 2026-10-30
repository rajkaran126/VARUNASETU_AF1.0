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
} from '@/lib/data-store';

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
