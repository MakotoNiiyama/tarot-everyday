import { describe, it, expect } from "vitest";
import { formatJaDate, formatJaWeekday, formatEnWeekday } from "../date-format";

describe("date-format", () => {
  const d = new Date(2026, 9, 14); // 2026-10-14(水)

  it("年月日を日本語で表記すること", () => {
    expect(formatJaDate(d)).toBe("2026年10月14日");
  });

  it("曜日を日本語で表記すること", () => {
    expect(formatJaWeekday(d)).toBe("水曜日");
    expect(formatJaWeekday(new Date(2026, 9, 18))).toBe("日曜日");
  });

  it("曜日を英語で表記すること", () => {
    expect(formatEnWeekday(d)).toBe("Wednesday");
  });
});
