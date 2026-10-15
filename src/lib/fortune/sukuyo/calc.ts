// src/lib/fortune/sukuyo/calc.ts
import { toLunar } from "../astro/lunar-calendar";
import { mod, type LocalDate } from "../local-date";

/** 27宿(牛宿を除く)。番号 0 = 昴宿 … 26 = 胃宿 */
export const MANSION_NAMES = [
  "昴宿", "畢宿", "觜宿", "参宿", "井宿", "鬼宿", "柳宿", "星宿", "張宿", "翼宿", "軫宿", "角宿", "亢宿", "氐宿",
  "房宿", "心宿", "尾宿", "箕宿", "斗宿", "女宿", "虚宿", "危宿", "室宿", "壁宿", "奎宿", "婁宿", "胃宿",
] as const;

/** 三九の関係。RELATION_KINDS(element-ids.ts)と同じ順 */
export const RELATION_NAMES = ["命", "栄", "衰", "安", "危", "成", "壊", "友", "親", "業", "胎"] as const;

/** 旧暦の各月の1日の宿(1月 = 室宿 … 12月 = 虚宿) */
const MONTH_START = [22, 24, 26, 1, 3, 5, 8, 11, 13, 15, 18, 20] as const;

/** 旧暦の月の宿(その月の1日の宿)。閏月は同じ名前の月と同じ */
export const lunarMonthMansion = (month: number) => MONTH_START[month - 1];

/** 生まれた日(または今日)の宿を求める方式。将来、月の黄経から求める方式に差し替えられるよう関数1つにしておく */
export type MansionMethod = (date: LocalDate) => number;

/** 旧暦の月日から表で引く方式(月の1日の宿から、日ごとに1つ進む) */
export const tableMethod: MansionMethod = (date) => {
  const lunar = toLunar(date);
  return mod(lunarMonthMansion(lunar.month) + lunar.day - 1, 27);
};

/** from の宿から見た to の宿の関係(RELATION_NAMES の番号)。距離は (to − from) mod 27 */
export function relationIndex(from: number, to: number): number {
  const distance = mod(to - from, 27);
  if (distance === 0) return 0;
  if (distance === 9) return 9;
  if (distance === 18) return 10;
  return mod(distance, 9);
}

/** 女宿の番号(年の宿の起点) */
const NYO = 19;

/** 旧暦の年の宿。2011年 = 女宿から1年に1つ進む28年周期で、牛宿に当たる年は斗宿とする */
export function yearMansion(lunarYear: number): number {
  const k = mod(lunarYear - 2011, 28);
  return k === 27 ? NYO - 1 : mod(NYO + k, 27);
}
