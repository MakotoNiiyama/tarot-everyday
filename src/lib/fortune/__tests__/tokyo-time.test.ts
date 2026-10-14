// src/lib/fortune/__tests__/tokyo-time.test.ts
import { describe, it, expect } from "vitest";
import { tokyoParts, tokyoToUtc, jstLocalDate, formatTokyoHm } from "../tokyo-time";

describe("tokyo-time", () => {
  it("通常期間は UTC+9 で変換すること", () => {
    expect(tokyoToUtc(2026, 10, 14, 12, 0).toISOString()).toBe("2026-10-14T03:00:00.000Z");
  });

  it("1949年夏のサマータイム期間は UTC+10 で変換すること", () => {
    expect(tokyoToUtc(1949, 7, 1, 12, 0).toISOString()).toBe("1949-07-01T02:00:00.000Z");
    expect(tokyoToUtc(1949, 12, 1, 12, 0).toISOString()).toBe("1949-12-01T03:00:00.000Z");
  });

  it("24時は翌日0時として扱うこと", () => {
    expect(tokyoToUtc(2026, 10, 14, 24, 0).toISOString()).toBe("2026-10-14T15:00:00.000Z");
  });

  it("瞬間を日本時間の年月日時分とオフセットに分解すること", () => {
    expect(tokyoParts(new Date("1948-05-01T15:00:00Z"))).toEqual({
      year: 1948, month: 5, day: 2, hour: 1, minute: 0, offsetMinutes: 600,
    });
    expect(tokyoParts(new Date("2026-02-03T20:01:00Z"))).toEqual({
      year: 2026, month: 2, day: 4, hour: 5, minute: 1, offsetMinutes: 540,
    });
  });

  it("日本時間の日付と時刻の表記", () => {
    const at = new Date("2026-02-03T20:01:00Z");
    expect(jstLocalDate(at)).toEqual({ year: 2026, month: 2, day: 4 });
    expect(formatTokyoHm(at)).toBe("5:01");
  });
});
