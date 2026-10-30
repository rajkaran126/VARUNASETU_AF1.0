/**
 * VARUNASETU Phase 4A — Traffic Allocation Service
 *
 * Priority-aware, capacity-constrained traffic allocation.
 *
 * Conservation law: served + unserved = offered ± tolerance (0.001 Tbps)
 * Capacity law: allocated ≤ available capacity per edge
 *
 * Policies supported:
 *   equal_share        — all traffic classes treated with equal priority
 *   strict_priority    — fully serve class N before allocating to class N+1
 *   weighted_priority  — allocate proportional to configured weights
 *   min_service_guarantee — reserve minimum % per class, then distribute surplus
 */

import {
  TrafficClass,
  AllocationPolicy,
  AllocationPolicyConfig,
  AllocationResult,
  NetworkGraph,
  NetworkEdge,
} from '../types-phase4a';

const ENGINE_VERSION = 'vSetu-Traffic-1.0';
const CONGESTION_THRESHOLD = 0.85;   // 85% capacity utilisation → congested
const CONSERVATION_TOLERANCE = 0.001; // Tbps

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT TRAFFIC CLASSES
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_TRAFFIC_CLASSES: TrafficClass[] = [
  {
    id: 'tc-critical',
    name: 'Critical Services',
    description: 'Emergency communications, government, financial settlement systems',
    priority: 1,
    minServiceGuaranteePct: 100,
    offeredDemandTbps: 0,
    evidenceClass: 'Synthetic',
  },
  {
    id: 'tc-essential',
    name: 'Essential Communications',
    description: 'Healthcare, public safety, essential infrastructure control',
    priority: 2,
    minServiceGuaranteePct: 90,
    offeredDemandTbps: 0,
    evidenceClass: 'Synthetic',
  },
  {
    id: 'tc-enterprise',
    name: 'Enterprise & Financial',
    description: 'Enterprise VPN, financial data, business continuity traffic',
    priority: 3,
    minServiceGuaranteePct: 70,
    offeredDemandTbps: 0,
    evidenceClass: 'Synthetic',
  },
  {
    id: 'tc-commercial',
    name: 'Standard Commercial',
    description: 'Bulk internet transit, streaming, cloud CDN replication',
    priority: 4,
    offeredDemandTbps: 0,
    evidenceClass: 'Synthetic',
  },
  {
    id: 'tc-best-effort',
    name: 'Best-Effort',
    description: 'Non-critical background transfers, asynchronous sync',
    priority: 5,
    offeredDemandTbps: 0,
    evidenceClass: 'Synthetic',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CAPACITY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

function cloneEdges(edges: NetworkEdge[]): NetworkEdge[] {
  return edges.map((e) => ({ ...e }));
}

function totalAvailable(edges: NetworkEdge[]): number {
  return edges.reduce((sum, e) => sum + (e.availableCapacityTbps ?? 0), 0);
}

function allocateToEdges(
  edges: NetworkEdge[],
  demandTbps: number
): number /* actuallyAllocated */ {
  let remaining = demandTbps;
  for (const edge of edges) {
    if (remaining <= 0) break;
    const headroom = edge.availableCapacityTbps ?? 0;
    const take = Math.min(remaining, headroom);
    edge.availableCapacityTbps = +(headroom - take).toFixed(4);
    edge.currentLoadTbps = +((edge.currentLoadTbps ?? 0) + take).toFixed(4);
    edge.congested = ((edge.currentLoadTbps ?? 0) / (edge.capacityTbps ?? 1)) >= CONGESTION_THRESHOLD;
    remaining = +(remaining - take).toFixed(4);
  }
  return +(demandTbps - remaining).toFixed(4);
}

// ─────────────────────────────────────────────────────────────────────────────
// ALLOCATION POLICIES
// ─────────────────────────────────────────────────────────────────────────────

function allocateEqualShare(
  classes: TrafficClass[],
  edges: NetworkEdge[]
): TrafficClass[] {
  const totalDemand = classes.reduce((s, c) => s + c.offeredDemandTbps, 0);
  const available = totalAvailable(edges);
  const ratio = totalDemand > 0 ? Math.min(1, available / totalDemand) : 0;

  return classes.map((cls) => {
    const target = +(cls.offeredDemandTbps * ratio).toFixed(4);
    const served = allocateToEdges(edges, target);
    return {
      ...cls,
      servedDemandTbps: served,
      unservedDemandTbps: +(cls.offeredDemandTbps - served).toFixed(4),
    };
  });
}

function allocateStrictPriority(
  classes: TrafficClass[],
  edges: NetworkEdge[]
): TrafficClass[] {
  const sorted = [...classes].sort((a, b) => a.priority - b.priority);
  return sorted.map((cls) => {
    const served = allocateToEdges(edges, cls.offeredDemandTbps);
    return {
      ...cls,
      servedDemandTbps: served,
      unservedDemandTbps: +(cls.offeredDemandTbps - served).toFixed(4),
    };
  });
}

function allocateWeightedPriority(
  classes: TrafficClass[],
  edges: NetworkEdge[],
  weights: Record<string, number>
): TrafficClass[] {
  const available = totalAvailable(edges);
  const totalWeight = classes.reduce((s, c) => s + (weights[c.id] ?? 1), 0);
  return classes.map((cls) => {
    const share = ((weights[cls.id] ?? 1) / totalWeight) * available;
    const target = Math.min(cls.offeredDemandTbps, share);
    const served = allocateToEdges(edges, target);
    return {
      ...cls,
      servedDemandTbps: served,
      unservedDemandTbps: +(cls.offeredDemandTbps - served).toFixed(4),
    };
  });
}

function allocateMinServiceGuarantee(
  classes: TrafficClass[],
  edges: NetworkEdge[],
  defaultMinPct: number
): TrafficClass[] {
  const sorted = [...classes].sort((a, b) => a.priority - b.priority);
  const result: TrafficClass[] = [];

  // Pass 1: serve minimum guarantees
  for (const cls of sorted) {
    const minPct = cls.minServiceGuaranteePct ?? defaultMinPct;
    const minTarget = +(cls.offeredDemandTbps * (minPct / 100)).toFixed(4);
    const served = allocateToEdges(edges, minTarget);
    result.push({
      ...cls,
      servedDemandTbps: served,
      unservedDemandTbps: +(cls.offeredDemandTbps - served).toFixed(4),
    });
  }

  // Pass 2: distribute remaining capacity by strict priority
  for (let i = 0; i < result.length; i++) {
    const cls = result[i];
    const remaining = cls.unservedDemandTbps ?? 0;
    if (remaining <= 0) continue;
    const extraServed = allocateToEdges(edges, remaining);
    result[i] = {
      ...cls,
      servedDemandTbps: +(( cls.servedDemandTbps ?? 0) + extraServed).toFixed(4),
      unservedDemandTbps: +(remaining - extraServed).toFixed(4),
    };
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ALLOCATOR
// ─────────────────────────────────────────────────────────────────────────────

export function allocateTraffic(
  graph: NetworkGraph,
  trafficClasses: TrafficClass[],
  policyConfig: AllocationPolicyConfig,
  failedNodeIds: string[] = [],
  seed = 20261030
): AllocationResult {
  const runId = `alloc-${seed}-${Date.now()}`;

  // Only use surviving edges
  const failedSet = new Set(failedNodeIds);
  const survivingEdges = cloneEdges(
    graph.edges.filter(
      (e) => !failedSet.has(e.sourceId) && !failedSet.has(e.targetId)
    )
  );

  let resultClasses: TrafficClass[];

  switch (policyConfig.policy) {
    case 'strict_priority':
      resultClasses = allocateStrictPriority(trafficClasses, survivingEdges);
      break;
    case 'weighted_priority':
      resultClasses = allocateWeightedPriority(
        trafficClasses,
        survivingEdges,
        policyConfig.weights ?? {}
      );
      break;
    case 'min_service_guarantee':
      resultClasses = allocateMinServiceGuarantee(
        trafficClasses,
        survivingEdges,
        policyConfig.minGuaranteePct ?? 50
      );
      break;
    case 'equal_share':
    default:
      resultClasses = allocateEqualShare(trafficClasses, survivingEdges);
  }

  const totalOffered = +trafficClasses
    .reduce((s, c) => s + c.offeredDemandTbps, 0)
    .toFixed(4);
  const totalServed = +resultClasses
    .reduce((s, c) => s + (c.servedDemandTbps ?? 0), 0)
    .toFixed(4);
  const totalUnserved = +resultClasses
    .reduce((s, c) => s + (c.unservedDemandTbps ?? 0), 0)
    .toFixed(4);

  // Conservation check
  const conservationError = Math.abs(totalOffered - totalServed - totalUnserved);

  const congestedEdges = survivingEdges.filter((e) => e.congested).map((e) => e.id);
  const bottleneckEdges = survivingEdges
    .filter((e) => (e.availableCapacityTbps ?? 0) < 1.0)
    .map((e) => e.id);

  return {
    runId,
    policy: policyConfig,
    trafficClasses: resultClasses,
    edges: survivingEdges,
    totalOfferedTbps: totalOffered,
    totalServedTbps: totalServed,
    totalUnservedTbps: totalUnserved,
    conservationError: +conservationError.toFixed(6),
    congestedEdges,
    bottleneckEdges,
    provenance: 'Derived',
    timestamp: new Date().toISOString(),
    seed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSERVATION VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

export function validateConservation(result: AllocationResult): boolean {
  return result.conservationError <= CONSERVATION_TOLERANCE;
}

// ─────────────────────────────────────────────────────────────────────────────
// POLICY COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

export function comparePolicies(
  graph: NetworkGraph,
  trafficClasses: TrafficClass[],
  failedNodeIds: string[],
  seed: number
): Record<AllocationPolicy, AllocationResult> {
  const policies: AllocationPolicy[] = [
    'equal_share',
    'strict_priority',
    'weighted_priority',
    'min_service_guarantee',
  ];

  const results = {} as Record<AllocationPolicy, AllocationResult>;

  for (const policy of policies) {
    const policyConfig: AllocationPolicyConfig = {
      policy,
      minGuaranteePct: 60,
      weights: Object.fromEntries(
        trafficClasses.map((c, i) => [c.id, Math.max(1, trafficClasses.length - i)])
      ),
    };
    results[policy] = allocateTraffic(
      graph,
      trafficClasses,
      policyConfig,
      failedNodeIds,
      seed
    );
  }

  return results;
}
