import { CableRoute, ScenarioConfig, SimulationResult, RouteLoadMetrics, RecoveryMilestone } from './types';
import { VERIFIED_CABLE_ROUTES } from './cable-data';

/**
 * Deterministic Submarine Cable Network Simulation Engine
 * 
 * Computes capacity allocation, unserved traffic demand, capacity utilization,
 * and propagation latency delta following physical or logical subsea impairments.
 */
export function runNetworkSimulation(
  scenario: ScenarioConfig,
  allCables: CableRoute[] = VERIFIED_CABLE_ROUTES
): SimulationResult {
  const seed = 20261030;
  
  // 1. Identify damaged and surviving cables
  const failedCableSet = new Set(scenario.selectedCableIds);
  const damagedCables = allCables.filter(c => failedCableSet.has(c.id));
  const survivingCables = allCables.filter(c => !failedCableSet.has(c.id));

  // 2. Compute lost capacity from damaged systems
  let lostCapacityTbps = 0;
  damagedCables.forEach(c => {
    const cap = typeof c.litCapacityTbps === 'number' ? c.litCapacityTbps : (typeof c.designCapacityTbps === 'number' ? c.designCapacityTbps : 10.0);
    lostCapacityTbps += cap;
  });

  // 3. Assess total offered demand in the affected region/corridor
  const totalOfferedDemand = Math.max(scenario.trafficDemandAssumptionTbps, lostCapacityTbps * 1.15);

  // 4. Candidate alternate paths (filtered by user selection or topology availability)
  const candidateAlternateRoutes = survivingCables.filter(c => {
    if (scenario.availableAlternateRoutes.length > 0) {
      return scenario.availableAlternateRoutes.includes(c.id);
    }
    // Default: routes in the same region or transoceanic bypasses
    return c.status === 'Operational';
  });

  // 5. Allocate traffic across available alternate routes with capacity caps
  let remainingDemandToReroute = lostCapacityTbps;
  const affectedRoutesMetrics: RouteLoadMetrics[] = [];

  // Baseline latency for direct path (typically ~65ms - 75ms for Euro-Asia or Transatlantic)
  const baselineLatencyMs = 68.4;
  let weightedLatencySum = 0;
  let totalRoutedThroughput = 0;

  candidateAlternateRoutes.forEach((altRoute) => {
    const maxCapacity = typeof altRoute.litCapacityTbps === 'number' 
      ? altRoute.litCapacityTbps 
      : (typeof altRoute.designCapacityTbps === 'number' ? altRoute.designCapacityTbps : 20.0);
    
    // Initial standard load is typically ~60% to 70% in operational steady-state
    const initialLoadFactor = 0.62;
    const initialThroughput = +(maxCapacity * initialLoadFactor).toFixed(1);
    const availableHeadroom = +(maxCapacity - initialThroughput).toFixed(1);

    // Deterministically absorb traffic up to 92% capacity safety threshold
    const maxSafeIntake = +(availableHeadroom * 0.90).toFixed(1);
    const trafficAbsorbed = Math.min(remainingDemandToReroute, maxSafeIntake);
    remainingDemandToReroute = +(remainingDemandToReroute - trafficAbsorbed).toFixed(1);

    const postThroughput = +(initialThroughput + trafficAbsorbed).toFixed(1);
    const postLoadPct = Math.min(100, +((postThroughput / maxCapacity) * 100).toFixed(1));
    const headroomLeft = +(maxCapacity - postThroughput).toFixed(1);

    // Routing penalty: alternative paths add distance-based propagation delay
    // Speed of light in silica fiber ~ 200 km / ms
    const routeDistance = typeof altRoute.lengthKm === 'number' ? altRoute.lengthKm : 12000;
    const pathLatencyMs = +(routeDistance / 195.0 + 8.5).toFixed(1); // 8.5ms optical amplifier / transponder DSP delay

    weightedLatencySum += (postThroughput * pathLatencyMs);
    totalRoutedThroughput += postThroughput;

    affectedRoutesMetrics.push({
      routeId: altRoute.id,
      routeName: altRoute.name,
      initialLoadPct: +(initialLoadFactor * 100).toFixed(1),
      postFailureLoadPct: postLoadPct,
      initialThroughputTbps: initialThroughput,
      postFailureThroughputTbps: postThroughput,
      maxCapacityTbps: maxCapacity,
      headroomTbps: Math.max(0, headroomLeft),
      congested: postLoadPct >= 85.0
    });
  });

  // 6. Calculate total served vs unserved demand
  const unservedDemand = Math.max(0, remainingDemandToReroute);
  const servedDemand = +(totalOfferedDemand - unservedDemand).toFixed(1);
  const capacityUtilizationPct = totalOfferedDemand > 0 
    ? +((servedDemand / totalOfferedDemand) * 100).toFixed(1) 
    : 100;

  // 7. Latency impact calculation
  const impactedLatencyMs = totalRoutedThroughput > 0 
    ? +(weightedLatencySum / totalRoutedThroughput).toFixed(1)
    : baselineLatencyMs;
  const latencyDeltaMs = +(impactedLatencyMs - baselineLatencyMs).toFixed(1);

  // 8. Deterministic recovery timeline milestones
  const recoveryMilestones: RecoveryMilestone[] = [
    {
      phase: 'T+00:00:00 (Incident Trigger)',
      description: `Optical signal lost on ${scenario.faultLocation.description}. Automatic DWDM loss-of-light alarm generated.`,
      etaHours: 0,
      capacityRecoveredPct: +(( (totalOfferedDemand - lostCapacityTbps) / totalOfferedDemand ) * 100).toFixed(1)
    },
    {
      phase: 'T+00:04:15 (BGP Convergence)',
      description: 'Autonomous Systems trigger BGP withdrawal. Initial dynamic rerouting across surviving consortia lines.',
      etaHours: 0.07,
      capacityRecoveredPct: +(capacityUtilizationPct * 0.70).toFixed(1)
    },
    {
      phase: 'T+02:30:00 (Carrier Spectral Grooming)',
      description: 'Carrier NOCs activate burst spectrum leases across AAE-1, 2Africa, and Transpacific bypasses.',
      etaHours: 2.5,
      capacityRecoveredPct: capacityUtilizationPct
    },
    {
      phase: 'T+48:00:00 (Vessel On Station)',
      description: 'DP2 Cable Ship arrives on benthic coordinates. ROV commences seafloor optical beacon survey.',
      etaHours: 48,
      capacityRecoveredPct: capacityUtilizationPct
    },
    {
      phase: 'T+288:00:00 (Universal Joint Splice Restored)',
      description: 'Physical glass fusion splice and armor reinstatement complete. Both fiber directions re-lit at full nominal power.',
      etaHours: 288,
      capacityRecoveredPct: 100.0
    }
  ];

  return {
    scenarioId: scenario.id,
    timestamp: new Date().toISOString(),
    engineVersion: 'vSetu-SimKernel-2.4-Deterministic',
    randomSeed: seed,
    totalOfferedDemandTbps: +totalOfferedDemand.toFixed(1),
    servedDemandTbps: servedDemand,
    unservedDemandTbps: +unservedDemand.toFixed(1),
    capacityUtilizationPct,
    baselineLatencyMs,
    impactedLatencyMs,
    latencyDeltaMs,
    affectedRoutes: affectedRoutesMetrics,
    recoveryMilestones,
    provenance: 'Derived'
  };
}
