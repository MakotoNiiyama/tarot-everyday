import { describe, it, expect } from "vitest";
import { EclipticGeoMoon } from "astronomy-engine";
import { toBirthMoment } from "../../birth-moment";
import { ELEMENT_IDS } from "../../element-ids";
import { tokyoToUtc } from "../../tokyo-time";
import type { BirthProfile } from "../../types";
import { horoscope, signChangesWithin } from "../index";
import { SIGNS, signOf } from "../zodiac";

const today = { year: 2026, month: 10, day: 14 };
const tokyo14: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };
const read = (p: BirthProfile, t = today) => horoscope.read(p, toBirthMoment(p), t);
const fact = (r: ReturnType<typeof read>, key: string) => r.natal.find((f) => f.key === key);

describe("horoscope.read 人物像", () => {
  it("太陽・月・ASC を最初の3つにすること", () => {
    const r = read(tokyo14);
    expect(r.id).toBe("horoscope");
    expect(r.natal.slice(0, 3).map((f) => [f.key, f.label, f.value])).toEqual([
      ["sun", "太陽星座", "牡羊座"],
      ["moon", "月星座", "牡牛座"],
      // ASC は 14:50 ごろ獅子座から乙女座へ移るので、14時台の生まれは候補になる
      ["asc", "ASC", "獅子座(〜14:50) / 乙女座(14:50〜)"],
    ]);
    expect(fact(r, "asc")?.candidates?.map((c) => c.value)).toEqual(["獅子座", "乙女座"]);
    expect(fact(r, "sun")?.refs).toEqual([
      { system: "horoscope", id: "sign-aries" },
      { system: "horoscope", id: "body-sun" },
    ]);
    expect(fact(r, "asc")?.refs).toEqual([
      { system: "horoscope", id: "sign-leo" },
      { system: "horoscope", id: "sign-virgo" },
    ]);
    expect(fact(r, "pluto")?.value).toBe("蠍座");
    expect(r.ambiguous).toBe(true);
    // 13時台は1時間を通して獅子座
    const r13 = read({ ...tokyo14, time: { kind: "hour", hour: 13 } });
    expect(fact(r13, "asc")?.value).toBe("獅子座");
    expect(r13.ambiguous).toBe(false);
  });

  it("人物像と運勢の参照 id は早見表の項目にあること", () => {
    const r = read(tokyo14);
    const refs = [
      ...r.natal.flatMap((f) => f.refs),
      ...Object.values(r.periods).flatMap((p) => [p.headline.ref, ...p.chips.flatMap((c) => c.refs)]),
    ];
    for (const ref of refs) expect(ELEMENT_IDS.horoscope).toContain(ref.id);
  });

  it("天体の位置の要約(Placidus のハウス)", () => {
    // 代表の時刻は 14:30 なので、太陽・月の度数は 14:00 の値より少し進む
    expect(fact(read(tokyo14), "positions")?.value).toMatch(/^太陽 牡羊座8°\d\d′\(第8ハウス\)、月 牡牛座1\d°\d\d′\(第9ハウス\)、/);
    expect(fact(read(tokyo14), "positions")?.value).toMatch(/、ASC 獅子座\d+°\d\d′、MC 牡牛座\d+°\d\d′$/);
  });

  it("主なアスペクトの要約にマイナーを含めないこと", () => {
    const value = fact(read(tokyo14), "aspects")!.value;
    expect(value).toMatch(/^[^、]+-[^、]+ [^、(]+\(\d+\.\d°\)/);
    expect(value).not.toMatch(/セミ|クインタイル|セスキ/);
  });

  it("チャートを返すこと", () => {
    const r = read(tokyo14);
    if (r.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(r.chart.bodies.map((b) => b.key)).toHaveLength(13);
    expect(Object.keys(r.chart.cusps)).toEqual(["placidus", "koch", "whole"]);
    expect(r.chart.cusps.whole[0]).toBe(120);
    expect(r.chart.notes).toEqual([]);
    expect(r.chart.factKeys).toContain("positions");
    expect(r.chart.factKeys).not.toContain("sun");
    expect(r.chart.aspects.length).toBeGreaterThan(0);
    expect(r.chart.bodies[0].houses.placidus).toBe(8);
    for (const key of r.chart.factKeys) expect(r.natal.map((f) => f.key)).toContain(key);
  });

  it("時刻不明は正午で仮計算し、出生地未入力は明石基準と注記すること", () => {
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } });
    if (r.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(r.chart.notes).toEqual(["出生時刻不明のため正午で仮計算", "出生地未入力のため明石基準"]);
    expect(fact(r, "asc")?.candidates).toBeUndefined();
  });

  it("午前・午後は 6時・18時で仮計算すること", () => {
    const r = read({ ...tokyo14, time: { kind: "half", half: "pm" } });
    if (r.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(r.chart.notes).toEqual(["出生時刻が午後のため18時で仮計算"]);
    const am = read({ ...tokyo14, time: { kind: "half", half: "am" } });
    if (am.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(am.chart.notes).toEqual(["出生時刻が午前のため6時で仮計算"]);
  });

  it("その日のうちに月の星座が変わるなら、時刻不明では月星座を候補にすること", () => {
    // 1990/3/30 は月が牡牛座から双子座へ移る日(19時台)
    const at = (h: number) => signOf(EclipticGeoMoon(tokyoToUtc(1990, 3, 30, h, 0)).lon);
    expect(at(0)).not.toBe(at(23));
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 30 }, time: { kind: "unknown" } });
    expect(fact(r, "moon")?.candidates?.map((c) => c.value)).toEqual([SIGNS[at(0)].name, SIGNS[at(23)].name]);
    expect(r.ambiguous).toBe(true);
  });

  it("時刻を指定してその1時間で ASC の星座が変わるなら ASC を候補にすること", () => {
    // 1990/3/29 の東京で ASC が獅子座から乙女座へ移る時を探す
    const hours = Array.from({ length: 24 }, (_, hour) => hour);
    const results = hours.map((hour) => fact(read({ ...tokyo14, time: { kind: "hour", hour } }), "asc")!);
    const split = results.filter((f) => f.candidates);
    expect(split.length).toBeGreaterThan(0);
    for (const f of split) expect(f.candidates!.length).toBeLessThanOrEqual(2);
  });

  it("1回の読み取りは 50ms 以内", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 30 }, time: { kind: "unknown" } };
    read(p);
    const start = performance.now();
    read(p);
    expect(performance.now() - start).toBeLessThan(50);
  });
});

describe("horoscope.read 運勢", () => {
  it("今日は正午の月の星座とハウス", () => {
    const day = read(tokyo14).periods.day;
    const sign = SIGNS[signOf(EclipticGeoMoon(tokyoToUtc(2026, 10, 14, 12, 0)).lon)].name;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline.text).toMatch(new RegExp(`^今日の月は${sign}。あなたの第\\d+ハウスを通過$`));
    expect(day.chips.map((c) => c.key)).toEqual(["moon-sign", "moon-house"]);
  });

  it("その日のうちに月の星座が変わる日は、今日の月を「A→B(時刻〜)」にすること", () => {
    const signAt = (h: number) => signOf(EclipticGeoMoon(tokyoToUtc(1990, 3, 30, h, 0)).lon);
    const day = read(tokyo14, { year: 1990, month: 3, day: 30 }).periods.day;
    expect(day.chips[0].value).toMatch(new RegExp(`^${SIGNS[signAt(0)].name}→${SIGNS[signAt(23)].name}\\(19:\\d\\d〜\\)$`));
  });

  it("今月は新月・満月と火星", () => {
    const month = read(tokyo14).periods.month;
    expect(month.rangeLabel).toBe("2026/10/1〜2026/10/31");
    // 2026年10月の新月は 10/11 0:50(日本時間)、天秤座。満月は 10/26、月は牡牛座
    expect(month.headline.text).toMatch(/^今月の新月は10\/11、天秤座。あなたの第\d+ハウスで迎える$/);
    expect(month.chips.map((c) => c.key)).toEqual(["new-moon", "full-moon", "mars"]);
    expect(month.chips[0].value).toMatch(/^10\/11 天秤座・第\d+ハウス$/);
    expect(month.chips[1].value).toMatch(/^10\/26 牡牛座・第\d+ハウス$/);
  });

  it("今年は木星と土星", () => {
    const year = read(tokyo14).periods.year;
    expect(year.rangeLabel).toBe("2026/1/1〜2026/12/31");
    expect(year.headline.text).toMatch(/^今年の木星はあなたの第\d+ハウスを運行$/);
    expect(year.chips.map((c) => c.key)).toEqual(["jupiter", "saturn"]);
    // 2026年は木星が蟹座から獅子座へ、土星が魚座から牡羊座へ移る年
    expect(year.chips[0].value).toMatch(/^蟹座→獅子座\(6\/30〜\)・第\d+ハウス$/);
    expect(year.chips[1].value).toMatch(/^魚座→牡羊座\(2\/14〜\)・第\d+ハウス$/);
  });
});

describe("signChangesWithin", () => {
  it("星座が変わる時刻を1分の精度で返すこと", () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const end = new Date(Date.UTC(2026, 0, 2));
    // 1日に 30 度ずつ進む仮の天体は、0時から 24時間で 30度を1回またぐ
    const lonAt = (at: Date) => 15 + ((at.getTime() - start.getTime()) / 86_400_000) * 30;
    const [b] = signChangesWithin({ start, end }, lonAt);
    expect(Math.abs(b.getTime() - Date.UTC(2026, 0, 1, 12))).toBeLessThanOrEqual(60_000);
  });

  it("星座が変わらなければ空", () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    expect(signChangesWithin({ start, end: new Date(Date.UTC(2026, 0, 2)) }, () => 10)).toEqual([]);
  });
});
