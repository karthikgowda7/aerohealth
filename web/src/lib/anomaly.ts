// Sensor anomaly detection with a simple z-score rule. Pure functions, no database.

export const BASELINE_CYCLES = 20; // first 20 cycles are assumed healthy
export const WARNING_Z = 3;
export const CRITICAL_Z = 4;
export const STREAK = 3; // alert only after 3 out-of-range cycles in a row

export type Baseline = { mean: number; std: number };

export type AnomalyAlert = {
  sensor: string;
  cycle: number; // cycle where the streak reached STREAK
  value: number;
  zScore: number;
  severity: "WARNING" | "CRITICAL";
};

/** Mean and standard deviation of the first `n` values. */
export function computeBaseline(values: number[], n = BASELINE_CYCLES): Baseline {
  const first = values.slice(0, n);
  if (first.length === 0) return { mean: 0, std: 0 };
  const mean = first.reduce((a, b) => a + b, 0) / first.length;
  const variance = first.reduce((a, b) => a + (b - mean) ** 2, 0) / first.length;
  return { mean, std: Math.sqrt(variance) };
}

/**
 * Find anomalies for ONE sensor of ONE engine.
 * `points` must be sorted by cycle. Returns one alert per streak.
 */
export function detectSensorAnomalies(
  sensor: string,
  points: { cycle: number; value: number }[],
): AnomalyAlert[] {
  const { mean, std } = computeBaseline(points.map((p) => p.value));
  if (std === 0) return []; // constant sensor: z-score is undefined, skip it

  const alerts: AnomalyAlert[] = [];
  let streak = 0;
  let worstZ = 0;
  for (const p of points.slice(BASELINE_CYCLES)) {
    const z = (p.value - mean) / std;
    if (Math.abs(z) >= WARNING_Z) {
      streak += 1;
      worstZ = Math.abs(z) > Math.abs(worstZ) ? z : worstZ;
      if (streak === STREAK) {
        alerts.push({
          sensor,
          cycle: p.cycle,
          value: p.value,
          zScore: Number(worstZ.toFixed(2)),
          severity: Math.abs(worstZ) >= CRITICAL_Z ? "CRITICAL" : "WARNING",
        });
      }
    } else {
      streak = 0; // back in range: the next streak can raise a new alert
      worstZ = 0;
    }
  }
  return alerts;
}

/** Run detection for every sensor of one engine. */
export function detectAnomalies(
  readings: ({ cycle: number } & Record<string, number>)[],
  sensors: readonly string[],
): AnomalyAlert[] {
  const sorted = [...readings].sort((a, b) => a.cycle - b.cycle);
  return sensors.flatMap((s) =>
    detectSensorAnomalies(s, sorted.map((r) => ({ cycle: r.cycle, value: r[s] }))),
  );
}
