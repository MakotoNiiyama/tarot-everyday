// src/lib/fortune/numerology/calc.ts
import type { LocalDate } from "../local-date";

const MASTER_NUMBERS = new Set([11, 22, 33]);

function digitSum(n: number): number {
  return String(Math.abs(n))
    .split("")
    .reduce((sum, c) => sum + Number(c), 0);
}

/** 1桁になるまで各桁を足す。keepMaster なら 11・22・33 で止める */
export function reduceNumber(n: number, keepMaster: boolean): number {
  let v = n;
  while (v > 9 && !(keepMaster && MASTER_NUMBERS.has(v))) v = digitSum(v);
  return v;
}

/** ライフパスナンバー(生年月日の全桁を一度に足す) */
export function lifePath(d: LocalDate): number {
  const digits = `${d.year}${String(d.month).padStart(2, "0")}${String(d.day).padStart(2, "0")}`;
  return reduceNumber(digitSum(Number(digits)), true);
}

/** バースデーナンバー(生まれた日) */
export function birthdayNumber(day: number): number {
  return reduceNumber(day, true);
}

/** パーソナルイヤー(誕生月日 + 対象年の各桁) */
export function personalYear(birth: { month: number; day: number }, year: number): number {
  return reduceNumber(digitSum(birth.month) + digitSum(birth.day) + digitSum(year), false);
}

export function personalMonth(personalYearNumber: number, month: number): number {
  return reduceNumber(personalYearNumber + month, false);
}

export function personalDay(personalMonthNumber: number, day: number): number {
  return reduceNumber(personalMonthNumber + day, false);
}
