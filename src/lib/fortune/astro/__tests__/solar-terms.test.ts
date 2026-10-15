// src/lib/fortune/astro/__tests__/solar-terms.test.ts
import { describe, it, expect } from "vitest";
import { solarLongitudeTime, solarMonthAt, jieBoundariesWithin, SOLAR_MONTH_BRANCH_NAMES, dayNumberInSolarMonth } from "../solar-terms";
import { tokyoToUtc } from "../../tokyo-time";

const minutesBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000;

describe("solarLongitudeTime", () => {
  it("立春・冬至の時刻が国立天文台の値と1分以内で一致すること", () => {
    expect(minutesBetween(solarLongitudeTime(2025, 315), tokyoToUtc(2025, 2, 3, 23, 10))).toBeLessThanOrEqual(1);
    expect(minutesBetween(solarLongitudeTime(2021, 315), tokyoToUtc(2021, 2, 3, 23, 59))).toBeLessThanOrEqual(1);
    expect(minutesBetween(solarLongitudeTime(2026, 315), tokyoToUtc(2026, 2, 4, 5, 2))).toBeLessThanOrEqual(1);
    expect(minutesBetween(solarLongitudeTime(2026, 270), tokyoToUtc(2026, 12, 22, 5, 50))).toBeLessThanOrEqual(1);
  });
});

describe("solarMonthAt", () => {
  it("1990年3月29日は1990年の卯月(index 1)", () => {
    const m = solarMonthAt(tokyoToUtc(1990, 3, 29, 12, 0));
    expect(m.kyuseiYear).toBe(1990);
    expect(m.index).toBe(1);
    expect(SOLAR_MONTH_BRANCH_NAMES[m.index]).toBe("卯月");
  });

  it("立春前の1月は前年の子月・丑月", () => {
    const beforeShokan = solarMonthAt(tokyoToUtc(2026, 1, 3, 12, 0));
    expect(beforeShokan.kyuseiYear).toBe(2025);
    expect(beforeShokan.index).toBe(10);
    const afterShokan = solarMonthAt(tokyoToUtc(2026, 1, 20, 12, 0));
    expect(afterShokan.kyuseiYear).toBe(2025);
    expect(afterShokan.index).toBe(11);
  });

  it("立春の時刻の前後で年が切り替わること", () => {
    const risshun = solarLongitudeTime(1990, 315);
    expect(solarMonthAt(new Date(risshun.getTime() - 60_000)).kyuseiYear).toBe(1989);
    expect(solarMonthAt(new Date(risshun.getTime() + 60_000)).kyuseiYear).toBe(1990);
  });

  it("start と end が節入りの時刻であること", () => {
    const m = solarMonthAt(tokyoToUtc(2026, 10, 14, 12, 0));
    expect(m.index).toBe(8); // 戌月(寒露〜立冬)
    expect(m.start.getTime()).toBe(solarLongitudeTime(2026, 195).getTime());
    expect(m.end.getTime()).toBe(solarLongitudeTime(2026, 225).getTime());
  });
});

describe("jieBoundariesWithin", () => {
  it("範囲内の節入り時刻だけを返すこと", () => {
    const day = { start: tokyoToUtc(1990, 2, 4, 0, 0), end: tokyoToUtc(1990, 2, 4, 24, 0) };
    const result = jieBoundariesWithin(day);
    expect(result).toHaveLength(1);
    expect(result[0].getTime()).toBe(solarLongitudeTime(1990, 315).getTime());
    expect(jieBoundariesWithin({ start: tokyoToUtc(1990, 3, 29, 0, 0), end: tokyoToUtc(1990, 3, 29, 24, 0) })).toEqual([]);
  });
});

describe("dayNumberInSolarMonth", () => {
  it("節入り日を1日目として数えること", () => {
    // 啓蟄 1990/3/6 5:19
    expect(dayNumberInSolarMonth(tokyoToUtc(1990, 3, 29, 14, 0))).toBe(24);
    expect(dayNumberInSolarMonth(tokyoToUtc(1990, 3, 6, 12, 0))).toBe(1);
    // 節入りの時刻より前は前の月(立春 1990/2/4 から数えて31日目)
    expect(dayNumberInSolarMonth(tokyoToUtc(1990, 3, 6, 3, 0))).toBe(31);
  });

  it("サマータイム中は標準時の日付で数えること", () => {
    // 芒種 1949/6/6。サマータイムの 7/1 0:30 は標準時で 6/30 23:30 なので25日目
    expect(dayNumberInSolarMonth(tokyoToUtc(1949, 7, 1, 0, 30))).toBe(25);
    expect(dayNumberInSolarMonth(tokyoToUtc(1949, 7, 1, 1, 30))).toBe(26);
  });
});
