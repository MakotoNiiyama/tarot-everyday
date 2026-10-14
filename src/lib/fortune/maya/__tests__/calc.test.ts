// src/lib/fortune/maya/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import {
  SEAL_NAMES,
  analogKin,
  antipodeKin,
  guideKin,
  kinOf,
  lastBirthday,
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
