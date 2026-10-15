// src/lib/fortune/__tests__/sexagenary.test.ts
import { describe, it, expect } from "vitest";
import {
  BRANCHES,
  STEMS,
  TEN_GOD_NAMES,
  TWELVE_STAGE_NAMES,
  branchElement,
  branchOf,
  cycleIndexOf,
  cycleName,
  dayCycleIndex,
  hourBranchIndex,
  hourCycleIndex,
  isYangStem,
  monthBranchIndex,
  monthCycleIndex,
  stemElement,
  stemOf,
  tenGodIndex,
  twelveStageIndex,
  yearBranchIndex,
  yearCycleIndex,
} from "../sexagenary";

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

describe("干支番号", () => {
  it("十干と十二支から六十干支の番号を求めること", () => {
    expect(cycleIndexOf(0, 0)).toBe(0); // 甲子
    expect(cycleIndexOf(0, 10)).toBe(10); // 甲戌
    expect(cycleIndexOf(2, 6)).toBe(42); // 丙午
    expect(cycleIndexOf(9, 5)).toBe(29); // 癸巳
    expect(() => cycleIndexOf(0, 1)).toThrow();
  });

  it("番号から十干・十二支を取り出すこと", () => {
    expect(stemOf(29)).toBe(9);
    expect(branchOf(29)).toBe(5);
    expect(stemOf(-1)).toBe(9);
  });

  it("立春で区切った年の干支", () => {
    expect(cycleName(yearCycleIndex(1984))).toBe("甲子");
    expect(cycleName(yearCycleIndex(1990))).toBe("庚午");
    expect(cycleName(yearCycleIndex(2026))).toBe("丙午");
  });

  it("節月の干支(甲己の年は丙寅から)", () => {
    expect(cycleName(monthCycleIndex(2026, 0))).toBe("庚寅");
    expect(cycleName(monthCycleIndex(1990, 1))).toBe("己卯");
    expect(cycleName(monthCycleIndex(2026, 8))).toBe("戊戌");
    expect(cycleName(monthCycleIndex(1985, 10))).toBe("戊子");
    expect(cycleName(monthCycleIndex(1984, 0))).toBe("丙寅");
  });

  it("時の十二支(23時と0時は子)", () => {
    expect([23, 0, 1, 2, 13, 14, 15, 22].map(hourBranchIndex)).toEqual([0, 0, 1, 1, 7, 7, 8, 11]);
  });

  it("時柱の干支(甲己の日は甲子から)", () => {
    expect(cycleName(hourCycleIndex(0, 0))).toBe("甲子");
    expect(cycleName(hourCycleIndex(9, 0))).toBe("壬子");
    expect(cycleName(hourCycleIndex(9, 7))).toBe("己未");
  });

  it("時柱の子の刻の十干は日干の5組ごとに決まること", () => {
    // 甲己→甲子、乙庚→丙子、丙辛→戊子、丁壬→庚子、戊癸→壬子
    const starts = STEMS.map((_, dayStem) => cycleName(hourCycleIndex(dayStem, 0)));
    expect(starts).toEqual(["甲子", "丙子", "戊子", "庚子", "壬子", "甲子", "丙子", "戊子", "庚子", "壬子"]);
  });

  it("月柱の寅月の十干は年干の5組ごとに決まること", () => {
    // 1984(甲)〜1993(癸)。甲己→丙寅、乙庚→戊寅、丙辛→庚寅、丁壬→壬寅、戊癸→甲寅
    const starts = STEMS.map((_, i) => cycleName(monthCycleIndex(1984 + i, 0)));
    expect(starts).toEqual(["丙寅", "戊寅", "庚寅", "壬寅", "甲寅", "丙寅", "戊寅", "庚寅", "壬寅", "甲寅"]);
  });
});

describe("五行・陰陽", () => {
  it("十干と十二支の五行(0 = 木 … 4 = 水)", () => {
    expect(STEMS.map((_, s) => stemElement(s))).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(BRANCHES.map((_, b) => branchElement(b))).toEqual([4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]);
    expect(isYangStem(0)).toBe(true);
    expect(isYangStem(9)).toBe(false);
  });
});

describe("通変星", () => {
  it("日干から見た十干の通変星", () => {
    const name = (day: number, other: number) => TEN_GOD_NAMES[tenGodIndex(day, other)];
    expect(name(9, 9)).toBe("比肩");
    expect(name(0, 1)).toBe("劫財");
    expect(name(9, 1)).toBe("食神");
    expect(name(0, 3)).toBe("傷官");
    expect(name(0, 4)).toBe("偏財");
    expect(name(9, 2)).toBe("正財");
    expect(name(9, 5)).toBe("偏官");
    expect(name(9, 4)).toBe("正官");
    expect(name(9, 7)).toBe("偏印");
    expect(name(9, 6)).toBe("印綬");
  });
});

describe("十二運", () => {
  it("陽干は順行・陰干は逆行、土は火と同じ(火土同根)", () => {
    const name = (day: number, branch: number) => TWELVE_STAGE_NAMES[twelveStageIndex(day, branch)];
    expect(name(0, 11)).toBe("長生"); // 甲・亥
    expect(name(0, 3)).toBe("帝旺"); // 甲・卯
    expect(name(9, 3)).toBe("長生"); // 癸・卯
    expect(name(9, 11)).toBe("帝旺"); // 癸・亥
    expect(name(9, 6)).toBe("絶"); // 癸・午
    expect(name(9, 5)).toBe("胎"); // 癸・巳
    expect(name(9, 7)).toBe("墓"); // 癸・未
    expect(name(4, 2)).toBe("長生"); // 戊・寅
    expect(name(5, 9)).toBe("長生"); // 己・酉
  });
});
