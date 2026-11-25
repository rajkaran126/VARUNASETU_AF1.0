export const duration = 115;
export const seek = (seconds: number) =>
  Math.min(duration, Math.max(0, Number.isFinite(seconds) ? seconds : 0));
export const reset = () => ({ presentationSeconds: 0, speed: 1, paused: true });
export function engineeringHours(t: number, transit: number, work: number) {
  return (
    Math.min(1, Math.max(0, (t - 29) / 10)) * transit +
    Math.min(1, Math.max(0, (t - 39) / 60)) * work
  );
}
