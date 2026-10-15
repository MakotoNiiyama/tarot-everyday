// src/lib/fortune/sanmei/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import { STEMS, cycleIndexOf, cycleName } from "../../sexagenary";
import { tokyoToUtc } from "../../tokyo-time";
import { MAIN_STAR_NAMES, SUB_STAR_NAMES, TENCHU_NAMES, bodyStars, nijuhachigen, sanmeiNatalAt, tenchuOf } from "../calc";

const date = { year: 1990, month: 3, day: 29 };

describe("nijuhachigen(二十八元)", () => {
  it("節入り日を1日目とする日数で初元・中元・本元を選ぶこと", () => {
    const name = (branch: number, day: number) => STEMS[nijuhachigen(branch, day)];
    expect(name(0, 1)).toBe("癸"); // 子
    expect(name(1, 9)).toBe("癸"); // 丑
    expect(name(1, 10)).toBe("辛");
    expect(name(1, 13)).toBe("己");
    expect(name(6, 19)).toBe("己"); // 午
    expect(name(6, 20)).toBe("丁");
    expect(name(6, 24)).toBe("丁");
    expect(name(3, 24)).toBe("乙"); // 卯
    expect(name(5, 24)).toBe("丙"); // 巳
    expect(name(8, 11)).toBe("壬"); // 申
    expect(name(11, 12)).toBe("甲"); // 亥
    expect(name(11, 13)).toBe("壬");
  });
});

describe("sanmeiNatalAt", () => {
  it("年・月・日の3柱と日数を返すこと(日柱は暦日)", () => {
    const n = sanmeiNatalAt(tokyoToUtc(1990, 3, 29, 12, 0), date);
    expect([n.year, n.month, n.day].map(cycleName)).toEqual(["庚午", "己卯", "癸巳"]);
    expect(n.dayNumber).toBe(24);
  });
});

describe("bodyStars(人体星図)", () => {
  it("十大主星と十二大従星を配置すること", () => {
    const s = bodyStars(sanmeiNatalAt(tokyoToUtc(1990, 3, 29, 12, 0), date));
    expect({
      north: MAIN_STAR_NAMES[s.north],
      south: MAIN_STAR_NAMES[s.south],
      east: MAIN_STAR_NAMES[s.east],
      center: MAIN_STAR_NAMES[s.center],
      west: MAIN_STAR_NAMES[s.west],
      early: SUB_STAR_NAMES[s.early],
      middle: SUB_STAR_NAMES[s.middle],
      late: SUB_STAR_NAMES[s.late],
    }).toEqual({
      north: "玉堂星", // 癸 × 年干 庚
      south: "車騎星", // 癸 × 月干 己
      east: "禄存星", // 癸 × 年支 午 の蔵干 丁
      center: "鳳閣星", // 癸 × 月支 卯 の蔵干 乙
      west: "司禄星", // 癸 × 日支 巳 の蔵干 丙
      early: "天馳星", // 癸 × 午(絶)
      middle: "天貴星", // 癸 × 卯(長生)
      late: "天報星", // 癸 × 巳(胎)
    });
  });
});

describe("tenchuOf", () => {
  it("日干支の旬から天中殺の2支を求めること", () => {
    expect(tenchuOf(0)).toEqual({ number: 6, branches: [10, 11] }); // 甲子旬 → 戌亥
    expect(tenchuOf(10)).toEqual({ number: 5, branches: [8, 9] }); // 甲戌旬 → 申酉
    expect(tenchuOf(29)).toEqual({ number: 4, branches: [6, 7] }); // 癸巳(甲申旬) → 午未
    expect(tenchuOf(59)).toEqual({ number: 1, branches: [0, 1] }); // 癸亥(甲寅旬) → 子丑
    expect(TENCHU_NAMES[tenchuOf(cycleIndexOf(2, 2)).number - 1]).toBe("戌亥天中殺"); // 丙寅は甲子旬
  });
});
