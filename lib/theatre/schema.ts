import { z } from "zod";

const id = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9 _-]+$/);
const amount = z.number().nonnegative();
const point = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);
const edge = z.object({
  id,
  from: id,
  to: id,
  bidirectional: z.boolean(),
  allowed: z.boolean(),
  capacityTbps: amount.nullable(),
  existingTbps: amount,
  delayMs: amount,
  delayUncertaintyMs: amount,
  srlg: id,
  polyline: z.array(point).min(2),
});
export const schema = z
  .object({
    id,
    seed: z.number().int(),
    source: z.literal("SYNTHETIC"),
    units: z.literal("Tbps, one-way ms, m, h"),
    nodes: z.array(z.object({ id, point })).min(2).max(8),
    edges: z.array(edge).min(1).max(16),
    broken: id,
    demands: z
      .array(
        z.object({
          id,
          from: id,
          to: id,
          offered: amount,
          priority: z.number().int(),
        }),
      )
      .min(1),
    repair: z.object({
      vessel: id,
      depthM: amount,
      rovRatingM: amount,
      winchRatingM: amount,
      distanceNm: amount,
      speedKn: z.number().positive(),
      workHours: z.number().positive(),
      wavesM: amount,
      waveLimitM: amount,
      weatherWindowHours: amount,
      permit: z.boolean(),
      opticalPass: z.boolean(),
      surveyPass: z.boolean(),
      cutbackApproval: z.boolean(),
      rerouteApproval: z.boolean(),
    }),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(s.nodes.map((n) => n.id));
    const invalid =
      [s.nodes, s.edges, s.demands].some(
        (rows) => new Set(rows.map((r) => r.id)).size !== rows.length,
      ) ||
      !s.edges.some((e) => e.id === s.broken) ||
      [...s.edges, ...s.demands].some(
        (e) => !ids.has(e.from) || !ids.has(e.to) || e.from === e.to,
      ) ||
      s.edges.some(
        (e) => e.capacityTbps !== null && e.existingTbps > e.capacityTbps,
      );
    if (invalid)
      ctx.addIssue({
        code: "custom",
        message: "Invalid topology, identifiers or background load",
      });
  });
export type Scenario = z.infer<typeof schema>;
export type Edge = Scenario["edges"][number];
