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
function polylineMinDistanceAndOverlap(
  coordsA: [number, number][],
  coordsB: [number, number][],
  thresholdKm: number
): { minDistanceKm: number; overlapSegments: number } {
  let minDist = Infinity;
  let overlapSegments = 0;

  for (const [lonA, latA] of coordsA) {
    let nearestToBSegDist = Infinity;
    for (const [lonB, latB] of coordsB) {
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

  /**
   * Threshold: 50 km — ASSUMPTION
   * Rationale: Cables within 50 km of each other in deep water may share
   * seabed corridor exposure to anchor drag, seismic events, or trawling.
   * This does NOT confirm shared conduit or protection infrastructure.
   * Source: engineering judgment — not verified against as-built cable routes.
   */

  const activeCables = cables.filter(
    (c) =>
      c.routeCoordinates &&
      c.routeCoordinates.length >= 2 &&
      c.status !== 'Severed'
  );

  for (let i = 0; i < activeCables.length; i++) {
    for (let j = i + 1; j < activeCables.length; j++) {
      const cableA = activeCables[i];
      const cableB = activeCables[j];

      const { minDistanceKm, overlapSegments } = polylineMinDistanceAndOverlap(
        cableA.routeCoordinates,
        cableB.routeCoordinates,
        opts.corridorThresholdKm
      );

      // Approximate overlap length: segments × average inter-point spacing
      const avgSpacingKm =
        typeof cableA.lengthKm === 'number'
          ? cableA.lengthKm / Math.max(1, cableA.routeCoordinates.length - 1)
          : 1000;
      const estimatedOverlapKm = overlapSegments * avgSpacingKm;

      if (
        minDistanceKm < opts.corridorThresholdKm &&
        estimatedOverlapKm >= opts.minCorridorOverlapKm
      ) {
        // Determine confidence based on evidence quality
        let confidence: SRLGConfidence;
        if (minDistanceKm < 10) {
          confidence = 'High';
        } else if (minDistanceKm < 25) {
          confidence = 'Medium';
        } else {
          // Close but geometric data is approximate — could be route generalisation artefact
          confidence = 'Low';
        }

        const group: SRLGGroup = {
          id: nextGroupId(),
          name: `Corridor SRLG: ${cableA.name} / ${cableB.name}`,
          groupType: 'geographic_corridor',
          memberCableIds: [cableA.id, cableB.id],
          detectionMethod: `Haversine polyline proximity < ${opts.corridorThresholdKm} km with ≥ ${opts.minCorridorOverlapKm} km shared corridor`,
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
            `CAUTION: Route coordinates are approximate centreline representations.`,
            `Proximity does NOT confirm shared physical conduit or protection infrastructure.`,
            `Confidence: ${confidence}. Independent field verification required for operational decisions.`,
          ].join(' '),
        };

        groups.push(group);
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
  _groupIdCounter = 1; // Reset for reproducibility
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const corridorGroups = detectCorridorOverlap(cables, opts);
  const landingGroups = detectSharedLanding(cables);
  const hazardGroups = opts.includeHazardExposure ? detectHazardExposure(cables) : [];

  return [...corridorGroups, ...landingGroups, ...hazardGroups];
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

  const graph = getNetworkGraph();
  const sharedLandingIds = getSharedLandingStations(graph, cableIdA, cableIdB);
  const sharedSRLGs = srlgGroups.filter(
    (g) => g.memberCableIds.includes(cableIdA) && g.memberCableIds.includes(cableIdB)
  );

  // Compute minimum geographic separation between the two route polylines
  const { minDistanceKm } = polylineMinDistanceAndOverlap(
    cableA.routeCoordinates,
    cableB.routeCoordinates,
    Infinity // compute actual min regardless of threshold
  );

  // Classify
  let classification: FalseRedundancyClassification;
  let confidence: SRLGGroup['confidence'];
  let rationale: string;

  const hasSharedLanding = sharedLandingIds.length > 0;
  const hasCorridorSRLG = sharedSRLGs.some((g) => g.groupType === 'geographic_corridor');
  const hasHazardSRLG = sharedSRLGs.some((g) => g.groupType === 'hazard_exposure');

  if (hasSharedLanding && hasCorridorSRLG) {
    classification = 'Shared_Corridor_Exposure';
    confidence = 'High';
    rationale = [
      `${cableA.name} and ${cableB.name} share ${sharedLandingIds.length} landing station(s)`,
      `AND their routes pass through the same geographic corridor`,
      `(minimum separation: ${minDistanceKm.toFixed(0)} km).`,
      `These cables are NOT independent: a single corridor event (anchor drag, seismic,`,
      `subsea landslide) could affect both simultaneously.`,
    ].join(' ');
  } else if (hasSharedLanding) {
    classification = 'Shared_Landing_Station_Dependency';
    confidence = 'High';
    rationale = [
      `${cableA.name} and ${cableB.name} share ${sharedLandingIds.length} landing station(s): ${sharedLandingIds.join(', ')}.`,
      `A failure of the shared landing station infrastructure could disrupt both cables.`,
      `Geographic route separation appears sufficient (${minDistanceKm.toFixed(0)} km) but`,
      `common landing infrastructure represents a dependency that undermines independence.`,
    ].join(' ');
  } else if (hasCorridorSRLG) {
    classification = 'Potentially_Shared_Risk';
    confidence = 'Medium';
    rationale = [
      `${cableA.name} and ${cableB.name} routes pass within ${DEFAULT_OPTIONS.corridorThresholdKm} km of each other.`,
      `Minimum separation: ${minDistanceKm.toFixed(0)} km.`,
      `Note: Route coordinates are approximate centreline representations.`,
      `Proximity does NOT confirm shared physical infrastructure.`,
      `Independent field verification required before classifying as fully independent.`,
    ].join(' ');
  } else if (hasHazardSRLG) {
    classification = 'Shared_Hazard_Exposure';
    confidence = 'Low';
    rationale = [
      ` Based on SYNTHETIC hazard data only.`,
      `${cableA.name} and ${cableB.name} may share exposure to hazard zones`,
      `but this is based on synthetic data, not real hazard assessment.`,
      `Cannot confirm shared physical risk without real seismic/maritime data.`,
    ].join(' ');
  } else if (minDistanceKm > 1000) {
    classification = 'Independent_Based_On_Available_Evidence';
    confidence = 'Medium';
    rationale = [
      `${cableA.name} and ${cableB.name} appear geographically independent`,
      `(minimum route separation: ${minDistanceKm.toFixed(0)} km, no shared SRLGs detected).`,
      `Note: Route coordinates are approximate. Confidence is Medium, not High,`,
      `because as-built cable positions have not been independently verified.`,
    ].join(' ');
  } else {
    classification = 'Insufficient_Evidence';
    confidence = 'Insufficient_Evidence';
    rationale = [
      `Insufficient evidence to classify the relationship between`,
      `${cableA.name} and ${cableB.name}.`,
      `Route separation: ${minDistanceKm.toFixed(0)} km. No confirmed shared infrastructure.`,
      `Real as-built cable geometry and detailed hazard data required for confident assessment.`,
    ].join(' ');
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
    limitations: [
      'Route coordinates are approximate centreline representations, not as-built paths.',
      'Hazard data is synthetic only.',
      'Shared landing data is derived from the existing cable registry, not direct field verification.',
      'Real-world resilience assessment requires licensed bathymetry, AIS data, and operator records.',
    ].join(' '),
  };
}

/** Assess all cable pairs (O(n²)) and return complete matrix */
export function buildFalseRedundancyMatrix(
  cables: CableRoute[],
  srlgGroups: SRLGGroup[]
): FalseRedundancyAssessment[] {
  const assessments: FalseRedundancyAssessment[] = [];
  for (let i = 0; i < cables.length; i++) {
    for (let j = i + 1; j < cables.length; j++) {
      assessments.push(
        assessFalseRedundancy(cables[i].id, cables[j].id, cables, srlgGroups)
      );
    }
  }
  return assessments;
}
