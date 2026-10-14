// src/lib/fortune/maya/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import {
  SEAL_NAMES,
  analogKin,
  antipodeKin,
  guideKin,
  kinOf,
  lastBirthday,
  moonDateRange,
  occultKin,
  sealOf,
  thirteenMoon,
  toneOf,
  wavespellSeal,
} from "../calc";

describe("kinOf", () => {
  it.each([
    [{ year: 1987, month: 7, day: 26 }, 34],
    [{ year: 2013, month: 7, day: 26 }, 164],
    [{ year: 2012, month: 12, day: 21 }, 207],
  ])("%o → KIN %i", (d, kin) => {
    expect(kinOf(d)).toBe(kin);
  });

  it("2月29日は2月28日と同じKINで、3月1日は2月28日の翌KIN", () => {
    const feb28 = kinOf({ year: 2024, month: 2, day: 28 });
    expect(kinOf({ year: 2024, month: 2, day: 29 })).toBe(feb28);
    expect(kinOf({ year: 2024, month: 3, day: 1 })).toBe((feb28 % 260) + 1);
  });

  it("基準日より前の日付も計算できること", () => {
    expect(kinOf({ year: 1987, month: 7, day: 25 })).toBe(33);
  });
});

describe("紋章・音・関係のKIN", () => {
  it("KIN 34 は白い魔法使い・音8", () => {
    expect(SEAL_NAMES[sealOf(34) - 1]).toBe("白い魔法使い");
    expect(toneOf(34)).toBe(8);
  });

  it("ウェイブスペルはKIN 27(青い手)から始まる", () => {
    expect(SEAL_NAMES[wavespellSeal(34) - 1]).toBe("青い手");
  });

  it("ガイド・類似・反対・神秘", () => {
    expect(guideKin(34)).toBe(138);
    expect(SEAL_NAMES[sealOf(guideKin(34)) - 1]).toBe("白い鏡");
    expect(SEAL_NAMES[sealOf(analogKin(34)) - 1]).toBe("赤い蛇");
    expect(toneOf(analogKin(34))).toBe(8);
    expect(SEAL_NAMES[sealOf(antipodeKin(34)) - 1]).toBe("黄色い種");
    expect(occultKin(34)).toBe(227);
    expect(occultKin(1)).toBe(260);
    expect(guideKin(1)).toBe(1);
  });
});

describe("thirteenMoon", () => {
  it("7月26日が第1の月1日", () => {
    expect(thirteenMoon({ year: 2026, month: 7, day: 26 })).toEqual({ moon: 1, day: 1 });
  });

  it("2026年10月14日は第3の月", () => {
    expect(thirteenMoon({ year: 2026, month: 10, day: 14 }).moon).toBe(3);
  });

  it("7月25日は時間をはずした日", () => {
    expect(thirteenMoon({ year: 2026, month: 7, day: 25 })).toEqual({ moon: null, day: null });
  });
});

describe("moonDateRange", () => {
  it("2026年10月14日は第3の月(2026/9/20〜2026/10/17)", () => {
    expect(moonDateRange({ year: 2026, month: 10, day: 14 })).toEqual({
      moon: 3,
      start: { year: 2026, month: 9, day: 20 },
      end: { year: 2026, month: 10, day: 17 },
    });
  });

  it("7月26日は第1の月の初日", () => {
    expect(moonDateRange({ year: 2026, month: 7, day: 26 })).toEqual({
      moon: 1,
      start: { year: 2026, month: 7, day: 26 },
      end: { year: 2026, month: 8, day: 22 },
    });
  });

  it("2月29日を含む月は終わりが1日後ろにずれる", () => {
    // 2027/7/26 始まりの年の第8の月。2028/2/29 を数えないので 3/6 まで
    expect(moonDateRange({ year: 2028, month: 2, day: 29 })).toEqual({
      moon: 8,
      start: { year: 2028, month: 2, day: 7 },
      end: { year: 2028, month: 3, day: 6 },
    });
    expect(moonDateRange({ year: 2028, month: 3, day: 7 })).toMatchObject({ moon: 9, start: { year: 2028, month: 3, day: 7 } });
  });

  it("時間をはずした日はその日だけ", () => {
    expect(moonDateRange({ year: 2026, month: 7, day: 25 })).toEqual({
      moon: null,
      start: { year: 2026, month: 7, day: 25 },
      end: { year: 2026, month: 7, day: 25 },
    });
  });
});

describe("lastBirthday", () => {
  it("今年の誕生日を過ぎていれば今年、まだなら去年", () => {
    expect(lastBirthday({ month: 3, day: 29 }, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2026, month: 3, day: 29 });
    expect(lastBirthday({ month: 12, day: 1 }, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2025, month: 12, day: 1 });
  });

  it("2月29日生まれはうるう年以外は2月28日", () => {
    expect(lastBirthday({ month: 2, day: 29 }, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it("生まれ年を含む LocalDate を渡しても生まれ年を使わない", () => {
    // profile.date のように year を持つオブジェクトを渡しても今年/去年の誕生日を返すこと
    const fullDate = { year: 1987, month: 7, day: 26 };
    expect(lastBirthday(fullDate, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2026, month: 7, day: 26 });
    expect(lastBirthday(fullDate, { year: 2026, month: 3, day: 1 })).toEqual({ year: 2025, month: 7, day: 26 });
  });
});
