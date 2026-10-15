// src/lib/fortune/sanmei/__tests__/sanmei.test.ts
import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";
import { sanmei } from "../index";

const today = { year: 2026, month: 10, day: 14 };
const read = (p: BirthProfile) => sanmei.read(p, toBirthMoment(p), today);
const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
const values = (r: ReturnType<typeof read>) => Object.fromEntries(r.natal.map((f) => [f.key, f.value]));

describe("sanmei.read 人物像", () => {
  it("中心星・天中殺・陰占・人体星図・宿命中殺・異常干支・位相法を返すこと", () => {
    const r = read(p);
    expect(r.id).toBe("sanmei");
    expect(r.natal.map((f) => f.key)).toEqual([
      "center", "tenchu", "insen", "north", "east", "west", "south", "early", "middle", "late", "shukumei", "ijo", "isou",
    ]);
    expect(values(r)).toEqual({
      center: "鳳閣星",
      tenchu: "午未天中殺",
      insen: "庚午・己卯・癸巳",
      north: "玉堂星",
      east: "禄存星",
      west: "司禄星",
      south: "車騎星",
      early: "天馳星",
      middle: "天貴星",
      late: "天報星",
      shukumei: "生年中殺",
      ijo: "癸巳(日柱・暗合)",
      isou: "年支と月支が破",
    });
    expect(r.natal[0].refs).toEqual([{ system: "sanmei", id: "main-3" }]);
    expect(r.natal.find((f) => f.key === "tenchu")?.refs).toEqual([{ system: "sanmei", id: "tenchu-4" }]);
    expect(r.natal.find((f) => f.key === "ijo")?.refs).toEqual([{ system: "sanmei", id: "ijo-30" }]);
    expect(r.natal.find((f) => f.key === "isou")?.refs).toEqual([{ system: "sanmei", id: "isou-ha" }]);
    expect(r.ambiguous).toBe(false);
  });

  it("人体星図を返すこと", () => {
    const r = read(p);
    if (r.chart?.kind !== "body-stars") throw new Error("人体星図がない");
    expect(r.chart.cells.map((c) => (c ? [c.fact.label, c.fact.value, c.tone] : null))).toEqual([
      null,
      ["頭(北)", "玉堂星", "main"],
      ["左肩(初年)", "天馳星", "sub"],
      ["右手(西)", "司禄星", "main"],
      ["中心星", "鳳閣星", "center"],
      ["左手(東)", "禄存星", "main"],
      ["右足(晩年)", "天報星", "sub"],
      ["腹(南)", "車騎星", "main"],
      ["左足(中年)", "天貴星", "sub"],
    ]);
    expect(r.chart.factKeys).toEqual(["center", "north", "east", "west", "south", "early", "middle", "late"]);
  });

  it("該当がなければ「なし」にすること", () => {
    // 「なし」のときは参照が空、該当があるときは参照があることを確かめる
    const r = read({ version: 1, date: { year: 2000, month: 1, day: 1 }, time: { kind: "unknown" } });
    for (const key of ["shukumei", "ijo", "isou"]) {
      const f = r.natal.find((x) => x.key === key)!;
      if (f.value === "なし") expect(f.refs).toEqual([]);
      else expect(f.refs.length).toBeGreaterThan(0);
    }
  });

  it("性別があれば大運を返すこと", () => {
    expect(read({ ...p, gender: "male" }).natal.find((f) => f.key === "daiun")?.value).toBe("2歳運・順行");
    expect(read(p).natal.find((f) => f.key === "daiun")).toBeUndefined();
  });

  it("節入り・立春の当日で時刻不明なら大運を候補にすること", () => {
    // 啓蟄 1990/3/6 5:19。前は寅月で1歳運、後は卯月で10歳運
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 6 }, time: { kind: "unknown" }, gender: "male" });
    expect(r.natal.find((f) => f.key === "daiun")?.candidates).toEqual([
      { value: "1歳運・順行", rangeLabel: "〜5:19" },
      { value: "10歳運・順行", rangeLabel: "5:19〜" },
    ]);
    expect(r.periods.year.note).toBe("大運を1歳運・順行として計算(出生時刻により10歳運・順行の可能性があります)");
    expect(r.periods.day.note).toBeUndefined();
    // 立春 2026/2/4 5:01。前は乙巳年(陰)で逆行、後は丙午年(陽)で順行
    const risshun = read({ version: 1, date: { year: 2026, month: 2, day: 4 }, time: { kind: "unknown" }, gender: "male" });
    expect(risshun.natal.find((f) => f.key === "daiun")?.value).toBe("10歳運・逆行(〜5:01) / 10歳運・順行(5:01〜)");
    expect(risshun.periods.year.note).toBe("大運を10歳運・逆行として計算(出生時刻により10歳運・順行の可能性があります)");
  });

  it("節入り当日で時刻不明なら月の星を候補にすること", () => {
    // 啓蟄 1990/3/6 5:19
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 6 }, time: { kind: "unknown" } });
    expect(r.natal.find((f) => f.key === "insen")?.value).toMatch(/^庚午・戊寅・\S+\(〜5:19\) \/ 庚午・己卯・\S+\(5:19〜\)$/);
    expect(r.ambiguous).toBe(true);
  });
});

describe("sanmei.read 運勢", () => {
  it("今日は日の干支の星", () => {
    const day = read(p).periods.day;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline).toEqual({ text: "今日の干支は辛酉。日干癸から見て龍高星", ref: { system: "sanmei", id: "main-9" } });
    expect(day.chips.map((c) => [c.key, c.value])).toEqual([
      ["ganshi", "辛酉"],
      ["main", "龍高星"],
      ["sub", "天胡星"],
      ["tenchu", "該当しない"],
    ]);
  });

  it("今月は月の干支の星", () => {
    const month = read(p).periods.month;
    expect(month.chips.map((c) => c.value)).toEqual(["戊戌", "牽牛星", "天堂星", "該当しない"]);
  });

  it("天中殺の年は見出しで知らせること", () => {
    // 2026 丙午年。癸巳の日生まれは午未天中殺
    const year = read({ ...p, gender: "male" }).periods.year;
    expect(year.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(year.headline).toEqual({ text: "今年は天中殺の年(丙午)", ref: { system: "sanmei", id: "tenchu-4" } });
    expect(year.chips.map((c) => [c.key, c.value])).toEqual([
      ["ganshi", "丙午"],
      ["main", "司禄星"],
      ["sub", "天馳星"],
      ["tenchu", "該当(午未)"],
      ["daiun", "癸未(貫索星・天庫星、32〜41歳)"],
    ]);
  });
});
