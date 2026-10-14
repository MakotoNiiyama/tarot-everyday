// src/lib/fortune/__tests__/sexagenary.test.ts
import { describe, it, expect } from "vitest";
import { cycleName, dayCycleIndex, monthBranchIndex, yearBranchIndex, BRANCHES } from "../sexagenary";

describe("sexagenary", () => {
  it("日の干支", () => {
    expect(cycleName(dayCycleIndex({ year: 2000, month: 1, day: 1 }))).toBe("戊午");
    expect(cycleName(dayCycleIndex({ year: 2025, month: 1, day: 1 }))).toBe("庚午");
    expect(cycleName(dayCycleIndex({ year: 2024, month: 12, day: 26 }))).toBe("甲子");
  });

  it("年の十二支(立春で区切った年)", () => {
    expect(BRANCHES[yearBranchIndex(2026)]).toBe("午");
    expect(BRANCHES[yearBranchIndex(1984)]).toBe("子");
  });

  it("節月の十二支(0 = 寅月)", () => {
    expect(BRANCHES[monthBranchIndex(0)]).toBe("寅");
    expect(BRANCHES[monthBranchIndex(10)]).toBe("子");
    expect(BRANCHES[monthBranchIndex(11)]).toBe("丑");
  });
});
