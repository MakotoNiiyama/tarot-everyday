// src/lib/fortune/numerology/__tests__/numerology.test.ts
import { describe, it, expect } from "vitest";
import { birthdayNumber, lifePath, personalDay, personalMonth, personalYear, reduceNumber } from "../calc";
import { numerology } from "../index";
import { numberId } from "../../element-ids";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";

describe("reduceNumber", () => {
  it("マスターナンバーを残す/残さない", () => {
    expect(reduceNumber(29, true)).toBe(11);
    expect(reduceNumber(29, false)).toBe(2);
    expect(reduceNumber(33, true)).toBe(33);
    expect(reduceNumber(30, true)).toBe(3);
    expect(reduceNumber(9, true)).toBe(9);
  });
});

describe("lifePath(全桁を一度に足す)", () => {
  it.each([
    [{ year: 1990, month: 3, day: 29 }, 33],
    [{ year: 2000, month: 1, day: 1 }, 4],
    [{ year: 1985, month: 11, day: 23 }, 3],
    [{ year: 1992, month: 9, day: 2 }, 5],
    [{ year: 1991, month: 2, day: 7 }, 11],
    [{ year: 2002, month: 9, day: 9 }, 22],
  ])("%o → %i", (date, expected) => {
    expect(lifePath(date)).toBe(expected);
  });
});

describe("バースデー・パーソナルナンバー", () => {
  it("バースデーはマスターナンバーを残す", () => {
    expect(birthdayNumber(29)).toBe(11);
    expect(birthdayNumber(22)).toBe(22);
    expect(birthdayNumber(14)).toBe(5);
    expect(birthdayNumber(31)).toBe(4);
  });

  it("パーソナルイヤー/マンス/デーは1〜9", () => {
    const py = personalYear({ month: 3, day: 29 }, 2026);
    expect(py).toBe(6);
    const pm = personalMonth(py, 10);
    expect(pm).toBe(7);
    expect(personalDay(pm, 14)).toBe(3);
  });

  it("早見表の id", () => {
    expect(numberId(33)).toBe("number-33");
  });
});

describe("numerology.read", () => {
  const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
  const reading = numerology.read(profile, toBirthMoment(profile), { year: 2026, month: 10, day: 14 });

  it("人物像にライフパスとバースデーを返すこと", () => {
    expect(reading.natal).toEqual([
      { label: "ライフパス", value: "33", refs: [{ system: "numerology", id: "number-33" }] },
      { label: "バースデー", value: "11", refs: [{ system: "numerology", id: "number-11" }] },
    ]);
    expect(reading.ambiguous).toBe(false);
  });

  it("期間ごとの範囲と見出し", () => {
    expect(reading.periods.day.rangeLabel).toBe("2026/10/14");
    expect(reading.periods.day.headline).toEqual({ text: "パーソナルデー3", ref: { system: "numerology", id: "number-3" } });
    expect(reading.periods.month.rangeLabel).toBe("2026/10/1〜2026/10/31");
    expect(reading.periods.month.headline.text).toBe("パーソナルマンス7");
    expect(reading.periods.year.rangeLabel).toBe("2026/1/1〜2026/12/31");
    expect(reading.periods.year.headline.text).toBe("パーソナルイヤー6");
  });
});
