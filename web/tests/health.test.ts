import { describe, expect, it } from "vitest";
import { statusFromRul } from "../src/lib/health";

describe("statusFromRul", () => {
  it("is HEALTHY above 75 cycles", () => {
    expect(statusFromRul(76)).toBe("HEALTHY");
    expect(statusFromRul(200)).toBe("HEALTHY");
  });
  it("is WATCH from 31 to 75 cycles (75 included)", () => {
    expect(statusFromRul(75)).toBe("WATCH");
    expect(statusFromRul(31)).toBe("WATCH");
  });
  it("is CRITICAL at 30 cycles or less", () => {
    expect(statusFromRul(30)).toBe("CRITICAL");
    expect(statusFromRul(0)).toBe("CRITICAL");
  });
});
