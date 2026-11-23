import { describe, expect, it } from "vitest";
import { canTransition, nextStatuses } from "../src/lib/workorder";

describe("work order state machine", () => {
  it("allows the normal flow", () => {
    expect(canTransition("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });
  it("allows cancelling an open or in-progress order", () => {
    expect(canTransition("OPEN", "CANCELLED")).toBe(true);
    expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
  });
  it("blocks skipping and going backwards", () => {
    expect(canTransition("OPEN", "COMPLETED")).toBe(false);
    expect(canTransition("IN_PROGRESS", "OPEN")).toBe(false);
  });
  it("treats COMPLETED and CANCELLED as final", () => {
    expect(canTransition("COMPLETED", "OPEN")).toBe(false);
    expect(canTransition("CANCELLED", "IN_PROGRESS")).toBe(false);
    expect(nextStatuses("COMPLETED")).toEqual([]);
  });
  it("allows the same status (no change)", () => {
    expect(canTransition("COMPLETED", "COMPLETED")).toBe(true);
  });
});
