// src/lib/fortune/__tests__/local-date.test.ts
import { describe, it, expect } from "vitest";
import {
  addDays,
  compareLocalDate,
  daysInMonth,
  formatSlash,
  fromJdn,
  isLeapYear,
  isValidLocalDate,
  toJdn,
} from "../local-date";

describe("local-date", () => {
  it("ユリウス日に変換できること", () => {
    expect(toJdn({ year: 2000, month: 1, day: 1 })).toBe(2451545);
    expect(toJdn({ year: 2025, month: 1, day: 1 })).toBe(2460677);
  });

  it("ユリウス日から戻せること", () => {
    expect(fromJdn(2451545)).toEqual({ year: 2000, month: 1, day: 1 });
    expect(fromJdn(toJdn({ year: 1948, month: 5, day: 2 }))).toEqual({ year: 1948, month: 5, day: 2 });
  });

  it("日数を加算できること(月・年をまたぐ)", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(addDays({ year: 2025, month: 12, day: 31 }, 1)).toEqual({ year: 2026, month: 1, day: 1 });
    expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it("比較できること", () => {
    expect(compareLocalDate({ year: 2026, month: 1, day: 1 }, { year: 2025, month: 12, day: 31 })).toBeGreaterThan(0);
    expect(compareLocalDate({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 1 })).toBe(0);
  });

  it("うるう年と月の日数", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("存在しない日付を判定できること", () => {
    expect(isValidLocalDate({ year: 2025, month: 2, day: 29 })).toBe(false);
    expect(isValidLocalDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isValidLocalDate({ year: 2024, month: 13, day: 1 })).toBe(false);
    expect(isValidLocalDate({ year: 2024, month: 1, day: 0 })).toBe(false);
    expect(isValidLocalDate({ year: 2024.5, month: 1, day: 1 })).toBe(false);
  });

  it("スラッシュ区切りで表記すること", () => {
    expect(formatSlash({ year: 2026, month: 2, day: 4 })).toBe("2026/2/4");
  });
});
