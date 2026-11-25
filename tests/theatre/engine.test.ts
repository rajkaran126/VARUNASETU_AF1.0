import { test } from "node:test";
import assert from "node:assert/strict";
import { scenario } from "../../lib/theatre/scenario";
import { schema } from "../../lib/theatre/schema";
import { snapshot } from "../../lib/theatre/engine";

test("reroute preserves demand, latency and shared capacities", () => {
  const s = snapshot(scenario, 28),
    d = s.network.services[0];
  assert.deepEqual(
    d.routes.map((r) => r.allocated),
    [0, 3, 2],
  );
  assert.deepEqual([d.served, d.unserved, d.latency], [5, 1, 69.4]);
  assert.deepEqual(s.network.flow, { AD: 0, AX: 3, XD: 3, AY: 2, YD: 2 });
  assert.ok(s.physicalFault);
});
for (const mode of [
  "shared",
  "unknown",
  "exhausted",
  "disconnected",
  "policy",
  "background",
  "priority",
] as const) {
  test(mode, () => {
    const s = structuredClone(scenario),
      e = s.edges[1];
    if (mode === "shared") s.edges[3].srlg = s.edges[0].srlg;
    if (mode === "unknown") e.capacityTbps = null;
    if (mode === "exhausted") e.existingTbps = 3;
    if (mode === "background") e.existingTbps = 1;
    if (mode === "policy") e.allowed = false;
    if (mode === "disconnected") {
      e.from = "X";
      e.to = "A";
      e.bidirectional = false;
    }
    if (mode === "priority")
      s.demands.push({
        ...s.demands[0],
        id: "urgent",
        priority: 0,
        offered: 2,
      });
    const { services } = snapshot(s, 28).network;
    const d = services.find((d) => d.id === "OD-1")!;
    assert.equal(
      d.served,
      mode === "background" ? 4 : ["shared", "priority"].includes(mode) ? 3 : 2,
    );
    assert.equal(d.served + d.unserved, 6);
    if (mode === "unknown")
      assert.equal(d.routes[1].status, "unknown capacity");
  });
}
for (const gate of [
  "weather",
  "depth",
  "permit",
  "optical",
  "survey",
  "approval",
]) {
  test(gate + " blocks cutback", () => {
    const s = structuredClone(scenario),
      r = s.repair;
    if (gate === "weather") r.wavesM = 8;
    if (gate === "depth") r.rovRatingM = 50;
    if (gate === "permit") r.permit = false;
    if (gate === "optical") r.opticalPass = false;
    if (gate === "survey") r.surveyPass = false;
    if (gate === "approval") r.cutbackApproval = false;
    const end = snapshot(s, 115);
    assert.equal(end.cutback, false);
    assert.equal(end.network.services[0].unserved, 1);
  });
}
test("seek, replay and coordinate validation", () => {
  const record = snapshot(scenario, 28);
  assert.equal(snapshot(scenario, 115).network.services[0].served, 6);
  assert.deepEqual(record, snapshot(scenario, 28));
  const s = structuredClone(scenario);
  s.nodes[0].point[1] = 91;
  assert.equal(schema.safeParse(s).success, false);
});
test("unaffected service continues while diversion awaits permission", () => {
  const s = structuredClone(scenario);
  s.demands.push({ id: "local", from: "X", to: "D", offered: 1, priority: 0 });
  const incident = snapshot(s, 12).network;
  assert.equal(incident.services[0].served, 1);
  assert.equal(incident.services[1].served, 0);
  assert.equal(snapshot(s, 28).network.flow.XD, 3);
});
test("short work window and withheld traffic permission", () => {
  const s = structuredClone(scenario);
  s.repair.weatherWindowHours = 4;
  s.repair.rerouteApproval = false;
  assert.equal(snapshot(s, 115).cutback, false);
  assert.equal(snapshot(s, 28).network.services[0].served, 0);
});
