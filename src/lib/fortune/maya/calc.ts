// src/lib/fortune/maya/calc.ts
import { addDays, compareLocalDate, isLeapYear, mod, toJdn, type LocalDate } from "../local-date";

/** 13の月の暦(ドリームスペル)の紋章。1 = 赤い竜 … 20 = 黄色い太陽 */
export const SEAL_NAMES = [
  "赤い竜", "白い風", "青い夜", "黄色い種", "赤い蛇", "白い世界の橋渡し", "青い手", "黄色い星", "赤い月", "白い犬",
  "青い猿", "黄色い人", "赤い空歩く人", "白い魔法使い", "青い鷲", "黄色い戦士", "赤い地球", "白い鏡", "青い嵐", "黄色い太陽",
] as const;

/** 銀河の音 1〜13 */
export const TONE_NAMES = [
  "磁気", "月", "電気", "自己存在", "倍音", "律動", "共振", "銀河", "太陽", "惑星", "スペクトル", "水晶", "宇宙",
] as const;

/** 13の月の名前(第1の月 … 第13の月) */
export const MOON_NAMES = [
  "磁気の月", "月の月", "電気の月", "自己存在の月", "倍音の月", "律動の月", "共振の月",
  "銀河の月", "太陽の月", "惑星の月", "スペクトルの月", "水晶の月", "宇宙の月",
] as const;

const REFERENCE: LocalDate = { year: 1987, month: 7, day: 26 };
const REFERENCE_KIN = 34;

const isFeb29 = (d: LocalDate) => d.month === 2 && d.day === 29;
const withoutFeb29 = (d: LocalDate): LocalDate => (isFeb29(d) ? { ...d, day: 28 } : d);

/** ユリウス日 lo より後、hi 以下にある2月29日の数 */
function feb29Between(lo: number, hi: number, fromYear: number, toYear: number): number {
  let count = 0;
  for (let y = fromYear; y <= toYear; y++) {
    if (!isLeapYear(y)) continue;
    const j = toJdn({ year: y, month: 2, day: 29 });
    if (j > lo && j <= hi) count++;
  }
  return count;
}

/** 2月29日を数えない日数差(to − from) */
export function daysWithoutLeapDay(from: LocalDate, to: LocalDate): number {
  const a = toJdn(from);
  const b = toJdn(to);
  if (b >= a) return b - a - feb29Between(a, b, from.year, to.year);
  return -(a - b - feb29Between(b, a, to.year, from.year));
}

export function kinOf(d: LocalDate): number {
  return mod(REFERENCE_KIN - 1 + daysWithoutLeapDay(REFERENCE, withoutFeb29(d)), 260) + 1;
}

export function sealOf(kin: number): number {
  return mod(kin - 1, 20) + 1;
}

export function toneOf(kin: number): number {
  return mod(kin - 1, 13) + 1;
}

/** 紋章と音から KIN を求める(中国剰余定理を総当たりで) */
export function kinFrom(seal: number, tone: number): number {
  for (let kin = 1; kin <= 260; kin++) {
    if (sealOf(kin) === seal && toneOf(kin) === tone) return kin;
  }
  throw new Error(`KIN が見つかりません: seal=${seal}, tone=${tone}`);
}

/** ウェイブスペル(音1の KIN)の紋章 */
export function wavespellSeal(kin: number): number {
  return sealOf(mod(kin - toneOf(kin), 260) + 1);
}

/** ガイドKIN: 音ごとに紋章をずらす(音1・6・11は同じ紋章) */
export function guideKin(kin: number): number {
  const offsets = [8, 0, 12, 4, 16]; // tone % 5 = 0,1,2,3,4
  const seal = mod(sealOf(kin) - 1 + offsets[toneOf(kin) % 5], 20) + 1;
  return kinFrom(seal, toneOf(kin));
}

/** 類似KIN: 紋章番号の和が19(または39)になる紋章・同じ音 */
export function analogKin(kin: number): number {
  return kinFrom(mod(19 - sealOf(kin), 20) || 20, toneOf(kin));
}

/** 反対KIN: 紋章を10ずらす・同じ音 */
export function antipodeKin(kin: number): number {
  return kinFrom(mod(sealOf(kin) - 1 + 10, 20) + 1, toneOf(kin));
}

/** 神秘KIN: 261 − KIN */
export function occultKin(kin: number): number {
  return 261 - kin;
}

/** d を含む13の月の暦の年の始まり(7月26日) */
function moonYearStart(d: LocalDate): LocalDate {
  const afterStart = d.month > 7 || (d.month === 7 && d.day >= 26);
  return { year: afterStart ? d.year : d.year - 1, month: 7, day: 26 };
}

/** 2月29日を数えずに days 日進める(days ≥ 0。2月29日には止まらない) */
function addDaysWithoutLeapDay(d: LocalDate, days: number): LocalDate {
  let result = d;
  for (let i = 0; i < days; i++) {
    result = addDays(result, 1);
    if (isFeb29(result)) result = addDays(result, 1);
  }
  return result;
}

/** 13の月の暦での位置。7月25日(時間をはずした日)は moon/day が null */
export function thirteenMoon(d: LocalDate): { moon: number | null; day: number | null } {
  const dayOfYear = daysWithoutLeapDay(moonYearStart(d), withoutFeb29(d));
  if (dayOfYear >= 364) return { moon: null, day: null };
  return { moon: Math.floor(dayOfYear / 28) + 1, day: (dayOfYear % 28) + 1 };
}

/**
 * today を含む13の月の暦の月の期間(両端を含む)。1つの月は2月29日を数えずに28日。
 * 2月29日を含む月は終わりが暦の上で1日後ろにずれる。時間をはずした日はその日だけ。
 */
export function moonDateRange(today: LocalDate): { moon: number | null; start: LocalDate; end: LocalDate } {
  const { moon } = thirteenMoon(today);
  if (moon === null) return { moon, start: today, end: today };
  const start = addDaysWithoutLeapDay(moonYearStart(today), (moon - 1) * 28);
  return { moon, start, end: addDaysWithoutLeapDay(start, 27) };
}

/** today 以前で直近の誕生日(2月29日生まれは平年は2月28日) */
export function lastBirthday(birth: { month: number; day: number }, today: LocalDate): LocalDate {
  const on = (year: number): LocalDate =>
    birth.month === 2 && birth.day === 29 && !isLeapYear(year) ? { year, month: 2, day: 28 } : { year, month: birth.month, day: birth.day };
  const thisYear = on(today.year);
  return compareLocalDate(thisYear, today) <= 0 ? thisYear : on(today.year - 1);
}
