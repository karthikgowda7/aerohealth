import { describe, expect, it } from "vitest";
import { computeBaseline, detectSensorAnomalies } from "../src/lib/anomaly";

// 20 healthy cycles alternating 9 and 11 -> mean 10, std 1
const healthy = Array.from({ length: 20 }, (_, i) => ({ cycle: i + 1, value: i % 2 === 0 ? 9 : 11 }));
const after = (values: number[]) => values.map((value, i) => ({ cycle: 21 + i, value }));

describe("computeBaseline", () => {
  it("uses only the first 20 values", () => {
    const b = computeBaseline([...healthy.map((p) => p.value), 1000]);
    expect(b.mean).toBe(10);
    expect(b.std).toBe(1);
  });
});

describe("detectSensorAnomalies", () => {
  it("does not alert on a streak of 2", () => {
    expect(detectSensorAnomalies("s4", [...healthy, ...after([13.5, 13.5, 10])])).toHaveLength(0);
  });
  it("raises one WARNING after 3 cycles with |z| >= 3", () => {
    const alerts = detectSensorAnomalies("s4", [...healthy, ...after([13, 13.2, 13.1, 13.3])]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ sensor: "s4", cycle: 23, severity: "WARNING" });
  });
  it("raises CRITICAL when |z| >= 4, including low values", () => {
    const alerts = detectSensorAnomalies("s7", [...healthy, ...after([5, 5, 5])]);
    expect(alerts[0].severity).toBe("CRITICAL");
    expect(alerts[0].zScore).toBe(-5);
  });
  it("starts a new alert after the value returns to normal", () => {
    const alerts = detectSensorAnomalies("s4", [...healthy, ...after([14, 14, 14, 10, 14, 14, 14])]);
    expect(alerts).toHaveLength(2);
  });
  it("skips a constant sensor (std = 0)", () => {
    const flat = Array.from({ length: 30 }, (_, i) => ({ cycle: i + 1, value: 5 }));
    expect(detectSensorAnomalies("s1", flat)).toEqual([]);
  });
});
