import { seek, engineeringHours } from "./clock";
import { timeline } from "./machine";
import { allocateTraffic } from "./route-planner";
import { planRepair } from "./repair-planner";
import type { Scenario } from "./schema";
export * from "./route-planner";
export * from "./repair-planner";
export const applyFailure = (s: Scenario) =>
  s.edges.find((e) => e.id === s.broken)!;
export function snapshot(s: Scenario, seconds: number) {
  const t = seek(seconds),
    repair = planRepair(s),
    events = timeline(s).filter((e) => e.seconds <= t);
  const has = (phase: string) => events.some((e) => e.phase === phase);
  const incident = t >= 9,
    physicalFault = incident && !has("Physical link restored");
  const cutback = has("Approved cutback");
  return {
    presentationSeconds: t,
    engineeringHours: engineeringHours(
      t,
      repair.transitHours,
      s.repair.workHours,
    ),
    phase: events[events.length - 1].phase,
    events,
    repair,
    physicalFault,
    cutback,
    network: allocateTraffic(
      s,
      incident && !cutback ? applyFailure(s) : undefined,
      !incident || has("Alternate service active") || cutback,
    ),
  };
}
export type SimulationSnapshot = ReturnType<typeof snapshot>;
export type SimulationEvent = SimulationSnapshot["events"][number];
export function buildDecisionRecord(s: Scenario, t: number) {
  return {
    engineVersion: "theatre-2.0",
    scenarioId: s.id,
    seed: s.seed,
    inputs: s,
    evidence: {
      topology: "SYNTHETIC",
      capacity: "ASSUMED",
      propagationDelay: "ASSUMED one-way",
      repair: "ASSUMED",
      allocations: "Calculated from synthetic inputs",
    },
    before: snapshot(s, 0),
    disrupted: snapshot(s, 28),
    current: snapshot(s, t),
    residualRisk:
      "Background loads, sea conditions and propagation delays are fixed assumptions. Shared-risk groups are illustrative.",
  };
}
