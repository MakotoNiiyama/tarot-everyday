// src/lib/fortune/__tests__/birth-moment.test.ts
import { describe, it, expect } from "vitest";
import { hourRange, isTimeKnown, knownTime, toBirthMoment } from "../birth-moment";
import { AKASHI, prefectures, findPrefecture } from "../prefectures";
import type { BirthProfile } from "../types";

const base: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };

describe("prefectures", () => {
  it("47都道府県を持ち、コードが一意であること", () => {
    expect(prefectures).toHaveLength(47);
    expect(new Set(prefectures.map((p) => p.code)).size).toBe(47);
  });

  it("コードから引けること", () => {
    expect(findPrefecture("13")?.name).toBe("東京都");
    expect(findPrefecture("99")).toBeUndefined();
  });
});

describe("hourRange", () => {
  it("時刻が不明・午前午後のときの時間の範囲を返すこと", () => {
    expect(hourRange({ kind: "unknown" })).toEqual([0, 24]);
    expect(hourRange({ kind: "half", half: "am" })).toEqual([0, 12]);
    expect(hourRange({ kind: "half", half: "pm" })).toEqual([12, 24]);
  });
});

describe("isTimeKnown・knownTime", () => {
  it("時刻を指定した入力(時台・分)だけを時刻が分かるものとすること", () => {
    expect(isTimeKnown({ kind: "unknown" })).toBe(false);
    expect(isTimeKnown({ kind: "half", half: "pm" })).toBe(false);
    expect(isTimeKnown({ kind: "hour", hour: 14 })).toBe(true);
    expect(isTimeKnown({ kind: "minute", hour: 14, minute: 35 })).toBe(true);
  });

  it("分はそのまま、分不明の時台は30分を計算に使うこと", () => {
    expect(knownTime({ kind: "minute", hour: 14, minute: 35 })).toEqual({ hour: 14, minute: 35 });
    expect(knownTime({ kind: "hour", hour: 14 })).toEqual({ hour: 14, minute: 30 });
  });
});

describe("toBirthMoment", () => {
  it("時刻不明なら日本時間の0時〜24時を範囲にすること", () => {
    const m = toBirthMoment(base);
    expect(m.range.start.toISOString()).toBe("1990-03-28T15:00:00.000Z");
    expect(m.range.end.toISOString()).toBe("1990-03-29T15:00:00.000Z");
    expect(m.localDate).toEqual({ year: 1990, month: 3, day: 29 });
  });

  it("分まで指定したらその1分の範囲にすること", () => {
    const m = toBirthMoment({ ...base, time: { kind: "minute", hour: 14, minute: 35 } });
    expect(m.range.start.toISOString()).toBe("1990-03-29T05:35:00.000Z");
    expect(m.range.end.toISOString()).toBe("1990-03-29T05:36:00.000Z");
  });

  it("分不明の時台はその時の30分の1分にすること", () => {
    const m = toBirthMoment({ ...base, time: { kind: "hour", hour: 14 } });
    expect(m.range.start.toISOString()).toBe("1990-03-29T05:30:00.000Z");
    expect(m.range.end.toISOString()).toBe("1990-03-29T05:31:00.000Z");
  });

  it("サマータイム期間はその時差で変換すること", () => {
    const m = toBirthMoment({ ...base, date: { year: 1949, month: 7, day: 1 }, time: { kind: "minute", hour: 12, minute: 5 } });
    expect(m.range.start.toISOString()).toBe("1949-07-01T02:05:00.000Z");
    const h = toBirthMoment({ ...base, date: { year: 1949, month: 7, day: 1 }, time: { kind: "hour", hour: 12 } });
    expect(h.range.start.toISOString()).toBe("1949-07-01T02:30:00.000Z");
  });

  it("サマータイムの切り替わる夜でも時刻指定の枠は1分にすること", () => {
    const minutes = (date: BirthProfile["date"], time: BirthProfile["time"]) => {
      const m = toBirthMoment({ ...base, date, time });
      return (m.range.end.getTime() - m.range.start.getTime()) / 60_000;
    };
    expect(minutes({ year: 1948, month: 5, day: 1 }, { kind: "hour", hour: 23 })).toBe(1);
    expect(minutes({ year: 1949, month: 9, day: 10 }, { kind: "minute", hour: 23, minute: 59 })).toBe(1);
  });

  it("サマータイム開始の夜に時刻不明でも最後の1時間を落とさないこと", () => {
    const m = toBirthMoment({ ...base, date: { year: 1948, month: 5, day: 1 } });
    expect(m.range.start.toISOString()).toBe("1948-04-30T15:00:00.000Z");
    expect(m.range.end.toISOString()).toBe("1948-05-01T15:00:00.000Z");
  });

  it("出生地未入力なら明石を使い、その旨を持つこと", () => {
    const m = toBirthMoment(base);
    expect(m.location).toEqual({ ...AKASHI, isDefault: true });
  });

  it("出生地があれば県庁所在地の緯度経度を使うこと", () => {
    const m = toBirthMoment({ ...base, prefecture: "13" });
    expect(m.location.label).toBe("東京都");
    expect(m.location.isDefault).toBe(false);
    expect(m.location.lon).toBeCloseTo(139.69, 2);
  });
});
