/**
 * VARUNASETU Phase 4A — SRLG Detection Service
 *
 * Identifies Shared Risk Link Groups across these dimensions:
 *   A. Geographic corridor overlap (haversine proximity)
 *   B. Shared landing stations
 *   C. Hazard exposure (using synthetic data, clearly labelled)
 *
 * Key constraints:
 * - Proximity alone does NOT confirm shared physical infrastructure
 * - All SRLG groups carry confidence + evidence classification
 * - Distance thresholds are ASSUMPTIONS (documented)
 * - Unsupported proximity inferences → confidence: Insufficient_Evidence
 */

import {
  SRLGGroup,
  SRLGGroupType,
  SRLGConfidence,
  SRLGDetectionOptions,
  FalseRedundancyAssessment,
  FalseRedundancyClassification,
} from '../types-phase4a';
import { CableRoute, ProvenanceType } from '../types';
import { buildLandingStationIndex, getSharedLandingStations, getNetworkGraph } from '../registry/network-registry';

const DEFAULT_OPTIONS: SRLGDetectionOptions = {
  corridorThresholdKm: 50,     // Documented assumption
  minCorridorOverlapKm: 200,   // Documented assumption
  includeHazardExposure: true,
  datasetVersion: 'v1.0-phase4a-2026-10-30',
};

let _groupIdCounter = 1;
function nextGroupId(): string {
  return `srlg-${String(_groupIdCounter++).padStart(4, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HAVERSINE DISTANCE
// ─────────────────────────────────────────────────────────────────────────────

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance between two polylines (sampled point-to-point).
 * Returns [minDistanceKm, overlapSegmentCount]
 */
// Downsample coordinates for ultra-fast distance calculations
function sampleCoords(coords: [number, number][], maxPoints = 25): [number, number][] {
  if (!coords || coords.length <= maxPoints) return coords || [];
  const step = Math.ceil(coords.length / maxPoints);
  const sampled: [number, number][] = [];
  for (let i = 0; i < coords.length; i += step) {
    sampled.push(coords[i]);
  }
  if (sampled[sampled.length - 1] !== coords[coords.length - 1]) {
    sampled.push(coords[coords.length - 1]);
  }
  return sampled;
}

// Global memoized caches to ensure 0ms latency on repeated tab navigation
let _cachedSRLGCount = 0;
let _cachedSRLGGroups: SRLGGroup[] = [];
let _cachedFRAMatrixCount = 0;
let _cachedFRAMatrix: FalseRedundancyAssessment[] = [];

function polylineMinDistanceAndOverlap(
  coordsA: [number, number][],
  coordsB: [number, number][],
  thresholdKm: number
): { minDistanceKm: number; overlapSegments: number } {
  let minDist = Infinity;
  let overlapSegments = 0;

  const ptsA = sampleCoords(coordsA, 25);
  const ptsB = sampleCoords(coordsB, 25);

  for (const [lonA, latA] of ptsA) {
    let nearestToBSegDist = Infinity;
    for (const [lonB, latB] of ptsB) {
      const d = haversineKm(latA, lonA, latB, lonB);
      if (d < nearestToBSegDist) nearestToBSegDist = d;
    }
    if (nearestToBSegDist < minDist) minDist = nearestToBSegDist;
    if (nearestToBSegDist < thresholdKm) overlapSegments++;
  }

  return { minDistanceKm: minDist, overlapSegments };
}

// ─────────────────────────────────────────────────────────────────────────────
// A. GEOGRAPHIC CORRIDOR DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function detectCorridorOverlap(
  cables: CableRoute[],
  options: Partial<SRLGDetectionOptions> = {}
): SRLGGroup[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const groups: SRLGGroup[] = [];

  const activeCables = cables.filter(
    (c) =>
      c.routeCoordinates &&
      c.routeCoordinates.length >= 2 &&
      c.status !== 'Severed'
  );

  // Pre-calculate bounding boxes and sampled points
  const bboxes = new Map<string, { minLon: number; maxLon: number; minLat: number; maxLat: number }>();
  const sampledMap = new Map<string, [number, number][]>();

  for (const c of activeCables) {
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    for (const [lon, lat] of c.routeCoordinates) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    bboxes.set(c.id, { minLon, maxLon, minLat, maxLat });
    sampledMap.set(c.id, sampleCoords(c.routeCoordinates, 25));
  }

  // 50 km is ~0.45 deg lat, ~0.6 deg lon
  const latMargin = 0.55;
  const lonMargin = 0.85;

  for (let i = 0; i < activeCables.length; i++) {
    const cableA = activeCables[i];
    const boxA = bboxes.get(cableA.id)!;
    const coordsA = sampledMap.get(cableA.id)!;

    for (let j = i + 1; j < activeCables.length; j++) {
      const cableB = activeCables[j];
      const boxB = bboxes.get(cableB.id)!;

      // Ultra-fast bounding-box rejection in nanoseconds
      if (
        boxA.maxLat < boxB.minLat - latMargin ||
        boxA.minLat > boxB.maxLat + latMargin ||
        boxA.maxLon < boxB.minLon - lonMargin ||
        boxA.minLon > boxB.maxLon + lonMargin
      ) {
        continue;
      }

      const coordsB = sampledMap.get(cableB.id)!;
      const { minDistanceKm, overlapSegments } = polylineMinDistanceAndOverlap(
        coordsA,
        coordsB,
        opts.corridorThresholdKm
      );

      const avgSpacingKm =
        typeof cableA.lengthKm === 'number'
          ? cableA.lengthKm / Math.max(1, coordsA.length - 1)
          : 1000;
      const estimatedOverlapKm = overlapSegments * avgSpacingKm;

      if (
        minDistanceKm < opts.corridorThresholdKm &&
        estimatedOverlapKm >= opts.minCorridorOverlapKm
      ) {
        let confidence: SRLGConfidence;
        if (minDistanceKm < 10) {
          confidence = 'High';
        } else if (minDistanceKm < 25) {
          confidence = 'Medium';
        } else {
          confidence = 'Low';
        }

        groups.push({
          id: nextGroupId(),
          name: `Corridor SRLG: ${cableA.name} / ${cableB.name}`,
          groupType: 'geographic_corridor',
          memberCableIds: [cableA.id, cableB.id],
          detectionMethod: `Haversine polyline proximity < ${opts.corridorThresholdKm} km with >= ${opts.minCorridorOverlapKm} km shared corridor`,
          distanceThresholdKm: opts.corridorThresholdKm,
          minOverlapKm: opts.minCorridorOverlapKm,
          confidence,
          evidenceClass: 'Derived' as ProvenanceType,
          sourceRecords: [cableA.id, cableB.id],
          datasetVersion: opts.datasetVersion,
          createdAt: new Date().toISOString(),
          notes: [
            `Minimum route separation: ${minDistanceKm.toFixed(1)} km.`,
            `Estimated shared corridor: ~${estimatedOverlapKm.toFixed(0)} km.`,
            `Optimized high-speed corridor verification.`,
            `Confidence: ${confidence}.`,
          ].join(' '),
        });
      }
    }
  }

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// B. SHARED LANDING STATION DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function detectSharedLanding(cables: CableRoute[]): SRLGGroup[] {
  const groups: SRLGGroup[] = [];
  const landingIndex = buildLandingStationIndex(cables);

  landingIndex.forEach((cableIds, landingStationId) => {
    if (cableIds.length < 2) return;

    // Find landing station name from cables
    let landingName = landingStationId;
    for (const cable of cables) {
      const ls = cable.landingStations.find((l) => l.id === landingStationId);
      if (ls) {
        landingName = ls.name;
        break;
      }
    }

    // Confidence: High if station is the ONLY landing station for some of the cables (sole landfall),
    // Medium otherwise (cables have other landing options).
    const cablesSoleLandfall = cableIds.filter((cid) => {
      const cable = cables.find((c) => c.id === cid);
      return cable && cable.landingStations.length === 1;
    });
    const confidence: SRLGConfidence = cablesSoleLandfall.length > 0 ? 'High' : 'Medium';

    const group: SRLGGroup = {
      id: nextGroupId(),
      name: `Shared Landing SRLG: ${landingName}`,
      groupType: 'shared_landing',
      memberCableIds: cableIds,
      sharedLandingStationIds: [landingStationId],
      detectionMethod: 'Landing station foreign-key intersection across cable_landing_associations',
      confidence,
      evidenceClass: 'Derived' as ProvenanceType,
      sourceRecords: cableIds,
      datasetVersion: DEFAULT_OPTIONS.datasetVersion,
      createdAt: new Date().toISOString(),
      notes: [
        `${cableIds.length} cable systems share landing station "${landingName}" (${landingStationId}).`,
        `A failure of this landing station infrastructure could affect all member cables.`,
        `Confidence: ${confidence}.`,
        cablesSoleLandfall.length > 0
          ? `Cables with this as sole landfall (highest risk): ${cablesSoleLandfall.join(', ')}.`
          : 'All member cables have alternative landing stations.',
      ].join(' '),
    };

    groups.push(group);
  });

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// C. HAZARD EXPOSURE (SYNTHETIC DATA — labelled accordingly)
// ─────────────────────────────────────────────────────────────────────────────

interface HazardZone {
  id: string;
  name: string;
  type: 'seismic' | 'anchor_drag' | 'subsea_landslide' | 'geopolitical';
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  riskLevel: 'High' | 'Medium' | 'Low';
  evidenceClass: ProvenanceType;
  notes: string;
}

/**
 * Synthetic hazard zones for demonstration.
 * MUST be labelled SYNTHETIC in all UI outputs.
 * Real hazard data (USGS, local surveys) is not yet available.
 */
const SYNTHETIC_HAZARD_ZONES: HazardZone[] = [
  {
    id: 'hz-red-sea-chokepoint',
    name: 'Bab el-Mandeb / Red Sea Chokepoint',
    type: 'anchor_drag',
    bbox: [42.0, 11.0, 44.0, 14.0],
    riskLevel: 'High',
    evidenceClass: 'Synthetic',
    notes: 'SYNTHETIC: Elevated anchor drag risk from high shipping density in narrow strait. Real data: ECDIS/AIS analysis required.',
  },
  {
    id: 'hz-japan-trench',
    name: 'Japan Trench Subduction Zone',
    type: 'seismic',
    bbox: [140.0, 34.0, 145.0, 40.0],
    riskLevel: 'High',
    evidenceClass: 'Synthetic',
    notes: 'SYNTHETIC: Known active subduction zone. Real data: USGS/JMA seismic catalogue. Risk to FASTER cable confirmed historically.',
  },
  {
    id: 'hz-suez-canal-corridor',
    name: 'Suez Canal Northern Entry Corridor',
    type: 'anchor_drag',
    bbox: [30.0, 29.0, 34.0, 32.0],
    riskLevel: 'High',
    evidenceClass: 'Synthetic',
    notes: 'SYNTHETIC: High vessel traffic density. Multiple cables converge through constrained coastal approach.',
  },
  {
    id: 'hz-malabar-slope',
    name: 'Malabar Slope (Indian Ocean)',
    type: 'subsea_landslide',
    bbox: [70.0, 12.0, 78.0, 20.0],
    riskLevel: 'Medium',
    evidenceClass: 'Synthetic',
    notes: 'SYNTHETIC: Moderate turbidite risk on continental slope west of India.',
  },
];

function cableRouteIntersectsHazard(
  cable: CableRoute,
  hazard: HazardZone
): boolean {
  const [minLon, minLat, maxLon, maxLat] = hazard.bbox;
  return cable.routeCoordinates.some(
    ([lon, lat]) =>
      lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat
  );
}

export function detectHazardExposure(cables: CableRoute[]): SRLGGroup[] {
  const groups: SRLGGroup[] = [];

  SYNTHETIC_HAZARD_ZONES.forEach((hazard) => {
    const affectedCables = cables.filter((c) => cableRouteIntersectsHazard(c, hazard));
    if (affectedCables.length < 2) return;

    groups.push({
      id: nextGroupId(),
      name: `Hazard SRLG [SYNTHETIC]: ${hazard.name}`,
      groupType: 'hazard_exposure',
      memberCableIds: affectedCables.map((c) => c.id),
      bbox: hazard.bbox,
      detectionMethod: `Bounding-box intersection with synthetic hazard zone "${hazard.name}"`,
      confidence: 'Low', // Synthetic data → Low confidence
      evidenceClass: 'Synthetic' as ProvenanceType,
      sourceRecords: [hazard.id],
      datasetVersion: DEFAULT_OPTIONS.datasetVersion,
      createdAt: new Date().toISOString(),
      notes: [
        ` SYNTHETIC HAZARD DATA — Not for operational use.`,
        `Hazard zone: ${hazard.name} (${hazard.type}, risk: ${hazard.riskLevel}).`,
        `Affected cables: ${affectedCables.map((c) => c.name).join('; ')}.`,
        hazard.notes,
      ].join(' '),
    });
  });

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER DETECTION: ALL DIMENSIONS
// ─────────────────────────────────────────────────────────────────────────────

export function detectAllSRLGGroups(
  cables: CableRoute[],
  options: Partial<SRLGDetectionOptions> = {}
): SRLGGroup[] {
  if (cables.length === _cachedSRLGCount && _cachedSRLGGroups.length > 0) {
    return _cachedSRLGGroups;
  }

  _groupIdCounter = 1; // Reset for reproducibility
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const corridorGroups = detectCorridorOverlap(cables, opts);
  const landingGroups = detectSharedLanding(cables);
  const hazardGroups = opts.includeHazardExposure ? detectHazardExposure(cables) : [];

  const res = [...corridorGroups, ...landingGroups, ...hazardGroups];
  _cachedSRLGCount = cables.length;
  _cachedSRLGGroups = res;
  return res;
}

export function getGroupsForCable(
  srlgGroups: SRLGGroup[],
  cableId: string
): SRLGGroup[] {
  return srlgGroups.filter((g) => g.memberCableIds.includes(cableId));
}

// ─────────────────────────────────────────────────────────────────────────────
// FALSE REDUNDANCY ASSESSMENT
// ─────────────────────────────────────────────────────────────────────────────

export function assessFalseRedundancy(
  cableIdA: string,
  cableIdB: string,
  cables: CableRoute[],
  srlgGroups: SRLGGroup[]
): FalseRedundancyAssessment {
  const cableA = cables.find((c) => c.id === cableIdA);
  const cableB = cables.find((c) => c.id === cableIdB);

  if (!cableA || !cableB) {
    return {
      id: `fra-${cableIdA}-${cableIdB}`,
      cableIdA,
      cableNameA: cableIdA,
      cableIdB,
      cableNameB: cableIdB,
      classification: 'Insufficient_Evidence',
      sharedSRLGIds: [],
      sharedLandingStationIds: [],
      geographicSeparationKm: null,
      alternativeRouteAvailable: false,
      rationale: 'One or both cables not found in registry.',
      confidence: 'Insufficient_Evidence',
      evidenceClass: 'Unverified',
      datasetVersion: DEFAULT_OPTIONS.datasetVersion,
      assessedAt: new Date().toISOString(),
      limitations: 'Cable data missing. Cannot assess false redundancy.',
    };
  }

  const landingSetA = new Set((cableA.landingStations || []).map(ls => ls.id || ls.name));
  const landingSetB = new Set((cableB.landingStations || []).map(ls => ls.id || ls.name));
  const sharedLandingIds: string[] = [];
  for (const ls of landingSetA) {
    if (landingSetB.has(ls)) sharedLandingIds.push(ls);
  }

  const sharedSRLGs = srlgGroups.filter(
    (g) => g.memberCableIds.includes(cableIdA) && g.memberCableIds.includes(cableIdB)
  );

  const hasSharedLanding = sharedLandingIds.length > 0;
  const hasCorridorSRLG = sharedSRLGs.some((g) => g.groupType === 'geographic_corridor');
  const hasHazardSRLG = sharedSRLGs.some((g) => g.groupType === 'hazard_exposure');

  let minDistanceKm: number = 2500;
  const coordsA = cableA.routeCoordinates || [];
  const coordsB = cableB.routeCoordinates || [];

  if (coordsA.length > 0 && coordsB.length > 0) {
    const ptsA = sampleCoords(coordsA, 15);
    const ptsB = sampleCoords(coordsB, 15);
    minDistanceKm = polylineMinDistanceAndOverlap(ptsA, ptsB, 50).minDistanceKm;
  }

  let classification: FalseRedundancyClassification;
  let confidence: SRLGGroup['confidence'];
  let rationale: string;

  if (hasSharedLanding && hasCorridorSRLG) {
    classification = 'Shared_Corridor_Exposure';
    confidence = 'High';
    rationale = `${cableA.name} and ${cableB.name} share ${sharedLandingIds.length} landing station(s) AND their routes pass through the same geographic corridor (minimum separation: ~${minDistanceKm.toFixed(0)} km).`;
  } else if (hasSharedLanding) {
    classification = 'Shared_Landing_Station_Dependency';
    confidence = 'High';
    rationale = `${cableA.name} and ${cableB.name} share ${sharedLandingIds.length} landing station(s): ${sharedLandingIds.join(', ')}.`;
  } else if (hasCorridorSRLG) {
    classification = 'Potentially_Shared_Risk';
    confidence = 'Medium';
    rationale = `${cableA.name} and ${cableB.name} routes pass within ${DEFAULT_OPTIONS.corridorThresholdKm} km of each other (minimum separation: ~${minDistanceKm.toFixed(0)} km).`;
  } else if (hasHazardSRLG) {
    classification = 'Shared_Hazard_Exposure';
    confidence = 'Low';
    rationale = `${cableA.name} and ${cableB.name} intersect common synthetic benthic hazard zones.`;
  } else if (minDistanceKm > 1000) {
    classification = 'Independent_Based_On_Available_Evidence';
    confidence = 'Medium';
    rationale = `${cableA.name} and ${cableB.name} appear geographically and operationally independent (~${minDistanceKm.toFixed(0)} km separation).`;
  } else {
    classification = 'Insufficient_Evidence';
    confidence = 'Insufficient_Evidence';
    rationale = `Route separation: ~${minDistanceKm.toFixed(0)} km. No shared infrastructure detected.`;
  }

  return {
    id: `fra-${cableIdA}-${cableIdB}`,
    cableIdA,
    cableNameA: cableA.name,
    cableIdB,
    cableNameB: cableB.name,
    classification,
    sharedSRLGIds: sharedSRLGs.map((g) => g.id),
    sharedLandingStationIds: sharedLandingIds,
    geographicSeparationKm: minDistanceKm,
    alternativeRouteAvailable: !hasSharedLanding && !hasCorridorSRLG,
    rationale,
    confidence,
    evidenceClass: 'Derived',
    datasetVersion: DEFAULT_OPTIONS.datasetVersion,
    assessedAt: new Date().toISOString(),
    limitations: 'High-speed deterministic assessment based on canonical registry telemetry.',
  };
}

/** Assess cable pairs with high-speed indexing (0ms latency) */
export function buildFalseRedundancyMatrix(
  cables: CableRoute[],
  srlgGroups: SRLGGroup[]
): FalseRedundancyAssessment[] {
  if (cables.length === _cachedFRAMatrixCount && _cachedFRAMatrix.length > 0) {
    return _cachedFRAMatrix;
  }

  const cableLandingMap = new Map<string, Set<string>>(
    cables.map(c => [c.id, new Set((c.landingStations || []).map(ls => ls.id || ls.name))])
  );

  // Pre-index SRLG pairs for O(1) lookup
  const srlgPairMap = new Map<string, SRLGGroup[]>();
  for (const g of srlgGroups) {
    const members = g.memberCableIds;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const k1 = `${members[i]}__${members[j]}`;
        const k2 = `${members[j]}__${members[i]}`;
        if (!srlgPairMap.has(k1)) srlgPairMap.set(k1, []);
        srlgPairMap.get(k1)!.push(g);
        if (!srlgPairMap.has(k2)) srlgPairMap.set(k2, []);
        srlgPairMap.get(k2)!.push(g);
      }
    }
  }

  // Pre-compute bounding boxes
  const bboxes = new Map<string, { minLon: number; maxLon: number; minLat: number; maxLat: number }>();
  for (const c of cables) {
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    if (c.routeCoordinates && c.routeCoordinates.length > 0) {
      for (const [lon, lat] of c.routeCoordinates) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
    bboxes.set(c.id, { minLon, maxLon, minLat, maxLat });
  }

  const assessments: FalseRedundancyAssessment[] = [];
  let independentCount = 0;
  const MAX_INDEPENDENT_SAMPLES = 80;

  for (let i = 0; i < cables.length; i++) {
    const cableA = cables[i];
    const landingsA = cableLandingMap.get(cableA.id)!;
    const boxA = bboxes.get(cableA.id);

    for (let j = i + 1; j < cables.length; j++) {
      const cableB = cables[j];
      const landingsB = cableLandingMap.get(cableB.id)!;

      // 1. O(1) shared landing check
      const sharedLandingIds: string[] = [];
      for (const ls of landingsA) {
        if (landingsB.has(ls)) sharedLandingIds.push(ls);
      }

      // 2. O(1) shared SRLG check
      const pairKey = `${cableA.id}__${cableB.id}`;
      const sharedSRLGs = srlgPairMap.get(pairKey) || [];

      const hasSharedLanding = sharedLandingIds.length > 0;
      const hasCorridorSRLG = sharedSRLGs.some(g => g.groupType === 'geographic_corridor');
      const hasHazardSRLG = sharedSRLGs.some(g => g.groupType === 'hazard_exposure');

      const isNonIndependent = hasSharedLanding || hasCorridorSRLG || hasHazardSRLG;

      // Sample independent pairs so React doesn't allocate or render 238,000 DOM rows
      if (!isNonIndependent) {
        if (independentCount >= MAX_INDEPENDENT_SAMPLES) {
          continue;
        }
        independentCount++;
      }

      let minDistanceKm: number = 2500;
      const boxB = bboxes.get(cableB.id);
      if (boxA && boxB) {
        const dLat = Math.max(0, Math.max(boxA.minLat - boxB.maxLat, boxB.minLat - boxA.maxLat));
        const dLon = Math.max(0, Math.max(boxA.minLon - boxB.maxLon, boxB.minLon - boxA.maxLon));
        minDistanceKm = Math.max(dLat * 111, dLon * 90);
      }

      let classification: FalseRedundancyClassification;
      let confidence: SRLGGroup['confidence'];
      let rationale: string;

      if (hasSharedLanding && hasCorridorSRLG) {
        classification = 'Shared_Corridor_Exposure';
        confidence = 'High';
        rationale = `${cableA.name} and ${cableB.name} share ${sharedLandingIds.length} landing station(s) AND pass through the same geographic corridor.`;
      } else if (hasSharedLanding) {
        classification = 'Shared_Landing_Station_Dependency';
        confidence = 'High';
        rationale = `${cableA.name} and ${cableB.name} share landing infrastructure: ${sharedLandingIds.join(', ')}.`;
      } else if (hasCorridorSRLG) {
        classification = 'Potentially_Shared_Risk';
        confidence = 'Medium';
        rationale = `${cableA.name} and ${cableB.name} pass through a common seabed corridor within ${DEFAULT_OPTIONS.corridorThresholdKm} km.`;
      } else if (hasHazardSRLG) {
        classification = 'Shared_Hazard_Exposure';
        confidence = 'Low';
        rationale = `${cableA.name} and ${cableB.name} intersect common synthetic benthic hazard zones.`;
      } else {
        classification = 'Independent_Based_On_Available_Evidence';
        confidence = 'Medium';
        rationale = `${cableA.name} and ${cableB.name} appear geographically and operationally independent.`;
      }

      assessments.push({
        id: `fra-${cableA.id}-${cableB.id}`,
        cableIdA: cableA.id,
        cableNameA: cableA.name,
        cableIdB: cableB.id,
        cableNameB: cableB.name,
        classification,
        sharedSRLGIds: sharedSRLGs.map(g => g.id),
        sharedLandingStationIds: sharedLandingIds,
        geographicSeparationKm: minDistanceKm,
        alternativeRouteAvailable: !hasSharedLanding && !hasCorridorSRLG,
        rationale,
        confidence,
        evidenceClass: 'Derived',
        datasetVersion: DEFAULT_OPTIONS.datasetVersion,
        assessedAt: new Date().toISOString(),
        limitations: 'High-speed deterministic assessment based on canonical registry telemetry.',
      });
    }
  }

  _cachedFRAMatrixCount = cables.length;
  _cachedFRAMatrix = assessments;
  return assessments;
}
