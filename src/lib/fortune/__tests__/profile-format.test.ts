// src/lib/fortune/__tests__/profile-format.test.ts
import { describe, it, expect } from "vitest";
import { formatBirthTime, formatGender, formatPrefecture, formatProfileSummary } from "../profile-format";
import type { BirthProfile } from "../types";

const base: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("profile-format", () => {
  it("時刻の表記", () => {
    expect(formatBirthTime({ kind: "unknown" })).toBe("時刻不明");
    expect(formatBirthTime({ kind: "half", half: "am" })).toBe("午前");
    expect(formatBirthTime({ kind: "half", half: "pm" })).toBe("午後");
    expect(formatBirthTime({ kind: "hour", hour: 14 })).toBe("14時台");
    expect(formatBirthTime({ kind: "minute", hour: 14, minute: 35 })).toBe("14:35");
    expect(formatBirthTime({ kind: "minute", hour: 9, minute: 5 })).toBe("9:05");
    expect(formatBirthTime({ kind: "minute", hour: 0, minute: 0 })).toBe("0:00");
  });

  it("出生地と性別の表記", () => {
    expect(formatPrefecture("13")).toBe("東京都");
    expect(formatPrefecture(undefined)).toBe("出生地未入力");
    expect(formatGender("male")).toBe("男性");
    expect(formatGender("female")).toBe("女性");
    expect(formatGender(undefined)).toBe("回答なし");
  });

  it("要約(デザインの表記)", () => {
    expect(formatProfileSummary(base)).toBe("1990/3/29 生 · 14時台 · 東京都");
    expect(formatProfileSummary({ ...base, time: { kind: "minute", hour: 14, minute: 35 } })).toBe("1990/3/29 生 · 14:35 · 東京都");
    expect(formatProfileSummary({ ...base, time: { kind: "unknown" }, prefecture: undefined })).toBe("1990/3/29 生 · 時刻不明");
  });
});
