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

/** 五行の名前(0 = 木, 1 = 火, 2 = 土, 3 = 金, 4 = 水) */
export const ELEMENT_NAMES = ["木", "火", "土", "金", "水"] as const;

/** 通変星(日干から見た十干の関係)。0 = 比肩 … 9 = 印綬 */
export const TEN_GOD_NAMES = ["比肩", "劫財", "食神", "傷官", "偏財", "正財", "偏官", "正官", "偏印", "印綬"] as const;

/** 十二運。0 = 長生 … 11 = 養 */
export const TWELVE_STAGE_NAMES = ["長生", "沐浴", "冠帯", "建禄", "帝旺", "衰", "病", "死", "墓", "絶", "胎", "養"] as const;

const BRANCH_ELEMENTS = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] as const;

/** 十干(0 = 甲 … 9 = 癸)の五行 */
export const stemElement = (stem: number) => Math.floor(mod(stem, 10) / 2);
/** 十二支(0 = 子 … 11 = 亥)の五行 */
export const branchElement = (branch: number) => BRANCH_ELEMENTS[mod(branch, 12)];
export const isYangStem = (stem: number) => mod(stem, 2) === 0;

/** 六十干支の番号の十干・十二支 */
export const stemOf = (cycle: number) => mod(cycle, 10);
export const branchOf = (cycle: number) => mod(cycle, 12);

/** 十干と十二支から六十干支の番号(陰陽が合わない組み合わせはない) */
export function cycleIndexOf(stem: number, branch: number): number {
  const n = mod(6 * stem - 5 * branch, 60);
  if (stemOf(n) !== mod(stem, 10) || branchOf(n) !== mod(branch, 12)) {
    throw new Error(`${STEMS[mod(stem, 10)]}${BRANCHES[mod(branch, 12)]} は六十干支にありません`);
  }
  return n;
}

/** 立春で区切った年の干支の番号(1984 = 甲子) */
export const yearCycleIndex = (kyuseiYear: number) => mod(kyuseiYear - 4, 60);

/** 節月(0 = 寅月)の干支の番号。月の十干は年の十干から決まる(甲己の年は丙寅から) */
export function monthCycleIndex(kyuseiYear: number, solarMonthIndex: number): number {
  const stem = mod(2 * stemOf(yearCycleIndex(kyuseiYear)) + 2 + solarMonthIndex, 10);
  return cycleIndexOf(stem, monthBranchIndex(solarMonthIndex));
}

/** 時(0〜23)の十二支。23時と0時は子 */
export const hourBranchIndex = (hour: number) => Math.floor((hour + 1) / 2) % 12;

/** 時柱の干支の番号。時の十干は日の十干から決まる(甲己の日は甲子から) */
export function hourCycleIndex(dayStem: number, hourBranch: number): number {
  return cycleIndexOf(mod(2 * dayStem + hourBranch, 10), hourBranch);
}

/** 日干から見た十干 other の通変星(TEN_GOD_NAMES の番号) */
export function tenGodIndex(dayStem: number, other: number): number {
  const relation = mod(stemElement(other) - stemElement(dayStem), 5); // 0 同じ / 1 日干が生む / 2 日干が剋す / 3 日干を剋す / 4 日干を生む
  return relation * 2 + (isYangStem(other) === isYangStem(dayStem) ? 0 : 1);
}

/** 十干の長生の十二支(土は火と同じ) */
const CHOSEI_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] as const;

/** 日干から見た十二支の十二運(TWELVE_STAGE_NAMES の番号)。陽干は順行、陰干は逆行 */
export function twelveStageIndex(dayStem: number, branch: number): number {
  const start = CHOSEI_BRANCH[mod(dayStem, 10)];
  return isYangStem(dayStem) ? mod(branch - start, 12) : mod(start - branch, 12);
}
