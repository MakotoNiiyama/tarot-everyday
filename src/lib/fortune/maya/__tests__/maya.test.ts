// src/lib/fortune/maya/__tests__/maya.test.ts
import { describe, it, expect } from "vitest";
import { maya, moonId, sealId, toneId } from "../index";
import { kinOf } from "../calc";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";

const profile: BirthProfile = { version: 1, date: { year: 1987, month: 7, day: 26 }, time: { kind: "unknown" } };
const today = { year: 2026, month: 10, day: 14 };
const reading = maya.read(profile, toBirthMoment(profile), today);

describe("maya.read", () => {
  it("人物像にKIN・紋章・音・ウェイブスペル・関係KINを返すこと", () => {
    const byLabel = Object.fromEntries(reading.natal.map((f) => [f.label, f]));
    expect(byLabel["KIN"].value).toBe("34");
    expect(byLabel["太陽の紋章"]).toEqual({ label: "太陽の紋章", value: "白い魔法使い", refs: [{ system: "maya", id: sealId(14) }] });
    expect(byLabel["銀河の音"]).toEqual({ label: "銀河の音", value: "8(銀河)", refs: [{ system: "maya", id: toneId(8) }] });
    expect(byLabel["ウェイブスペル"].value).toBe("青い手");
    expect(byLabel["ガイドKIN"].value).toBe("138 白い鏡");
    expect(byLabel["類似KIN"].value).toMatch(/赤い蛇$/);
    expect(byLabel["反対KIN"].value).toMatch(/黄色い種$/);
    expect(byLabel["神秘KIN"].value).toMatch(/^227 /);
    expect(reading.ambiguous).toBe(false);
  });

  it("今日は今日のKIN", () => {
    const kin = kinOf(today);
    expect(reading.periods.day.rangeLabel).toBe("2026/10/14");
    expect(reading.periods.day.chips[0].label).toBe("今日のKIN");
    expect(reading.periods.day.chips[0].value.startsWith(`${kin} `)).toBe(true);
  });

  it("今月は13の月の暦の月", () => {
    expect(reading.periods.month.rangeLabel).toBe("13の月の暦 第3の月");
    expect(reading.periods.month.headline).toEqual({ text: "13の月の暦 第3の月(電気の月)", ref: { system: "maya", id: moonId(3) } });
  });

  it("今年は年回りKIN(直近の誕生日から次の誕生日の前日まで)", () => {
    expect(reading.periods.year.rangeLabel).toBe("2026/7/26〜2027/7/25");
    expect(reading.periods.year.chips[0].label).toBe("年回りKIN");
    expect(reading.periods.year.chips[0].value.startsWith(`${kinOf({ year: 2026, month: 7, day: 26 })} `)).toBe(true);
  });

  it("2月29日生まれの年の範囲は次の誕生日の前日までにすること", () => {
    const leap: BirthProfile = { version: 1, date: { year: 2000, month: 2, day: 29 }, time: { kind: "unknown" } };
    const read = (t: { year: number; month: number; day: number }) => maya.read(leap, toBirthMoment(leap), t);
    expect(read({ year: 2027, month: 6, day: 1 }).periods.year.rangeLabel).toBe("2027/2/28〜2028/2/28");
    expect(read({ year: 2028, month: 3, day: 1 }).periods.year.rangeLabel).toBe("2028/2/29〜2029/2/27");
  });

  it("時間をはずした日の今月", () => {
    const r = maya.read(profile, toBirthMoment(profile), { year: 2026, month: 7, day: 25 });
    expect(r.periods.month.headline).toEqual({ text: "時間をはずした日", ref: { system: "maya", id: moonId(0) } });
  });
});
