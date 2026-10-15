// src/lib/fortune/astro/solar-terms.ts
import { SearchSunLongitude } from "astronomy-engine";
import { toJdn } from "../local-date";
import { jstLocalDate, tokyoParts } from "../tokyo-time";
import type { TimeRange } from "../types";

const cache = new Map<string, number>();

/** その年(UTC の1月1日から1年以内)に太陽黄経が longitude 度になる瞬間 */
export function solarLongitudeTime(year: number, longitude: number): Date {
  const key = `${year}:${longitude}`;
  const cached = cache.get(key);
  if (cached !== undefined) return new Date(cached);
  const found = SearchSunLongitude(longitude, new Date(Date.UTC(year, 0, 1)), 366);
  if (!found) throw new Error(`太陽黄経 ${longitude}° の時刻が ${year} 年に見つかりません`);
  cache.set(key, found.date.getTime());
  return found.date;
}

/** 節月の始まり(節入り)の太陽黄経。index 0 = 寅月(立春) … 11 = 丑月(小寒) */
export const JIE_LONGITUDES = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285] as const;

export const SOLAR_MONTH_BRANCH_NAMES = [
  "寅月", "卯月", "辰月", "巳月", "午月", "未月", "申月", "酉月", "戌月", "亥月", "子月", "丑月",
] as const;

/** 九星の年(立春始まり)Y の、index 番目の節月の開始時刻 */
function monthStart(kyuseiYear: number, index: number): Date {
  return index < 11
    ? solarLongitudeTime(kyuseiYear, JIE_LONGITUDES[index])
    : solarLongitudeTime(kyuseiYear + 1, JIE_LONGITUDES[11]);
}

export interface SolarMonth {
  /** 立春で区切った年 */
  kyuseiYear: number;
  /** 0 = 寅月 … 11 = 丑月 */
  index: number;
  start: Date;
  end: Date;
}

export function solarMonthAt(at: Date): SolarMonth {
  const t = at.getTime();
  const year = tokyoParts(at).year;
  for (const ky of [year, year - 1]) {
    for (let i = 11; i >= 0; i--) {
      const start = monthStart(ky, i);
      if (start.getTime() <= t) {
        const end = i === 11 ? monthStart(ky + 1, 0) : monthStart(ky, i + 1);
        return { kyuseiYear: ky, index: i, start, end };
      }
    }
  }
  throw new Error("節月を特定できません");
}

/** 範囲の内側(両端を含まない)にある節入り時刻 */
export function jieBoundariesWithin(range: TimeRange): Date[] {
  const year = tokyoParts(range.start).year;
  const result: Date[] = [];
  for (const ky of [year - 1, year]) {
    for (let i = 0; i < 12; i++) {
      const t = monthStart(ky, i);
      if (t > range.start && t < range.end) result.push(t);
    }
  }
  return result.sort((a, b) => a.getTime() - b.getTime());
}

/** その瞬間が、属する節月の何日目か(節入り日を1日目とする日付で数える。蔵干・二十八元の選択に使う) */
export function dayNumberInSolarMonth(at: Date): number {
  const month = solarMonthAt(at);
  return toJdn(jstLocalDate(at)) - toJdn(jstLocalDate(month.start)) + 1;
}
