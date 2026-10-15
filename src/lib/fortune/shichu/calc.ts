// src/lib/fortune/shichu/calc.ts
import { dayNumberInSolarMonth, solarMonthAt } from "../astro/solar-terms";
import type { LocalDate } from "../local-date";
import {
  branchElement,
  branchOf,
  dayCycleIndex,
  hiddenStemOn,
  hourBranchIndex,
  hourCycleIndex,
  monthCycleIndex,
  stemElement,
  stemOf,
  yearCycleIndex,
  type HiddenStemTable,
} from "../sexagenary";
import type { TimeRange } from "../types";

/**
 * 月律分野蔵干。十二支ごとに [十干, その蔵干が受け持つ最後の日(節入り日を1日目)] を余気・中気・本気の順に並べる。
 * 日本で最も一般的な表(『星平会海』『淵海子平』系)。申の余気は戊とする
 */
const ZOKAN: HiddenStemTable = [
  [[8, 10], [9, Infinity]], // 子 壬10・癸
  [[9, 9], [7, 12], [5, Infinity]], // 丑 癸9・辛3・己
  [[4, 7], [2, 14], [0, Infinity]], // 寅 戊7・丙7・甲
  [[0, 10], [1, Infinity]], // 卯 甲10・乙
  [[1, 9], [9, 12], [4, Infinity]], // 辰 乙9・癸3・戊
  [[4, 5], [6, 14], [2, Infinity]], // 巳 戊5・庚9・丙
  [[2, 10], [5, 19], [3, Infinity]], // 午 丙10・己9・丁
  [[3, 9], [1, 12], [5, Infinity]], // 未 丁9・乙3・己
  [[4, 10], [8, 13], [6, Infinity]], // 申 戊10・壬3・庚
  [[6, 10], [7, Infinity]], // 酉 庚10・辛
  [[7, 9], [3, 12], [4, Infinity]], // 戌 辛9・丁3・戊
  [[4, 7], [0, 12], [8, Infinity]], // 亥 戊7・甲5・壬
];

/** 十二支の蔵干(節入り日を1日目とする日数で1つに絞る) */
export function zokan(branch: number, dayNumber: number): number {
  return hiddenStemOn(ZOKAN, branch, dayNumber);
}

export interface ShichuNatal {
  /** 六十干支の番号(0 = 甲子) */
  year: number;
  month: number;
  day: number;
  /** 時刻を指定していないときは null */
  hour: number | null;
  /** 生まれ月の節入り日を1日目とする日数(蔵干の選択に使う) */
  dayNumber: number;
}

/** 地方平均時(UTC + 経度/15 時間)の壁時計。getUTC* で読む */
export function localMeanTime(at: Date, lon: number): Date {
  return new Date(at.getTime() + lon * 4 * 60_000);
}

export interface ShichuOptions {
  /** 出生地の経度(未入力なら明石 135.0) */
  lon: number;
  /** 出生時刻を「時刻を指定」で入力したか。false なら時柱を出さず、日柱は localDate で出す */
  hourKnown: boolean;
  /** 日本時間の生年月日 */
  localDate: LocalDate;
}

/**
 * その瞬間に生まれたときの命式。年柱は立春、月柱は節入り(どちらも瞬間で判定)。
 * 時刻を指定したときは地方平均時で日柱(0時切替)と時柱を出し、23時台は時柱だけ翌日の子の刻にする
 */
export function shichuNatalAt(at: Date, options: ShichuOptions): ShichuNatal {
  const month = solarMonthAt(at);
  const base = {
    year: yearCycleIndex(month.kyuseiYear),
    month: monthCycleIndex(month.kyuseiYear, month.index),
    dayNumber: dayNumberInSolarMonth(at),
  };
  if (!options.hourKnown) return { ...base, day: dayCycleIndex(options.localDate), hour: null };
  const lmt = localMeanTime(at, options.lon);
  const day = dayCycleIndex({ year: lmt.getUTCFullYear(), month: lmt.getUTCMonth() + 1, day: lmt.getUTCDate() });
  const h = lmt.getUTCHours();
  const hourDayStem = stemOf(h === 23 ? day + 1 : day);
  return { ...base, day, hour: hourCycleIndex(hourDayStem, hourBranchIndex(h)) };
}

export function sameShichuNatal(a: ShichuNatal, b: ShichuNatal): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.dayNumber === b.dayNumber;
}

/** 時柱の境目(地方平均時の奇数時ちょうど)と日付の境目(地方平均時の0時)のうち、範囲の内側にあるもの */
export function hourBoundariesWithin(range: TimeRange, lon: number): Date[] {
  const offset = lon * 4 * 60_000;
  const hourMs = 3_600_000;
  const result: Date[] = [];
  for (let t = Math.ceil((range.start.getTime() + offset) / hourMs) * hourMs; t - offset < range.end.getTime(); t += hourMs) {
    const h = new Date(t).getUTCHours();
    const at = new Date(t - offset);
    if ((h % 2 === 1 || h === 0) && at > range.start && at < range.end) result.push(at);
  }
  return result;
}

/** 五行の数(0 = 木 … 4 = 水)。天干と地支を数え、時柱がなければ3柱で数える */
export function elementCounts(n: ShichuNatal): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const c of [n.year, n.month, n.day, n.hour]) {
    if (c === null) continue;
    counts[stemElement(stemOf(c))]++;
    counts[branchElement(branchOf(c))]++;
  }
  return counts;
}
