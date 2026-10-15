// src/lib/fortune/astro/__tests__/lunar-calendar.test.ts
import { describe, it, expect } from "vitest";
import { lunarMonthSpan, lunarNewYear, lunarYearOf, toLunar } from "../lunar-calendar";

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("toLunar", () => {
  it.each([
    [d(2026, 2, 17), { month: 1, leap: false, day: 1 }],
    [d(2000, 2, 5), { month: 1, leap: false, day: 1 }],
    [d(1990, 3, 29), { month: 3, leap: false, day: 3 }],
    [d(2026, 10, 14), { month: 9, leap: false, day: 4 }],
    [d(1986, 10, 19), { month: 9, leap: false, day: 16 }],
    [d(2026, 10, 1), { month: 8, leap: false, day: 21 }],
    [d(2023, 3, 22), { month: 2, leap: true, day: 1 }],
    [d(2023, 4, 20), { month: 3, leap: false, day: 1 }],
    [d(2025, 7, 25), { month: 6, leap: true, day: 1 }],
    [d(2025, 6, 24), { month: 5, leap: false, day: 29 }],
  ])("%o は旧暦 %o", (date, expected) => {
    expect(toLunar(date)).toMatchObject(expected);
  });

  it.each([
    // 朔が日本時間の0時の前後数分にある日(日付は日本時間で決めること。中国では 2012/6/19 が5月1日)
    [d(2012, 6, 20), { month: 5, leap: false, day: 1 }],
    [d(2005, 12, 2), { month: 11, leap: false, day: 1 }],
    [d(2017, 2, 26), { month: 2, leap: false, day: 1 }],
    // 閏月
    [d(1984, 11, 23), { month: 10, leap: true, day: 1 }],
    [d(2014, 10, 24), { month: 9, leap: true, day: 1 }],
    [d(2001, 5, 23), { month: 4, leap: true, day: 1 }],
    // 範囲の端(1899年の冬至から数える)
    [d(1900, 1, 1), { year: 1899, month: 12, leap: false, day: 1 }],
    [d(2100, 2, 9), { year: 2100, month: 1, leap: false, day: 1 }],
  ])("境界の日 %o は旧暦 %o", (date, expected) => {
    expect(toLunar(date)).toMatchObject(expected);
  });

  it("2033年問題は閏11月案になること", () => {
    expect(toLunar(d(2033, 12, 22))).toMatchObject({ month: 11, leap: true, day: 1 });
    expect(toLunar(d(2034, 1, 1))).toMatchObject({ month: 11, leap: true, day: 11 });
    expect(toLunar(d(2034, 2, 19))).toMatchObject({ month: 1, leap: false, day: 1 });
  });

  it("旧暦の年は旧正月で切り替わること", () => {
    expect(toLunar(d(2026, 2, 16)).year).toBe(2025);
    expect(toLunar(d(2026, 2, 17)).year).toBe(2026);
    expect(lunarYearOf(d(2027, 2, 6))).toBe(2026);
  });
});

describe("lunarMonthSpan / lunarNewYear", () => {
  it("その日を含む旧暦月の1日〜末日", () => {
    expect(lunarMonthSpan(d(2026, 10, 14))).toEqual({ start: d(2026, 10, 11), end: d(2026, 11, 8) });
  });

  it("旧正月の日付", () => {
    expect(lunarNewYear(2026)).toEqual(d(2026, 2, 17));
    expect(lunarNewYear(2027)).toEqual(d(2027, 2, 7));
    expect(lunarNewYear(1900)).toEqual(d(1900, 1, 31));
  });
});
