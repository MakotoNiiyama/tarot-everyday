// src/lib/fortune/sexagenary.ts
import { mod, toJdn, type LocalDate } from "./local-date";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** 六十干支の番号(0 = 甲子) */
export function cycleName(index: number): string {
  return `${STEMS[mod(index, 10)]}${BRANCHES[mod(index, 12)]}`;
}

/** その日の干支の番号(日柱は0時切替) */
export function dayCycleIndex(d: LocalDate): number {
  return mod(toJdn(d) + 49, 60);
}

/** 立春で区切った年の十二支の番号(1984 = 子) */
export function yearBranchIndex(kyuseiYear: number): number {
  return mod(kyuseiYear - 4, 12);
}

/** 節月(0 = 寅月)の十二支の番号 */
export function monthBranchIndex(solarMonthIndex: number): number {
  return mod(solarMonthIndex + 2, 12);
}
