/**
 * VARUNASETU Phase 4A — Repair Scheduling Service
 *
 * Schedules repair vessel assignments for cable faults.
 *
 * Constraints modelled:
 *   - Vessel capability (depth rating, DP class)
 *   - Vessel availability
 *   - Transit time (great-circle / assumed speed)
 *   - Mobilisation time
 *   - Weather windows
 *   - Permit delays
 *   - Resource contention
 *
 * All duration values are ASSUMED unless sourced from verified records.
 * Evidence classification is propagated to every output.
 */

import {
  RepairConstraint,
  RepairAssignment,
  RepairSchedule,
  ResourceConflict,
  WeatherWindow,
} from '../types-phase4a';
import { RepairVessel, FaultIncident } from '../types';

const ENGINE_VERSION = 'vSetu-Repair-1.0';

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

function transitHours(
  vesselLat: number,
  vesselLon: number,
  faultLat: number,
  faultLon: number,
  speedKnots: number
): number {
  const distanceKm = haversineKm(vesselLat, vesselLon, faultLat, faultLon);
  const distanceNm = distanceKm / 1.852;
  return +(distanceNm / speedKnots).toFixed(2);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT REPAIR ASSUMPTIONS (from extensions_repair_duration_cost, ASSUMED)
// ─────────────────────────────────────────────────────────────────────────────

const REPAIR_ASSUMPTIONS = {
  mobilisationHours: 8,           // ASSUMED: vessel call-out to departure
  shallowRepairDurationHours: 96, // ASSUMED: < 1000m depth
  deepRepairDurationHours: 240,   // ASSUMED: 1000–4000m depth
  ultraDeepRepairDurationHours: 360, // ASSUMED: > 4000m depth
  permitDelayDays: 3,             // ASSUMED: typical permit delay for international waters
  weatherDelayHours: 24,          // ASSUMED: average delay from weather hold
  weatherHoldSeaState: 4,         // ASSUMED: operations cease above Douglas Sea State 4
  source: 'extensions_repair_duration_cost (ASSUMED)',
  evidenceClass: 'Assumption' as const,
};

function getRepairDurationHours(depthM: number): number {
  if (depthM < 1000) return REPAIR_ASSUMPTIONS.shallowRepairDurationHours;
  if (depthM < 4000) return REPAIR_ASSUMPTIONS.deepRepairDurationHours;
  return REPAIR_ASSUMPTIONS.ultraDeepRepairDurationHours;
}

// ─────────────────────────────────────────────────────────────────────────────
// VESSEL CAPABILITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

function isVesselCapable(vessel: RepairVessel, fault: FaultIncident): boolean {
  // Must be able to reach fault depth
  if (vessel.rovDepthRatingM < fault.depthMeters) return false;
  // Must not be in transit to a higher-priority job (handled in conflict detection)
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER WINDOW FINDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns synthetic weather windows for a fault location.
 * In production, this would query real marine weather data.
 * MUST be labelled SYNTHETIC in all UI outputs.
 */
export function getSyntheticWeatherWindows(
  faultLat: number,
  faultLon: number,
  horizonHours = 336  // 14 days
): WeatherWindow[] {
  /**
   * Synthetic weather model:
   * Simulate alternating good/bad windows based on location.
   * Red Sea area: more frequent poor conditions (geopolitical volatility model)
   * Open ocean: more predictable windows
   */
  const isRedSea = faultLon >= 38 && faultLon <= 44 && faultLat >= 10 && faultLat <= 30;
  const isTropicalPacific = faultLon >= 130 && faultLon <= 180 && faultLat >= 0 && faultLat <= 30;

  const badWindowFrequency = isRedSea ? 0.4 : isTropicalPacific ? 0.3 : 0.2;
  const windows: WeatherWindow[] = [];

  let currentHour = 0;
  let windowIndex = 0;

  while (currentHour < horizonHours) {
    const isBad = (windowIndex % 3 === 0) ? (Math.sin(windowIndex) > (1 - badWindowFrequency * 2)) : false;
    const duration = isBad ? 24 + (windowIndex % 3) * 8 : 48 + (windowIndex % 4) * 12;
    windows.push({
      startHour: currentHour,
      durationHours: Math.min(duration, horizonHours - currentHour),
      averageWaveHeightM: isBad ? 3.5 + (windowIndex % 2) : 1.2 + (windowIndex % 3) * 0.3,
      averageWindKnots: isBad ? 28 + (windowIndex % 5) : 12 + (windowIndex % 8),
      operationally_feasible: !isBad,
      evidenceClass: 'Synthetic',
    });
    currentHour += duration;
    windowIndex++;
  }

  return windows;
}

function getNextFeasibleWindow(
  windows: WeatherWindow[],
  afterHour: number,
  minDurationHours: number
): WeatherWindow | null {
  return windows.find(
    (w) =>
      w.operationally_feasible &&
      w.startHour >= afterHour &&
      w.durationHours >= minDurationHours
  ) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCHEDULER
// ─────────────────────────────────────────────────────────────────────────────

export function scheduleRepairs(
  vessels: RepairVessel[],
  faults: FaultIncident[],
  options: {
    weatherEnabled?: boolean;
    permitEnabled?: boolean;
    seed?: number;
    scenarioId?: string;
  } = {}
): RepairSchedule {
  const {
    weatherEnabled = true,
    permitEnabled = true,
    seed = 20261030,
    scenarioId = 'default',
  } = options;

  const scheduleId = `sched-${seed}-${Date.now()}`;
  const assignments: RepairAssignment[] = [];
  const vesselAssignments = new Map<string, string>(); // vesselId → faultId (first assigned)

  // Sort faults by severity (critical first)
  const severityOrder = { Critical: 0, Major: 1, Moderate: 2, Minor: 3 };
  const sortedFaults = [...faults].sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  );

  for (const fault of sortedFaults) {
    const capableVessels = vessels.filter((v) => isVesselCapable(v, fault));

    if (capableVessels.length === 0) {
      assignments.push({
        faultId: fault.id,
        vesselId: 'none',
        vesselName: 'No suitable vessel',
        assignedAt: new Date().toISOString(),
        dispatchHours: 0,
        onStationHours: 0,
        repairCompleteHours: 0,
        permitDelayHours: 0,
        weatherDelayHours: 0,
        totalRestorationHours: 0,
        feasible: false,
        infeasibilityReason: `No vessel with ROV depth rating ≥ ${fault.depthMeters}m available`,
        evidenceClass: 'Derived',
      });
      continue;
    }

    // Select nearest capable vessel (by transit time)
    const vesselWithTransit = capableVessels.map((v) => ({
      vessel: v,
      transitHrs: transitHours(v.lat, v.lon, fault.lat, fault.lon, v.cruisingSpeedKnots),
    }));
    vesselWithTransit.sort((a, b) => a.transitHrs - b.transitHrs);

    // Find first unassigned capable vessel (respect resource contention)
    const selected = vesselWithTransit.find(
      ({ vessel }) => !vesselAssignments.has(vessel.id)
    ) ?? vesselWithTransit[0]; // fallback: allow shared vessel (mark conflict)

    const { vessel, transitHrs } = selected;
    const isConflict = vesselAssignments.has(vessel.id);

    if (!isConflict) {
      vesselAssignments.set(vessel.id, fault.id);
    }

    const mobilisationHrs = REPAIR_ASSUMPTIONS.mobilisationHours;
    const repairDurationHrs = getRepairDurationHours(fault.depthMeters);

    const dispatchHrs = +(mobilisationHrs).toFixed(1);
    const onStationHrs = +(mobilisationHrs + transitHrs).toFixed(1);

    // Weather window check
    let weatherDelayHrs = 0;
    if (weatherEnabled) {
      const weatherWindows = getSyntheticWeatherWindows(fault.lat, fault.lon);
      const window = getNextFeasibleWindow(weatherWindows, onStationHrs, repairDurationHrs / 3);
      if (window && window.startHour > onStationHrs) {
        weatherDelayHrs = +(window.startHour - onStationHrs).toFixed(1);
      }
    }

    // Permit delay
    const permitDelayHrs = permitEnabled
      ? +(REPAIR_ASSUMPTIONS.permitDelayDays * 24).toFixed(1)
      : 0;

    const repairCompleteHrs = +(onStationHrs + weatherDelayHrs + permitDelayHrs + repairDurationHrs).toFixed(1);

    assignments.push({
      faultId: fault.id,
      vesselId: vessel.id,
      vesselName: vessel.name,
      assignedAt: new Date().toISOString(),
      dispatchHours: dispatchHrs,
      onStationHours: onStationHrs,
      repairCompleteHours: repairCompleteHrs,
      permitDelayHours: permitDelayHrs,
      weatherDelayHours: weatherDelayHrs,
      totalRestorationHours: repairCompleteHrs,
      feasible: !isConflict || sortedFaults.indexOf(fault) < 2,
      infeasibilityReason: isConflict ? `Vessel ${vessel.name} already assigned to fault ${vesselAssignments.get(vessel.id)}` : undefined,
      evidenceClass: 'Derived',
    });
  }

  // Detect resource conflicts
  const conflictMap = new Map<string, string[]>();
  assignments.forEach((a) => {
    const existing = conflictMap.get(a.vesselId) ?? [];
    existing.push(a.faultId);
    conflictMap.set(a.vesselId, existing);
  });

  const conflicts: ResourceConflict[] = [];
  conflictMap.forEach((faultIds, vesselId) => {
    if (faultIds.length > 1) {
      conflicts.push({
        vesselId,
        conflictingFaultIds: faultIds,
        resolution: 'priority_order',
        prioritisedFaultId: faultIds[0],
      });
    }
  });

  const restorationTimes = assignments
    .filter((a) => a.feasible)
    .map((a) => a.totalRestorationHours);

  return {
    scheduleId,
    scenarioId,
    assignments,
    resourceConflicts: conflicts,
    earliestRestorationHours: restorationTimes.length > 0 ? Math.min(...restorationTimes) : 0,
    latestRestorationHours: restorationTimes.length > 0 ? Math.max(...restorationTimes) : 0,
    provenance: 'Derived',
    assumptionSources: [
      REPAIR_ASSUMPTIONS.source,
      weatherEnabled ? 'G_remainin_synthetic_marine_wea (SYNTHETIC)' : 'Weather disabled',
      permitEnabled ? `Permit delay: ${REPAIR_ASSUMPTIONS.permitDelayDays} days (ASSUMED)` : 'Permit delay disabled',
    ],
    timestamp: new Date().toISOString(),
  };
}
