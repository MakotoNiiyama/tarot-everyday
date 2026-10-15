// src/lib/fortune/shichu/__tests__/shichu.test.ts
import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";
import { shichu } from "../index";

const today = { year: 2026, month: 10, day: 14 };
const read = (p: BirthProfile) => shichu.read(p, toBirthMoment(p), today);
const fact = (r: ReturnType<typeof read>, key: string) => r.natal.find((f) => f.key === key);

describe("shichu.read 人物像", () => {
  const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };

  it("日干と4柱を返すこと(明石基準)", () => {
    const r = read(p);
    expect(r.id).toBe("shichu");
    expect(r.natal.map((f) => f.key)).toEqual([
      "day-master",
      "year-pillar",
      "month-pillar",
      "day-pillar",
      "hour-pillar",
      "meishiki",
      "gogyo",
    ]);
    expect(fact(r, "day-master")).toEqual({
      key: "day-master",
      label: "日干",
      value: "癸(陰の水)",
      refs: [{ system: "shichu", id: "stem-10" }],
    });
    expect(fact(r, "year-pillar")?.value).toBe("庚午");
    expect(fact(r, "year-pillar")?.refs).toEqual([
      { system: "shichu", id: "stem-7" },
      { system: "shichu", id: "branch-7" },
    ]);
    expect(fact(r, "month-pillar")?.value).toBe("己卯");
    expect(fact(r, "day-pillar")?.value).toBe("癸巳");
    expect(fact(r, "hour-pillar")?.value).toBe("己未");
    expect(fact(r, "meishiki")?.value).toBe(
      "年柱 庚午(印綬・丁・絶) / 月柱 己卯(偏官・乙・長生) / 日柱 癸巳(日主・丙・胎) / 時柱 己未(偏官・己・墓)",
    );
    expect(fact(r, "gogyo")).toEqual({
      key: "gogyo",
      label: "五行バランス",
      value: "木1・火2・土3・金1・水1",
      refs: [{ system: "shichu", id: "element-earth" }],
    });
    expect(r.ambiguous).toBe(false);
  });

  it("命式表を返すこと", () => {
    const r = read(p);
    expect(r.chart?.kind).toBe("pillars");
    if (r.chart?.kind !== "pillars") return;
    expect(r.chart.columns).toEqual(["年柱", "月柱", "日柱", "時柱"]);
    expect(r.chart.rows.map((row) => [row.label, row.cells.map((c) => c?.value ?? null)])).toEqual([
      ["干支", ["庚午", "己卯", "癸巳", "己未"]],
      ["通変星", ["印綬", "偏官", "日主", "偏官"]],
      ["蔵干", ["丁", "乙", "丙", "己"]],
      ["十二運", ["絶", "長生", "胎", "墓"]],
    ]);
    expect(r.chart.factKeys).toEqual(["year-pillar", "month-pillar", "day-pillar", "hour-pillar", "meishiki"]);
  });

  it("時刻不明なら時柱を「時刻不明」にし、五行は3柱で数えること", () => {
    const r = read({ ...p, time: { kind: "unknown" } });
    expect(fact(r, "hour-pillar")).toEqual({ key: "hour-pillar", label: "時柱", value: "時刻不明", refs: [] });
    expect(fact(r, "gogyo")?.value).toBe("木1・火2・土1・金1・水1");
    if (r.chart?.kind !== "pillars") throw new Error("命式表がない");
    expect(r.chart.rows.map((row) => row.cells[3]?.value ?? null)).toEqual(["時刻不明", null, null, null]);
    expect(r.ambiguous).toBe(false);
  });

  it("東京の14時台は時柱を候補にすること(地方平均時 15:00 = 14:41 ごろ)", () => {
    const r = read({ ...p, prefecture: "13" });
    expect(fact(r, "hour-pillar")?.value).toMatch(/^己未\(〜14:4\d\) \/ 庚申\(14:4\d〜\)$/);
    expect(r.ambiguous).toBe(true);
    expect(fact(r, "meishiki")?.candidates).toBeUndefined();
  });

  it("性別があれば大運を返すこと", () => {
    expect(fact(read({ ...p, gender: "male" }), "daiun")).toEqual({ key: "daiun", label: "大運", value: "2歳運・順行", refs: [] });
    expect(fact(read({ ...p, gender: "female" }), "daiun")?.value).toBe("8歳運・逆行");
    expect(fact(read(p), "daiun")).toBeUndefined();
  });

  it("節入り当日で時刻不明なら月柱を候補にすること", () => {
    // 啓蟄 1990/3/6 5:19
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 6 }, time: { kind: "unknown" } });
    expect(fact(r, "month-pillar")?.value).toMatch(/^戊寅\(〜5:19\) \/ 己卯\(5:19〜\)$/);
    expect(r.ambiguous).toBe(true);
  });
});

describe("shichu.read 運勢", () => {
  const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" };

  it("今日は日の干支と日干の関係", () => {
    const day = read(p).periods.day;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline).toEqual({
      text: "今日の干支は辛酉。日干癸に対して辛は偏印",
      ref: { system: "shichu", id: "tsuhen-9" },
    });
    expect(day.chips.map((c) => [c.key, c.label, c.value])).toEqual([
      ["ganshi", "日の干支", "辛酉"],
      ["tsuhen", "通変星", "偏印"],
      ["unsei", "十二運", "病"],
    ]);
  });

  it("今月は月の干支", () => {
    const month = read(p).periods.month;
    expect(month.rangeLabel).toBe("2026/10/8〜2026/11/6");
    expect(month.chips.map((c) => c.value)).toEqual(["戊戌", "正官", "衰"]);
  });

  it("今年は年の干支と大運", () => {
    const year = read(p).periods.year;
    expect(year.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(year.chips.map((c) => [c.key, c.value])).toEqual([
      ["ganshi", "丙午"],
      ["tsuhen", "正財"],
      ["unsei", "絶"],
      ["daiun", "癸未(比肩、32〜41歳)"],
    ]);
  });

  it("性別がなければ大運のチップを出さないこと", () => {
    const year = read({ ...p, gender: undefined }).periods.year;
    expect(year.chips.map((c) => c.key)).toEqual(["ganshi", "tsuhen", "unsei"]);
  });

  it("日柱が候補に分かれるときは注記を付けること", () => {
    // 福岡の0時台: 地方平均時 0:00 = 0:18 ごろ。0:00〜0:18 は前日の日柱
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 30 }, time: { kind: "hour", hour: 0 }, prefecture: "40" });
    expect(r.natal.find((f) => f.key === "day-pillar")?.value).toMatch(/^癸巳\(〜0:1\d\) \/ 甲午\(0:1\d〜\)$/);
    for (const period of ["day", "month", "year"] as const) {
      expect(r.periods[period].note).toBe("日柱を癸巳として計算(出生時刻により甲午の可能性があります)");
    }
  });
});
