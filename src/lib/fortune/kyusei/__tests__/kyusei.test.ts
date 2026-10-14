// src/lib/fortune/kyusei/__tests__/kyusei.test.ts
import { describe, it, expect } from "vitest";
import { kyusei, palaceId, starId, directionId } from "../index";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";

const today = { year: 2026, month: 10, day: 14 };

describe("kyusei.read", () => {
  it("人物像に本命星・月命星・傾斜宮を返すこと", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.natal).toEqual([
      { label: "本命星", value: "一白水星", refs: [{ system: "kyusei", id: starId(1) }] },
      { label: "月命星", value: "七赤金星", refs: [{ system: "kyusei", id: starId(7) }] },
      { label: "傾斜宮", value: "艮宮", refs: [{ system: "kyusei", id: palaceId("ne") }] },
    ]);
    expect(r.ambiguous).toBe(false);
  });

  it("立春当日で時刻不明なら本命星を候補にすること", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.ambiguous).toBe(true);
    expect(r.natal[0].value).toMatch(/^二黒土星\(〜11:1\d\) \/ 一白水星\(11:1\d〜\)$/);
    expect(r.natal[0].refs).toEqual([
      { system: "kyusei", id: starId(2) },
      { system: "kyusei", id: starId(1) },
    ]);
  });

  it("五黄同士で性別未入力なら傾斜宮を両方示すこと", () => {
    // 1995年(五黄の年)の申月(8/8〜9/7)は 2・5・8 グループで月命も五黄
    const p: BirthProfile = { version: 1, date: { year: 1995, month: 8, day: 20 }, time: { kind: "hour", hour: 12 } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.natal[0].value).toBe("五黄土星");
    expect(r.natal[1].value).toBe("五黄土星");
    expect(r.natal[2].value).toBe("兌宮(男性)または乾宮(女性)");
  });

  it("期間の範囲は立春・節入りで区切ること", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.periods.year.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(r.periods.month.rangeLabel).toMatch(/^2026\/10\/8〜2026\/11\/6$/);
    expect(r.periods.day.rangeLabel).toBe("2026/10/14");
  });

  it("期間の結果に本命星の位置と吉方位のチップを持つこと", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    // 2026年は一白が中宮 → 本命一白は中宮に回る
    expect(r.periods.year.headline).toEqual({ text: "今年は本命星が中宮に回る", ref: { system: "kyusei", id: palaceId("center") } });
    const labels = r.periods.year.chips.map((c) => c.label);
    expect(labels).toEqual(["本命星の位置", "吉方位", "年盤の中宮"]);
    expect(r.periods.year.chips[2].value).toBe("一白水星");
    for (const chip of r.periods.year.chips[1].refs) expect(chip.id).toMatch(/^direction-/);
  });

  it("id の形式", () => {
    expect(starId(9)).toBe("star-9");
    expect(palaceId("nw")).toBe("palace-nw");
    expect(directionId("se")).toBe("direction-se");
  });
});
