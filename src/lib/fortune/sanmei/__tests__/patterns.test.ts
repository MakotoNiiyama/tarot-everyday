// src/lib/fortune/sanmei/__tests__/patterns.test.ts
import { describe, it, expect } from "vitest";
import { cycleIndexOf } from "../../sexagenary";
import { ijoKanshi, isouho, shukumeiChusatsu } from "../patterns";

/** 干支の名前から番号 */
const c = (stem: string, branch: string) =>
  cycleIndexOf("甲乙丙丁戊己庚辛壬癸".indexOf(stem), "子丑寅卯辰巳午未申酉戌亥".indexOf(branch));

describe("shukumeiChusatsu", () => {
  it("年支が日干支の天中殺なら生年中殺", () => {
    // 癸巳(午未天中殺)の日に 庚午 の年
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("癸", "巳") })).toEqual(["year"]);
  });

  it("月支が日干支の天中殺なら生月中殺", () => {
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("癸", "未"), day: c("癸", "巳") })).toEqual(["year", "month"]);
  });

  it("日支が年干支の天中殺なら生日中殺", () => {
    // 甲子年(戌亥天中殺)の 丙戌 の日。丙戌は甲申旬(午未天中殺)なので年支 子 は該当しない
    expect(shukumeiChusatsu({ year: c("甲", "子"), month: c("丙", "寅"), day: c("丙", "戌") })).toEqual(["day"]);
  });

  it("日干支が甲戌・乙亥なら日座中殺、甲辰・乙巳なら日居中殺", () => {
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("甲", "戌") })).toContain("nichiza");
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("乙", "亥") })).toContain("nichiza");
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("甲", "辰") })).toContain("nikkyo");
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("乙", "巳") })).toContain("nikkyo");
  });
});

describe("ijoKanshi", () => {
  it("年・月・日の柱にある異常干支を返すこと", () => {
    expect(ijoKanshi({ year: c("庚", "午"), month: c("己", "卯"), day: c("癸", "巳") })).toEqual([
      { pillar: "day", cycleNumber: 30, kind: "angou" },
    ]);
    expect(ijoKanshi({ year: c("甲", "戌"), month: c("丁", "巳"), day: c("甲", "子") })).toEqual([
      { pillar: "year", cycleNumber: 11, kind: "normal" },
      { pillar: "month", cycleNumber: 54, kind: "normal" },
    ]);
    expect(ijoKanshi({ year: c("甲", "子"), month: c("丙", "寅"), day: c("丁", "卯") })).toEqual([]);
  });
});

describe("isouho(位相法)", () => {
  /** 年支・月支・日支 */
  const b = (...names: string[]) => names.map((n) => "子丑寅卯辰巳午未申酉戌亥".indexOf(n)) as [number, number, number];

  it("2支ずつの関係を、種類の順・柱の組の順に返すこと", () => {
    expect(isouho(b("午", "卯", "巳"))).toEqual([{ kind: "ha", pillars: ["year", "month"] }]);
    expect(isouho(b("子", "丑", "午"))).toEqual([
      { kind: "shigo", pillars: ["year", "month"] },
      { kind: "taichu", pillars: ["year", "day"] },
      { kind: "gai", pillars: ["month", "day"] },
    ]);
  });

  it("半会は旺支を含まない組も数えること", () => {
    expect(isouho(b("申", "辰", "卯"))).toEqual([
      { kind: "hankai", pillars: ["year", "month"] },
      { kind: "gai", pillars: ["month", "day"] },
    ]);
  });

  it("方三位は3支がそろったときだけ", () => {
    expect(isouho(b("寅", "卯", "辰"))).toEqual([
      { kind: "hosani", pillars: ["year", "month", "day"] },
      { kind: "gai", pillars: ["month", "day"] },
    ]);
  });

  it("寅亥・巳申は支合と破の両方、自刑は同じ支どうし", () => {
    expect(isouho(b("寅", "亥", "未"))).toEqual([
      { kind: "shigo", pillars: ["year", "month"] },
      { kind: "hankai", pillars: ["month", "day"] },
      { kind: "ha", pillars: ["year", "month"] },
    ]);
    expect(isouho(b("午", "午", "子"))).toEqual([
      { kind: "taichu", pillars: ["year", "day"] },
      { kind: "taichu", pillars: ["month", "day"] },
      { kind: "kei", pillars: ["year", "month"] },
    ]);
  });
});
