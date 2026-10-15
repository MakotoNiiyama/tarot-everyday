// src/lib/fortune/sukuyo/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import { MANSION_NAMES, RELATION_NAMES, relationIndex, tableMethod, yearMansion } from "../calc";

const name = (i: number) => MANSION_NAMES[i];
const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("tableMethod(旧暦の月日から表で引く)", () => {
  it.each([
    [d(1990, 3, 29), "畢宿"],
    [d(1986, 10, 19), "畢宿"],
    [d(2026, 10, 1), "井宿"],
    [d(2026, 10, 31), "柳宿"],
    [d(2026, 10, 14), "尾宿"],
    [d(2023, 3, 22), "奎宿"], // 閏2月1日は2月の表
  ])("%o の宿は %s", (date, expected) => {
    expect(name(tableMethod(date))).toBe(expected);
  });
});

describe("relationIndex(三九の秘法)", () => {
  it("距離から11の関係を返すこと", () => {
    const rel = (from: number, to: number) => RELATION_NAMES[relationIndex(from, to)];
    expect(rel(1, 1)).toBe("命");
    expect(rel(1, 2)).toBe("栄");
    expect(rel(1, 9)).toBe("親");
    expect(rel(1, 10)).toBe("業");
    expect(rel(1, 11)).toBe("栄");
    expect(rel(1, 16)).toBe("壊");
    expect(rel(1, 19)).toBe("胎");
    expect(rel(1, 0)).toBe("親"); // 距離 26
  });
});

describe("yearMansion(年の宿)", () => {
  it("2011年の女宿から1年に1つ進み、牛宿の年は斗宿とすること", () => {
    expect([2009, 2010, 2011, 2012, 2013, 2016, 2018, 2026, 2037, 2038, 2039].map((y) => name(yearMansion(y)))).toEqual([
      "斗宿", "斗宿", "女宿", "虚宿", "危宿", "奎宿", "胃宿", "星宿", "斗宿", "斗宿", "女宿",
    ]);
  });

  it("年運は年の宿から本命宿までの距離で数えること(2026年 星宿の年)", () => {
    const year = yearMansion(2026);
    const rel = (honmei: string) => RELATION_NAMES[relationIndex(year, MANSION_NAMES.indexOf(honmei as (typeof MANSION_NAMES)[number]))];
    expect(rel("婁宿")).toBe("胎");
    expect(["井宿", "氐宿", "室宿"].map(rel)).toEqual(["壊", "壊", "壊"]);
  });
});
