// src/lib/fortune/astro/calendar-period.ts
import { addDays, formatSlash, type LocalDate } from "../local-date";
import { dayCycleIndex, monthCycleIndex, yearCycleIndex } from "../sexagenary";
import { jstLocalDate, tokyoToUtc } from "../tokyo-time";
import type { Period } from "../types";
import { solarLongitudeTime, solarMonthAt } from "./solar-terms";

export interface CalendarPeriod {
  /** 立春で区切った年 */
  solarYear: number;
  /** 節月(0 = 寅月 … 11 = 丑月) */
  solarMonthIndex: number;
  /** その期間の干支の番号(年柱・月柱・日柱と同じ数え方) */
  cycleIndex: number;
  /** 例: 2026/2/4〜2027/2/3 */
  rangeLabel: string;
}

const span = (start: Date, end: Date) =>
  `${formatSlash(jstLocalDate(start))}〜${formatSlash(addDays(jstLocalDate(end), -1))}`;

/**
 * 今日を含む年(立春)・月(節入り)・日の期間。
 * 暦の慣習どおり節入り・立春の当日は新しい月・年に含めるため、今日の終わり(23:59)で判定する(設計書 §3.1)
 */
export function calendarPeriod(period: Period, today: LocalDate): CalendarPeriod {
  const endOfToday = tokyoToUtc(today.year, today.month, today.day, 23, 59);
  const month = solarMonthAt(endOfToday);
  const ky = month.kyuseiYear;
  const base = { solarYear: ky, solarMonthIndex: month.index };
  if (period === "year") {
    return {
      ...base,
      cycleIndex: yearCycleIndex(ky),
      rangeLabel: span(solarLongitudeTime(ky, 315), solarLongitudeTime(ky + 1, 315)),
    };
  }
  if (period === "month") {
    return { ...base, cycleIndex: monthCycleIndex(ky, month.index), rangeLabel: span(month.start, month.end) };
  }
  return { ...base, cycleIndex: dayCycleIndex(today), rangeLabel: formatSlash(today) };
}
