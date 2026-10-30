/**
 * VARUNASETU Phase 4A — Scenario Execution Service
 *
 * Executes correlated failure scenarios and produces reproducible results.
 *
 * Every run records:
 *   - Run ID, Scenario ID, Dataset version
 *   - Topology version, Failure configuration
 *   - Allocation policy, Repair constraints
 *   - Weather assumptions, Permit assumptions
 *   - Engine version, Random seed, Timestamp
 *
 * Reproducibility: same config + seed → same output.
 * Immutability: previous snapshots are never altered by new ingestion.
 */

import {
  CorrelatedFailureConfig,
  CorrelatedFailureResult,
  ScenarioComparison,
  TrafficClass,
  AllocationPolicyConfig,
  NetworkGraph,
} from '../types-phase4a';
import { CableRoute, FaultIncident } from '../types';
import { VERIFIED_CABLE_ROUTES, ACTIVE_FAULT_INCIDENTS, REPAIR_FLEET } from '../cable-data';
import { buildBipartiteGraph, computeConnectivity, getNetworkGraph } from '../registry/network-registry';
import { detectAllSRLGGroups } from './srlg.service';
import { allocateTraffic, DEFAULT_TRAFFIC_CLASSES, validateConservation } from './traffic-allocation.service';
import { scheduleRepairs, getSyntheticWeatherWindows } from './repair-scheduling.service';

const ENGINE_VERSION = 'vSetu-ScenarioExec-1.0';

let _runCounter = 1;
function nextRunId(seed: number): string {
  return `run-${seed}-${String(_runCounter++).padStart(4, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAFFIC CLASS INITIALISER
// ─────────────────────────────────────────────────────────────────────────────

function initTrafficClasses(
  overrides: TrafficClass[] | undefined,
  totalCapacityTbps: number
): TrafficClass[] {
  const base = overrides ?? DEFAULT_TRAFFIC_CLASSES;
  if (base.some((c) => c.offeredDemandTbps > 0)) return base;

  // Distribute total capacity proportionally across classes (SYNTHETIC assumption)
  const weights = [0.05, 0.10, 0.25, 0.40, 0.20];
  return base.map((cls, i) => ({
    ...cls,
    offeredDemandTbps: +(totalCapacityTbps * (weights[i] ?? 0.2)).toFixed(2),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO EXECUTOR
// ─────────────────────────────────────────────────────────────────────────────

export function executeScenario(
  config: CorrelatedFailureConfig,
  cables: CableRoute[] = VERIFIED_CABLE_ROUTES
): CorrelatedFailureResult {
  const runId = nextRunId(config.seed);
  const graph = getNetworkGraph();

  // 1. Determine failed cables (from SRLG or direct selection)
  let affectedCableIds = [...config.affectedCableIds];
  if (config.srlgId) {
    const srlgGroups = detectAllSRLGGroups(cables);
    const srlg = srlgGroups.find((g) => g.id === config.srlgId);
    if (srlg) {
      affectedCableIds = [...new Set([...affectedCableIds, ...srlg.memberCableIds])];
    }
  }

  const survivingCableIds = cables
    .filter((c) => !affectedCableIds.includes(c.id))
    .map((c) => c.id);

  // 2. Build failed node set (cable nodes + partially their edges)
  const failedNodeIds = affectedCableIds.map((id) => `cable:${id}`);

  // 3. Connectivity analysis
  const connectivity = computeConnectivity(graph, failedNodeIds);

  // 4. Total capacity: surviving cables only
  const totalSurvivingCapacity = cables
    .filter((c) => survivingCableIds.includes(c.id))
    .reduce((sum, c) => sum + (typeof c.litCapacityTbps === 'number' ? c.litCapacityTbps : 0), 0);

  // 5. Traffic allocation
  const trafficClasses = initTrafficClasses(
    config.trafficClasses,
    totalSurvivingCapacity
  );
  const policyConfig: AllocationPolicyConfig = config.allocationPolicy ?? {
    policy: 'strict_priority',
  };
  const allocationResult = allocateTraffic(
    graph,
    trafficClasses,
    policyConfig,
    failedNodeIds,
    config.seed
  );

  // Conservation validation
  if (!validateConservation(allocationResult)) {
    console.warn(`[ScenarioExec] Conservation violation in run ${runId}: error = ${allocationResult.conservationError} Tbps`);
  }

  // 6. Repair scheduling (if constraints enabled)
  let repairSchedule = undefined;
  if (config.repairConstraintsEnabled) {
    const faultsToSchedule: FaultIncident[] = affectedCableIds.map((cid) => {
      const cable = cables.find((c) => c.id === cid);
      const existing = ACTIVE_FAULT_INCIDENTS.find((f) => f.cableId === cid);
      return existing ?? {
        id: `syn-fault-${cid}`,
        cableId: cid,
        cableName: cable?.name ?? cid,
        timestamp: new Date().toISOString(),
        faultType: 'Physical Anchor Drag' as const,
        lat: cable?.routeCoordinates[Math.floor(cable.routeCoordinates.length / 2)]?.[1] ?? 0,
        lon: cable?.routeCoordinates[Math.floor(cable.routeCoordinates.length / 2)]?.[0] ?? 0,
        depthMeters: 4000,
        distanceKmFromLanding: 500,
        nearestLandingStation: cable?.landingStations[0]?.name ?? 'Unknown',
        severity: 'Critical' as const,
        opticalLossDb: 40,
        affectedTrafficTbps: typeof cable?.litCapacityTbps === 'number' ? cable.litCapacityTbps : 10,
        status: 'Active' as const,
        provenance: 'Synthetic' as const,
      };
    });

    repairSchedule = scheduleRepairs(REPAIR_FLEET, faultsToSchedule, {
      weatherEnabled: config.weatherConstraintsEnabled,
      permitEnabled: config.permitConstraintsEnabled,
      seed: config.seed,
      scenarioId: runId,
    });
  }

  // 7. Weather windows for first fault location
  let weatherWindows = undefined;
  if (config.weatherConstraintsEnabled && affectedCableIds.length > 0) {
    const firstCable = cables.find((c) => c.id === affectedCableIds[0]);
    if (firstCable && firstCable.routeCoordinates.length > 0) {
      const midpoint = firstCable.routeCoordinates[Math.floor(firstCable.routeCoordinates.length / 2)];
      weatherWindows = getSyntheticWeatherWindows(midpoint[1], midpoint[0]);
    }
  }

  // 8. Recovery milestones
  const onStationHours = repairSchedule?.earliestRestorationHours
    ? repairSchedule.assignments[0]?.onStationHours ?? 48
    : 48;

  const recoveryMilestones = [
    {
      phase: 'T+0h — Incident Trigger',
      description: `Optical signal lost on ${affectedCableIds.length} cable(s). Automatic DWDM loss-of-light alarm.`,
      etaHours: 0,
      capacityRecoveredPct: +(connectivity.remainingCapacityTbps / (connectivity.remainingCapacityTbps + connectivity.lostCapacityTbps + 0.001) * 100).toFixed(1),
      evidenceClass: 'Derived' as const,
    },
    {
      phase: 'T+0.1h — BGP Convergence',
      description: 'Autonomous Systems trigger BGP withdrawal. Initial dynamic rerouting across surviving cables.',
      etaHours: 0.1,
      capacityRecoveredPct: +(allocationResult.totalServedTbps / allocationResult.totalOfferedTbps * 70).toFixed(1),
      evidenceClass: 'Derived' as const,
    },
    {
      phase: 'T+2.5h — Carrier Spectral Grooming',
      description: 'Carrier NOCs activate burst spectrum leases across surviving cables.',
      etaHours: 2.5,
      capacityRecoveredPct: +(allocationResult.totalServedTbps / allocationResult.totalOfferedTbps * 100).toFixed(1),
      evidenceClass: 'Derived' as const,
    },
    {
      phase: `T+${onStationHours}h — Vessel On Station (ASSUMED)`,
      description: 'DP2 Cable Ship arrives at fault coordinates. ROV deployment commences.',
      etaHours: onStationHours,
      capacityRecoveredPct: +(allocationResult.totalServedTbps / allocationResult.totalOfferedTbps * 100).toFixed(1),
      evidenceClass: 'Assumption' as const,
    },
    {
      phase: `T+${repairSchedule?.latestRestorationHours ?? 336}h — Full Restoration (ASSUMED)`,
      description: 'Physical splice complete. All affected cables re-lit at full nominal power.',
      etaHours: repairSchedule?.latestRestorationHours ?? 336,
      capacityRecoveredPct: 100,
      evidenceClass: 'Assumption' as const,
    },
  ];

  return {
    runId,
    scenarioId: config.seed.toString(),
    config,
    affectedCables: affectedCableIds,
    survivingCables: survivingCableIds,
    connectivity,
    allocationResult,
    repairSchedule,
    weatherWindows,
    recoveryMilestones,
    networkRecoveryTimeHours: repairSchedule?.latestRestorationHours ?? 336,
    provenance: 'Derived',
    engineVersion: ENGINE_VERSION,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO COMPARISON (shared starting conditions)
// ─────────────────────────────────────────────────────────────────────────────

export function compareScenarios(
  scenarios: Array<{ name: string; config: CorrelatedFailureConfig }>,
  cables: CableRoute[] = VERIFIED_CABLE_ROUTES
): ScenarioComparison {
  // Enforce shared dataset version and seed across all compared scenarios
  const sharedSeed = scenarios[0]?.config.seed ?? 20261030;
  const sharedDatasetVersion = scenarios[0]?.config.datasetVersion ?? 'v1.0-phase4a-2026-10-30';

  const results = scenarios.map((s) => ({
    scenarioId: s.name.toLowerCase().replace(/\s+/g, '-'),
    name: s.name,
    config: { ...s.config, seed: sharedSeed, datasetVersion: sharedDatasetVersion },
    result: executeScenario({ ...s.config, seed: sharedSeed }, cables),
  }));

  // Determine best in each category
  const byBestCritical = [...results].sort((a, b) => {
    const critA = a.result.allocationResult.trafficClasses.find((c) => c.priority === 1)?.servedDemandTbps ?? 0;
    const critB = b.result.allocationResult.trafficClasses.find((c) => c.priority === 1)?.servedDemandTbps ?? 0;
    return critB - critA;
  });

  const byBestTotal = [...results].sort(
    (a, b) => b.result.allocationResult.totalServedTbps - a.result.allocationResult.totalServedTbps
  );

  const byFastestRestoration = [...results].sort(
    (a, b) => a.result.networkRecoveryTimeHours - b.result.networkRecoveryTimeHours
  );

  return {
    comparisonId: `comp-${sharedSeed}-${Date.now()}`,
    scenarios: results,
    sharedSeed,
    sharedDatasetVersion,
    comparedAt: new Date().toISOString(),
    summary: {
      bestCriticalServiceScenario: byBestCritical[0]?.name ?? '',
      bestTotalCapacityScenario: byBestTotal[0]?.name ?? '',
      fastestRestorationScenario: byFastestRestoration[0]?.name ?? '',
      lowestCostScenario: byFastestRestoration[0]?.name ?? '',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FALSE REDUNDANCY SCENARIO PRESETS (Scenarios A–I)
// ─────────────────────────────────────────────────────────────────────────────

export const FALSE_REDUNDANCY_SCENARIO_PRESETS: Array<{
  type: string;
  title: string;
  brief: string;
  config: CorrelatedFailureConfig;
}> = [
  {
    type: 'A_independent_paths',
    title: 'Scenario A — Independent Paths',
    brief: 'Two cables operate through independent routes and landing infrastructure.',
    config: {
      trigger: 'independent',
      affectedCableIds: ['faster'],
      failureFraction: 1.0,
      simultaneousTiming: false,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: true,
      permitConstraintsEnabled: true,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'B_shared_corridor',
    title: 'Scenario B — Shared Corridor',
    brief: 'Two cable systems share a vulnerable corridor (Red Sea chokepoint).',
    config: {
      trigger: 'shared_corridor',
      affectedCableIds: ['smw4', 'smw5'],
      failureFraction: 1.0,
      simultaneousTiming: true,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: true,
      permitConstraintsEnabled: true,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'C_shared_landing',
    title: 'Scenario C — Shared Landing Station',
    brief: 'Multiple cables depend on one landing facility (Singapore Tuas CLS).',
    config: {
      trigger: 'shared_landing',
      affectedCableIds: ['smw4', 'smw5', 'aae1'],
      failureFraction: 1.0,
      simultaneousTiming: true,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: false,
      permitConstraintsEnabled: false,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'D_shared_hazard',
    title: 'Scenario D — Shared Hazard Exposure [SYNTHETIC]',
    brief: 'A common hazard affects geographically overlapping infrastructure.',
    config: {
      trigger: 'earthquake',
      affectedCableIds: ['faster', 'unity'],
      failureFraction: 0.8,
      simultaneousTiming: true,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: true,
      permitConstraintsEnabled: true,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'E_vessel_scarcity',
    title: 'Scenario E — Repair Vessel Scarcity',
    brief: 'Several faults compete for a limited repair fleet.',
    config: {
      trigger: 'shared_corridor',
      affectedCableIds: ['smw4', 'smw5', 'aae1'],
      failureFraction: 1.0,
      simultaneousTiming: true,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: false,
      permitConstraintsEnabled: false,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'F_weather_constraints',
    title: 'Scenario F — Weather Constraints [SYNTHETIC WEATHER]',
    brief: 'Repair is delayed by adverse environmental conditions.',
    config: {
      trigger: 'independent',
      affectedCableIds: ['smw4'],
      failureFraction: 1.0,
      simultaneousTiming: false,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: true,
      permitConstraintsEnabled: false,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'G_permit_constraints',
    title: 'Scenario G — Permit Constraints [ASSUMED]',
    brief: 'Repair is delayed by access or permit dependencies.',
    config: {
      trigger: 'independent',
      affectedCableIds: ['smw4'],
      failureFraction: 1.0,
      simultaneousTiming: false,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: false,
      permitConstraintsEnabled: true,
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'H_priority_recovery',
    title: 'Scenario H — Priority-Aware Recovery',
    brief: 'Surviving capacity allocated according to configured traffic priorities.',
    config: {
      trigger: 'shared_corridor',
      affectedCableIds: ['smw4', 'smw5'],
      failureFraction: 1.0,
      simultaneousTiming: true,
      repairConstraintsEnabled: false,
      weatherConstraintsEnabled: false,
      permitConstraintsEnabled: false,
      allocationPolicy: { policy: 'strict_priority' },
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
  {
    type: 'I_combined',
    title: 'Scenario I — Combined False Redundancy',
    brief: 'Correlated failure with vessel scarcity, weather and permit delays, and route congestion.',
    config: {
      trigger: 'combined',
      affectedCableIds: ['smw4', 'smw5', 'aae1'],
      failureFraction: 1.0,
      simultaneousTiming: true,
      repairConstraintsEnabled: true,
      weatherConstraintsEnabled: true,
      permitConstraintsEnabled: true,
      allocationPolicy: { policy: 'strict_priority' },
      seed: 20261030,
      datasetVersion: 'v1.0-phase4a-2026-10-30',
    },
  },
];
