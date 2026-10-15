// src/lib/fortune/astro/__tests__/calendar-period.test.ts
import { describe, it, expect } from "vitest";
import { cycleName } from "../../sexagenary";
import { calendarPeriod } from "../calendar-period";

const today = { year: 2026, month: 10, day: 14 };

describe("calendarPeriod", () => {
  it("年は立春から次の立春の前日まで", () => {
    const p = calendarPeriod("year", today);
    expect(p.kyuseiYear).toBe(2026);
    expect(p.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(cycleName(p.cycleIndex)).toBe("丙午");
  });

  it("月は節入り日から次の節入り日の前日まで", () => {
    const p = calendarPeriod("month", today);
    expect(p.solarMonthIndex).toBe(8);
    expect(p.rangeLabel).toBe("2026/10/8〜2026/11/6");
    expect(cycleName(p.cycleIndex)).toBe("戊戌");
  });

  it("日はその日", () => {
    const p = calendarPeriod("day", today);
    expect(p.rangeLabel).toBe("2026/10/14");
    expect(cycleName(p.cycleIndex)).toBe("辛酉");
  });

  it("節入り日の当日は、節入りの時刻より前でも新しい月に含めること", () => {
    // 寒露 2026/10/8 の当日
    const p = calendarPeriod("month", { year: 2026, month: 10, day: 8 });
    expect(p.rangeLabel).toBe("2026/10/8〜2026/11/6");
    expect(cycleName(p.cycleIndex)).toBe("戊戌");
  });
});
