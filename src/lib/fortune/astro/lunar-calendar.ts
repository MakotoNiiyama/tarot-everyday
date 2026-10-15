// src/lib/fortune/astro/lunar-calendar.ts
import { SearchMoonPhase } from "astronomy-engine";
import { fromJdn, toJdn, type LocalDate } from "../local-date";
import { standardDate } from "../tokyo-time";
import { solarLongitudeTime } from "./solar-terms";

/** 旧暦の年月日。year は旧正月で切り替わる年 */
export interface LunarDate {
  year: number;
  month: number;
  leap: boolean;
  day: number;
}

interface LunarMonth {
  /** 1日のユリウス日 */
  start: number;
  month: number;
  leap: boolean;
}

/** 標準時(UTC+9)の日付のユリウス日 */
const jdnOf = (at: Date) => toJdn(standardDate(at));

/** ユリウス日 jdn の日本時間0時 */
const instantOf = (jdn: number) => new Date((jdn - 2440588) * 86_400_000 - 9 * 3_600_000);

/** jdn より後(翌日以降)で最初の朔の日 */
function nextNewMoon(jdn: number): number {
  const found = SearchMoonPhase(0, instantOf(jdn + 1), 40);
  if (!found) throw new Error("朔が見つかりません");
  return jdnOf(found.date);
}

/** jdn 以前で最後の朔の日 */
function newMoonOnOrBefore(jdn: number): number {
  let last = nextNewMoon(jdn - 32);
  for (let next = nextNewMoon(last); next <= jdn; next = nextNewMoon(next)) last = next;
  return last;
}

/** 西暦 year の冬至を含む旧暦月(11月)の1日 */
const winterMonthStart = (year: number) => newMoonOnOrBefore(jdnOf(solarLongitudeTime(year, 270)));

/** [a, b) の日付に中気(太陽黄経が30度の倍数になる日)があるか */
function hasChuki(a: number, b: number, years: number[]): boolean {
  return years.some((y) =>
    Array.from({ length: 12 }, (_, k) => jdnOf(solarLongitudeTime(y, k * 30))).some((c) => c >= a && c < b),
  );
}

const cache = new Map<number, LunarMonth[]>();

/**
 * 西暦 year の冬至を含む月(11月)から、次の冬至を含む月の前までの旧暦月。
 * 朔が13回あるときは、11月の次から数えて最初に中気を含まない月を閏月にする(2033年は閏11月案と一致する)
 */
function monthsFromWinter(year: number): LunarMonth[] {
  const cached = cache.get(year);
  if (cached) return cached;
  const end = winterMonthStart(year + 1);
  const starts = [winterMonthStart(year)];
  for (let n = nextNewMoon(starts[0]); n < end; n = nextNewMoon(n)) starts.push(n);
  const edges = [...starts, end];
  const hasLeap = starts.length === 13;
  const months: LunarMonth[] = [];
  let month = 10;
  let leapUsed = false;
  for (let i = 0; i < starts.length; i++) {
    if (hasLeap && !leapUsed && i > 0 && !hasChuki(edges[i], edges[i + 1], [year, year + 1])) {
      months.push({ start: starts[i], month, leap: true });
      leapUsed = true;
      continue;
    }
    month = (month % 12) + 1;
    months.push({ start: starts[i], month, leap: false });
  }
  cache.set(year, months);
  return months;
}

/** jdn を含む旧暦月と、その次の月の1日 */
function monthAt(jdn: number): { month: LunarMonth; nextStart: number } {
  const date = fromJdn(jdn);
  const year = winterMonthStart(date.year) <= jdn ? date.year : date.year - 1;
  const months = monthsFromWinter(year);
  const i = months.findLastIndex((m) => m.start <= jdn);
  const nextStart = i + 1 < months.length ? months[i + 1].start : winterMonthStart(year + 1);
  return { month: months[i], nextStart };
}

/** 旧正月(旧暦の年 year の1月1日) */
export function lunarNewYear(year: number): LocalDate {
  const first = monthsFromWinter(year - 1).find((m) => m.month === 1 && !m.leap);
  if (!first) throw new Error(`${year}年の旧正月が見つかりません`);
  return fromJdn(first.start);
}

/** 旧正月で区切った年 */
export function lunarYearOf(d: LocalDate): number {
  return toJdn(d) >= toJdn(lunarNewYear(d.year)) ? d.year : d.year - 1;
}

export function toLunar(d: LocalDate): LunarDate {
  const jdn = toJdn(d);
  const { month } = monthAt(jdn);
  return { year: lunarYearOf(d), month: month.month, leap: month.leap, day: jdn - month.start + 1 };
}

/** その日を含む旧暦月の1日〜末日 */
export function lunarMonthSpan(d: LocalDate): { start: LocalDate; end: LocalDate } {
  const { month, nextStart } = monthAt(toJdn(d));
  return { start: fromJdn(month.start), end: fromJdn(nextStart - 1) };
}
