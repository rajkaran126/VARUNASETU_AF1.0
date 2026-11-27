import type { Scenario } from "./schema";
export function planRepair({ repair: r }: Scenario) {
  const hold = !r.permit
    ? "Permit pending"
    : r.wavesM > r.waveLimitM || r.weatherWindowHours < r.workHours
      ? "Weather hold"
      : Math.min(r.rovRatingM, r.winchRatingM) < r.depthM
        ? "Equipment depth limit"
        : null;
  const transitHours = r.distanceNm / r.speedKn;
  return { hold, transitHours, etaHours: transitHours + r.workHours };
}
export const applyTestOutcome = (s: Scenario) => s.repair.opticalPass;
export const applyRestoration = (s: Scenario) =>
  !planRepair(s).hold && applyTestOutcome(s) && s.repair.surveyPass;
