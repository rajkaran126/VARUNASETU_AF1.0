/**
 * VARUNASETU Phase 4A — Canonical Network Registry
 *
 * Builds and maintains a versioned bipartite graph:
 *   Cable nodes ↔ Landing Station nodes
 *
 * Design principles:
 * - Does NOT infer direct L–L edges from shared cable membership
 * - Adjacency is cable ↔ landing only (bipartite)
 * - Topology is versioned and immutable once published
 * - All records carry evidence classification
 */

import {
  NetworkGraph,
  NetworkNode,
  NetworkEdge,
  Path,
  ConnectivityResult,
} from '../types-phase4a';
import { CableRoute, LandingStation, ProvenanceType } from '../types';
import { VERIFIED_CABLE_ROUTES, VERIFIED_LANDING_STATIONS } from '../cable-data';

const ENGINE_VERSION = 'vSetu-Registry-1.0';
const CURRENT_DATASET_VERSION = 'v1.0-phase4a-2026-10-30';

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildBipartiteGraph(
  cables: CableRoute[] = VERIFIED_CABLE_ROUTES,
  _landingStations: LandingStation[] = VERIFIED_LANDING_STATIONS
): NetworkGraph {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const adjacency: Record<string, string[]> = {};

  // 1. Create cable nodes
  cables.forEach((cable) => {
    const nodeId = `cable:${cable.id}`;
    nodes.push({
      id: nodeId,
      type: 'cable',
      label: cable.name,
      metadata: {
        status: cable.status,
        region: cable.region,
        rfsYear: cable.rfsYear,
        lengthKm: cable.lengthKm,
        designCapacityTbps: cable.designCapacityTbps,
        litCapacityTbps: cable.litCapacityTbps,
        provenance: cable.provenance,
      },
    });
    adjacency[nodeId] = [];
  });

  // 2. Create landing station nodes (deduplicated)
  const seenLandingIds = new Set<string>();
  cables.forEach((cable) => {
    cable.landingStations.forEach((ls) => {
      if (!seenLandingIds.has(ls.id)) {
        const nodeId = `ls:${ls.id}`;
        nodes.push({
          id: nodeId,
          type: 'landing_station',
          label: ls.name,
          lat: ls.lat,
          lon: ls.lon,
          metadata: {
            city: ls.city,
            country: ls.country,
            region: ls.region,
          },
        });
        adjacency[nodeId] = [];
        seenLandingIds.add(ls.id);
      }
    });
  });

  // 3. Create bipartite edges: cable ↔ landing station
  cables.forEach((cable, _cableIdx) => {
    cable.landingStations.forEach((ls, seq) => {
      const cableNodeId = `cable:${cable.id}`;
      const lsNodeId = `ls:${ls.id}`;
      const edgeId = `edge:${cable.id}:${ls.id}`;

      const litCap = typeof cable.litCapacityTbps === 'number' ? cable.litCapacityTbps : 0;

      const edge: NetworkEdge = {
        id: edgeId,
        sourceId: cableNodeId,
        targetId: lsNodeId,
        capacityTbps: litCap,
        currentLoadTbps: litCap * 0.62, // assumed 62% baseline utilisation
        availableCapacityTbps: litCap * 0.38,
        congested: false,
        sequenceOrder: seq,
        provenance: cable.provenance as ProvenanceType,
      };

      edges.push(edge);

      // Update adjacency (bidirectional)
      adjacency[cableNodeId] = adjacency[cableNodeId] || [];
      adjacency[lsNodeId] = adjacency[lsNodeId] || [];
      adjacency[cableNodeId].push(lsNodeId);
      adjacency[lsNodeId].push(cableNodeId);
    });
  });

  return {
    version: ENGINE_VERSION,
    datasetVersion: CURRENT_DATASET_VERSION,
    nodes,
    edges,
    adjacency,
    createdAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATH FINDING (BFS on bipartite graph)
// ─────────────────────────────────────────────────────────────────────────────

export function findPaths(
  graph: NetworkGraph,
  sourceId: string,
  destinationId: string,
  maxDepth = 8
): Path[] {
  const paths: Path[] = [];
  const edgeMap = new Map<string, NetworkEdge>();
  graph.edges.forEach((e) => {
    edgeMap.set(`${e.sourceId}:${e.targetId}`, e);
    edgeMap.set(`${e.targetId}:${e.sourceId}`, e); // undirected
  });

  // BFS to find all paths up to maxDepth
  const queue: Array<{ node: string; path: string[]; edgeIds: string[]; visited: Set<string> }> = [
    { node: sourceId, path: [sourceId], edgeIds: [], visited: new Set([sourceId]) },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.node === destinationId && current.edgeIds.length > 0) {
      const pathEdges = current.edgeIds
        .map((eid) => graph.edges.find((e) => e.id === eid))
        .filter((e): e is NetworkEdge => !!e);
      const caps = pathEdges.map((e) => e.availableCapacityTbps ?? 0);
      paths.push({
        nodes: current.path,
        edges: current.edgeIds,
        totalCapacityTbps: caps.reduce((a, b) => a + b, 0),
        bottleneckCapacityTbps: caps.length > 0 ? Math.min(...caps) : 0,
      });
      continue;
    }
    if (current.path.length >= maxDepth) continue;

    const neighbours = graph.adjacency[current.node] || [];
    for (const neighbour of neighbours) {
      if (current.visited.has(neighbour)) continue;
      const edgeKey1 = `${current.node}:${neighbour}`;
      const edgeKey2 = `${neighbour}:${current.node}`;
      const foundEdge = edgeMap.get(edgeKey1) || edgeMap.get(edgeKey2);
      if (!foundEdge) continue;

      const newVisited = new Set(current.visited);
      newVisited.add(neighbour);
      queue.push({
        node: neighbour,
        path: [...current.path, neighbour],
        edgeIds: [...current.edgeIds, foundEdge.id],
        visited: newVisited,
      });
    }
  }

  return paths;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTIVITY ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export function computeConnectivity(
  graph: NetworkGraph,
  failedNodeIds: string[]
): ConnectivityResult {
  const failedSet = new Set(failedNodeIds);
  const activeNodes = graph.nodes.filter((n) => !failedSet.has(n.id)).map((n) => n.id);
  const activeEdges = graph.edges.filter(
    (e) => !failedSet.has(e.sourceId) && !failedSet.has(e.targetId)
  );

  // Build active adjacency
  const activeAdj: Record<string, string[]> = {};
  activeNodes.forEach((n) => (activeAdj[n] = []));
  activeEdges.forEach((e) => {
    if (activeAdj[e.sourceId]) activeAdj[e.sourceId].push(e.targetId);
    if (activeAdj[e.targetId]) activeAdj[e.targetId].push(e.sourceId);
  });

  // BFS to find connected components
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of activeNodes) {
    if (visited.has(node)) continue;
    const component: string[] = [];
    const q = [node];
    while (q.length > 0) {
      const curr = q.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      component.push(curr);
      (activeAdj[curr] || []).forEach((n) => { if (!visited.has(n)) q.push(n); });
    }
    components.push(component);
  }

  const isolatedNodes = components.filter((c) => c.length === 1).flat();

  const lostCapacity = graph.edges
    .filter((e) => failedSet.has(e.sourceId) || failedSet.has(e.targetId))
    .reduce((sum, e) => sum + (e.capacityTbps || 0), 0);

  const remainingCapacity = activeEdges.reduce((sum, e) => sum + (e.availableCapacityTbps || 0), 0);

  return {
    connected: components.length <= 1,
    components,
    isolatedNodes,
    survivingEdges: activeEdges,
    lostCapacityTbps: +lostCapacity.toFixed(2),
    remainingCapacityTbps: +remainingCapacity.toFixed(2),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING STATION SHARED-CABLE LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all cable IDs that share a given landing station */
export function getCablesAtLandingStation(
  graph: NetworkGraph,
  landingStationId: string
): string[] {
  const lsNodeId = `ls:${landingStationId}`;
  const neighbours = graph.adjacency[lsNodeId] || [];
  return neighbours.map((n) => n.replace('cable:', ''));
}

/** Returns all landing station IDs shared between two cables */
export function getSharedLandingStations(
  graph: NetworkGraph,
  cableIdA: string,
  cableIdB: string
): string[] {
  const lsA = new Set(
    (graph.adjacency[`cable:${cableIdA}`] || []).map((n) => n.replace('ls:', ''))
  );
  const lsB = (graph.adjacency[`cable:${cableIdB}`] || []).map((n) => n.replace('ls:', ''));
  return lsB.filter((ls) => lsA.has(ls));
}

/** Returns map of landing station id → cable ids for shared-landing detection */
export function buildLandingStationIndex(
  cables: CableRoute[]
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  cables.forEach((cable) => {
    cable.landingStations.forEach((ls) => {
      const existing = index.get(ls.id) || [];
      existing.push(cable.id);
      index.set(ls.id, existing);
    });
  });
  return index;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON REGISTRY INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let _cachedGraph: NetworkGraph | null = null;

export function getNetworkGraph(forceRebuild = false): NetworkGraph {
  if (!_cachedGraph || forceRebuild) {
    _cachedGraph = buildBipartiteGraph();
  }
  return _cachedGraph;
}

export function invalidateNetworkGraph(): void {
  _cachedGraph = null;
}
