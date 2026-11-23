import { describe, expect, it } from "vitest";
import { createWorkOrderBody, engineListQuery } from "../src/lib/validation";

describe("validation", () => {
  it("applies defaults to the engine list query", () => {
    expect(engineListQuery.parse({})).toEqual({ sort: "rul", order: "asc" });
  });
  it("rejects an unknown status", () => {
    expect(engineListQuery.safeParse({ status: "BROKEN" }).success).toBe(false);
  });
  it("accepts a valid work order and defaults priority", () => {
    const r = createWorkOrderBody.parse({ engineSerial: "ESN-007", title: "Borescope inspection" });
    expect(r.priority).toBe("MEDIUM");
  });
  it("rejects a bad serial and a short title", () => {
    expect(createWorkOrderBody.safeParse({ engineSerial: "7", title: "Borescope" }).success).toBe(false);
    expect(createWorkOrderBody.safeParse({ engineSerial: "ESN-007", title: "ab" }).success).toBe(false);
  });
});
