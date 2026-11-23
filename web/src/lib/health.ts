export type HealthStatus = "HEALTHY" | "WATCH" | "CRITICAL";

export const WATCH_LIMIT = 75; // at or below this many cycles left: WATCH
export const CRITICAL_LIMIT = 30; // at or below this many cycles left: CRITICAL

/** Turn a predicted Remaining Useful Life (in cycles) into a health status. */
export function statusFromRul(predictedRul: number): HealthStatus {
  if (predictedRul <= CRITICAL_LIMIT) return "CRITICAL";
  if (predictedRul <= WATCH_LIMIT) return "WATCH";
  return "HEALTHY";
}
