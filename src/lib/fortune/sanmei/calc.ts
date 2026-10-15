// src/lib/fortune/sanmei/calc.ts
import { dayNumberInSolarMonth, solarMonthAt } from "../astro/solar-terms";
import { mod, type LocalDate } from "../local-date";
import {
  branchOf,
  dayCycleIndex,
  hiddenStemOn,
  monthCycleIndex,
  stemOf,
  tenGodIndex,
  twelveStageIndex,
  yearCycleIndex,
  type HiddenStemTable,
} from "../sexagenary";

/** 十大主星(通変星と同じ順: 比肩=貫索星 … 印綬=玉堂星) */
export const MAIN_STAR_NAMES = [
  "貫索星", "石門星", "鳳閣星", "調舒星", "禄存星", "司禄星", "車騎星", "牽牛星", "龍高星", "玉堂星",
] as const;

/** 十二大従星(十二運と同じ順: 長生=天貴星 … 養=天印星) */
export const SUB_STAR_NAMES = [
  "天貴星", "天恍星", "天南星", "天禄星", "天将星", "天堂星", "天胡星", "天極星", "天庫星", "天馳星", "天報星", "天印星",
] as const;

/** 天中殺(1 = 子丑 … 6 = 戌亥) */
export const TENCHU_NAMES = ["子丑天中殺", "寅卯天中殺", "辰巳天中殺", "午未天中殺", "申酉天中殺", "戌亥天中殺"] as const;

/**
 * 二十八元。十二支ごとに [十干, その蔵干が受け持つ最後の日(節入り日を1日目)] を初元・中元・本元の順に並べる(高尾学館式)
 */
const NIJUHACHIGEN: HiddenStemTable = [
  [[9, Infinity]], // 子 癸
  [[9, 9], [7, 12], [5, Infinity]], // 丑 癸1-9・辛10-12・己
  [[4, 7], [2, 14], [0, Infinity]], // 寅 戊1-7・丙8-14・甲
  [[1, Infinity]], // 卯 乙
  [[1, 9], [9, 12], [4, Infinity]], // 辰 乙1-9・癸10-12・戊
  [[4, 5], [6, 14], [2, Infinity]], // 巳 戊1-5・庚6-14・丙
  [[5, 19], [3, Infinity]], // 午 己1-19・丁
  [[3, 9], [1, 12], [5, Infinity]], // 未 丁1-9・乙10-12・己
  [[4, 10], [8, 13], [6, Infinity]], // 申 戊1-10・壬11-13・庚
  [[7, Infinity]], // 酉 辛
  [[7, 9], [3, 12], [4, Infinity]], // 戌 辛1-9・丁10-12・戊
  [[0, 12], [8, Infinity]], // 亥 甲1-12・壬
];

/** 十二支の蔵干(二十八元を節入り日を1日目とする日数で選ぶ) */
export function nijuhachigen(branch: number, dayNumber: number): number {
  return hiddenStemOn(NIJUHACHIGEN, branch, dayNumber);
}

export interface SanmeiNatal {
  /** 六十干支の番号(0 = 甲子) */
  year: number;
  month: number;
  day: number;
  /** 生まれ月の節入り日を1日目とする日数 */
  dayNumber: number;
}

/** その瞬間に生まれたときの宿命(年・月・日の3柱。時柱は使わない。日柱は dayDate の暦日) */
export function sanmeiNatalAt(at: Date, dayDate: LocalDate): SanmeiNatal {
  const month = solarMonthAt(at);
  return {
    year: yearCycleIndex(month.kyuseiYear),
    month: monthCycleIndex(month.kyuseiYear, month.index),
    day: dayCycleIndex(dayDate),
    dayNumber: dayNumberInSolarMonth(at),
  };
}

export function sameSanmeiNatal(a: SanmeiNatal, b: SanmeiNatal): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.dayNumber === b.dayNumber;
}

/** 人体星図。十大主星は MAIN_STAR_NAMES、十二大従星は SUB_STAR_NAMES の番号 */
export interface BodyStars {
  /** 頭(北)= 日干 × 年干 */
  north: number;
  /** 腹(南)= 日干 × 月干 */
  south: number;
  /** 左手(東)= 日干 × 年支の蔵干 */
  east: number;
  /** 胸(中心星)= 日干 × 月支の蔵干 */
  center: number;
  /** 右手(西)= 日干 × 日支の蔵干 */
  west: number;
  /** 左肩(初年)= 日干 × 年支 */
  early: number;
  /** 左足(中年)= 日干 × 月支 */
  middle: number;
  /** 右足(晩年)= 日干 × 日支 */
  late: number;
}

export function bodyStars(n: SanmeiNatal): BodyStars {
  const d = stemOf(n.day);
  const hidden = (cycle: number) => nijuhachigen(branchOf(cycle), n.dayNumber);
  return {
    north: tenGodIndex(d, stemOf(n.year)),
    south: tenGodIndex(d, stemOf(n.month)),
    east: tenGodIndex(d, hidden(n.year)),
    center: tenGodIndex(d, hidden(n.month)),
    west: tenGodIndex(d, hidden(n.day)),
    early: twelveStageIndex(d, branchOf(n.year)),
    middle: twelveStageIndex(d, branchOf(n.month)),
    late: twelveStageIndex(d, branchOf(n.day)),
  };
}

/** 干支の旬(甲で始まる10日)に欠ける2支が天中殺。number は TENCHU_NAMES の 1 始まりの番号 */
export function tenchuOf(cycle: number): { number: number; branches: [number, number] } {
  const first = mod(Math.floor(mod(cycle, 60) / 10) * 10 + 10, 12);
  return { number: first / 2 + 1, branches: [first, first + 1] };
}
