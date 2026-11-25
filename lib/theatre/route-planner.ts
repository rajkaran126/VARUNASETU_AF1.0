import type { Scenario, Edge } from "./schema";

export const calculateLatency = (edges: Edge[]) =>
  edges.reduce((sum, e) => sum + e.delayMs, 0);
export const assessSrlg = (edges: Edge[], failed?: Edge) =>
  !edges.some((e) => e.srlg === failed?.srlg);

// Enumerate simple paths on the bounded teaching graph, then rank by delay and stable ID.
export function enumeratePaths(s: Scenario, from: string, to: string) {
  const paths: Edge[][] = [];
  function visit(node: string, seen: string[], path: Edge[]) {
    if (node === to) {
      paths.push(path);
      return;
    }
    for (const e of s.edges) {
      const next =
        e.from === node
          ? e.to
          : e.bidirectional && e.to === node
            ? e.from
            : undefined;
      if (next && !seen.includes(next))
        visit(next, [...seen, next], [...path, e]);
    }
  }
  visit(from, [from], []);
  return paths.sort(
    (a, b) =>
      calculateLatency(a) - calculateLatency(b) ||
      a
        .map((e) => e.id)
        .join("/")
        .localeCompare(b.map((e) => e.id).join("/")),
  );
}

// Reserve unaffected baseline traffic before granting any diversion.
export function allocateTraffic(
  s: Scenario,
  failed: Edge | undefined,
  activate = true,
) {
  const retained = new Map<string, Map<string, number>>();
  if (failed) {
    const risks = new Set(
      s.edges.filter((e) => e.srlg === failed.srlg).map((e) => e.id),
    );
    for (const d of allocate(s, undefined, true, new Map()).services) {
      retained.set(
        d.id,
        new Map(
          d.routes
            .filter(
              (r) => r.allocated > 0 && !r.edges.some((id) => risks.has(id)),
            )
            .map((r) => [r.id, r.allocated]),
        ),
      );
    }
  }
  return allocate(s, failed, activate, retained);
}
function allocate(
  s: Scenario,
  failed: Edge | undefined,
  activate: boolean,
  retained: Map<string, Map<string, number>>,
) {
  const flow: Record<string, number> = Object.fromEntries(
    s.edges.map((e) => [e.id, 0]),
  );
  for (const routes of retained.values())
    for (const [id, load] of routes)
      for (const edge of id.split("/")) flow[edge] += load;
  const services = [...s.demands]
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .map((d) => {
      const reservations = retained.get(d.id) ?? new Map<string, number>();
      let remaining =
        d.offered - [...reservations.values()].reduce((sum, n) => sum + n, 0);
      const routes = enumeratePaths(s, d.from, d.to).map((path) => {
        const status = path.some((e) => e.id === failed?.id)
          ? "broken"
          : path.some((e) => !e.allowed)
            ? "policy"
            : !assessSrlg(path, failed)
              ? "shared risk"
              : path.some((e) => e.capacityTbps === null)
                ? "unknown capacity"
                : "eligible";
        const residual = path.map((e) =>
          e.capacityTbps === null
            ? null
            : e.capacityTbps - e.existingTbps - flow[e.id],
        );
        const bottleneck = residual.includes(null)
          ? null
          : Math.min(...(residual as number[]));
        const additional =
          status === "eligible" && activate
            ? Math.min(remaining, bottleneck ?? 0)
            : 0;
        remaining -= additional;
        path.forEach((e) => {
          flow[e.id] += additional;
        });
        const id = path.map((e) => e.id).join("/");
        const reserved = reservations.get(id) ?? 0;
        return {
          id,
          edges: path.map((e) => e.id),
          status,
          bottleneck: bottleneck === null ? null : bottleneck + reserved,
          allocated: additional + reserved,
          latency: calculateLatency(path),
          uncertaintyMs: path.reduce(
            (total, e) => total + e.delayUncertaintyMs,
            0,
          ),
        };
      });
      const served = d.offered - remaining;
      return {
        ...d,
        routes,
        served,
        unserved: remaining,
        latency: served
          ? routes.reduce((sum, r) => sum + r.latency * r.allocated, 0) / served
          : null,
      };
    });
  return { flow, services };
}
