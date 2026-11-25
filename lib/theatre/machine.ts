import { applyRestoration, planRepair } from "./repair-planner";
import type { Scenario } from "./schema";
export function timeline(s: Scenario) {
  const events: { seconds: number; phase: string }[] = [];
  const add = (seconds: number, phase: string) =>
    events.push({ seconds, phase });
  add(0, "Network baseline");
  add(9, "Physical fault");
  add(18, "Reroute proposal");
  add(20, s.repair.rerouteApproval ? "Permission granted" : "Reroute held");
  if (s.repair.rerouteApproval) add(22, "Alternate service active");
  const { hold } = planRepair(s);
  add(29, hold ?? "Vessel mobilization");
  if (hold) return events;
  add(39, "On station");
  add(49, "Tethered descent");
  add(62, "Fault inspection");
  add(73, "Cable recovery");
  add(79, "Deck joint construction");
  add(86, "Optical test");
  if (!s.repair.opticalPass) {
    add(89, "Optical test failed");
    return events;
  }
  add(89, "Cable re-lay");
  add(96, "Post-lay survey");
  if (!applyRestoration(s)) {
    add(99, "Survey hold");
    return events;
  }
  add(99, "Physical link restored");
  add(
    101,
    s.repair.cutbackApproval ? "Approved cutback" : "Cutback awaiting approval",
  );
  if (s.repair.cutbackApproval) add(103, "Decision record");
  return events;
}
