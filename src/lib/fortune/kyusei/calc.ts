// src/lib/fortune/kyusei/calc.ts
import { solarLongitudeTime, solarMonthAt } from "../astro/solar-terms";
import { DIRECTIONS, type Direction, type Palace } from "../element-ids";
import { mod, toJdn, type LocalDate } from "../local-date";
import { dayCycleIndex } from "../sexagenary";
import { jstLocalDate } from "../tokyo-time";
import type { BirthProfile } from "../types";

export { DIRECTIONS, type Direction, type Palace };

export const STAR_NAMES = [
  "一白水星", "二黒土星", "三碧木星", "四緑木星", "五黄土星", "六白金星", "七赤金星", "八白土星", "九紫火星",
] as const;

export const DIRECTION_LABELS: Record<Direction, string> = {
  n: "北", ne: "北東", e: "東", se: "南東", s: "南", sw: "南西", w: "西", nw: "北西",
};

export const PALACE_NAMES: Record<Palace, string> = {
  center: "中宮", n: "坎宮", ne: "艮宮", e: "震宮", se: "巽宮", s: "離宮", sw: "坤宮", w: "兌宮", nw: "乾宮",
};

const OPPOSITE: Record<Direction, Direction> = { n: "s", ne: "sw", e: "w", se: "nw", s: "n", sw: "ne", w: "e", nw: "se" };

/** 洛書の飛泊順(中宮→乾→兌→艮→離→坎→坤→震→巽) */
const FLIGHT: readonly Palace[] = ["center", "nw", "w", "ne", "s", "n", "sw", "e", "se"];

/** 十二支(0 = 子)の方位 */
const BRANCH_DIRECTION: readonly Direction[] = ["n", "ne", "ne", "e", "se", "se", "s", "sw", "sw", "w", "nw", "nw"];

/** 本命星と相性のよい星(相生・比和) */
const LUCKY_STARS: Record<number, readonly number[]> = {
  1: [3, 4, 6, 7],
  2: [6, 7, 8, 9],
  3: [1, 4, 9],
  4: [1, 3, 9],
  5: [2, 6, 7, 8, 9],
  6: [1, 2, 7, 8],
  7: [1, 2, 6, 8],
  8: [2, 6, 7, 9],
  9: [2, 3, 4, 8],
};

/** 本命星=月命星のときの中宮傾斜(八雲院の表)。5 は性別で分かれる */
const CENTER_KEISHA: Record<number, Direction> = { 1: "s", 2: "nw", 3: "se", 4: "e", 6: "sw", 7: "ne", 8: "w", 9: "n" };

/** 立春で区切った年の中宮の星(=その年生まれの本命星) */
export function yearStar(kyuseiYear: number): number {
  return mod(11 - mod(kyuseiYear, 9), 9) || 9;
}

/** 年の星と節月(0 = 寅月)から月の中宮の星(=月命星) */
export function monthStar(yearStarNumber: number, solarMonthIndex: number): number {
  const group = (yearStarNumber - 1) % 3; // 0: 一白・四緑・七赤 / 1: 二黒・五黄・八白 / 2: 三碧・六白・九紫
  const firstMonth = [8, 2, 5][group];
  return mod(firstMonth - solarMonthIndex - 1, 9) + 1;
}

/** 中宮の星が center の盤で、star が入る宮 */
export function positionInBoard(center: number, star: number): Palace {
  return FLIGHT[mod(star - center, 9)];
}

/** 傾斜宮。五黄同士で性別未入力なら男性・女性の2候補 */
export function keisha(honmei: number, getsumei: number, gender?: BirthProfile["gender"]): Direction[] {
  if (honmei !== getsumei) return [positionInBoard(getsumei, honmei) as Direction];
  if (honmei !== 5) return [CENTER_KEISHA[honmei]];
  if (gender === "male") return ["w"];
  if (gender === "female") return ["nw"];
  return ["w", "nw"];
}

export interface KyuseiNatal {
  honmei: number;
  getsumei: number;
  keisha: Direction[];
}

export function kyuseiNatalAt(at: Date, gender?: BirthProfile["gender"]): KyuseiNatal {
  const m = solarMonthAt(at);
  const honmei = yearStar(m.kyuseiYear);
  const getsumei = monthStar(honmei, m.index);
  return { honmei, getsumei, keisha: keisha(honmei, getsumei, gender) };
}

export function sameKyuseiNatal(a: KyuseiNatal, b: KyuseiNatal): boolean {
  return a.honmei === b.honmei && a.getsumei === b.getsumei && a.keisha.join() === b.keisha.join();
}

/** jdn に最も近い甲子日のユリウス日 */
function nearestKasshi(jdn: number): number {
  const index = mod(jdn + 49, 60);
  const previous = jdn - index;
  return index <= 30 ? previous : previous + 60;
}

const switchCache = new Map<number, { jdn: number; ascending: boolean }[]>();

/** year 前後の陽遁(冬至)・陰遁(夏至)の切り替え日 */
function switchesAround(year: number) {
  const cached = switchCache.get(year);
  if (cached) return cached;
  const list: { jdn: number; ascending: boolean }[] = [];
  for (const y of [year - 1, year, year + 1]) {
    list.push({ jdn: nearestKasshi(toJdn(jstLocalDate(solarLongitudeTime(y, 270)))), ascending: true });
    list.push({ jdn: nearestKasshi(toJdn(jstLocalDate(solarLongitudeTime(y, 90)))), ascending: false });
  }
  list.sort((a, b) => a.jdn - b.jdn);
  switchCache.set(year, list);
  return list;
}

/** 日家九星(日盤の中宮の星) */
export function dayStar(d: LocalDate): number {
  const jdn = toJdn(d);
  const switches = switchesAround(d.year).filter((s) => s.jdn <= jdn);
  const last = switches[switches.length - 1];
  const diff = jdn - last.jdn;
  return last.ascending ? mod(diff, 9) + 1 : 9 - mod(diff, 9);
}

/** 日の破に使う十二支の番号 */
export function dayBranchIndex(d: LocalDate): number {
  return mod(dayCycleIndex(d), 12);
}

/**
 * 吉方位。五黄殺・暗剣殺・本命殺・本命的殺・破を除き、本命星と相性のよい星が入る方位。
 * breakBranch はその盤の十二支(歳破・月破・日破はその反対の方位)。
 */
export function luckyDirections(center: number, honmei: number, breakBranch: number): Direction[] {
  const starAt = (dir: Direction) => mod(center - 1 + FLIGHT.indexOf(dir), 9) + 1;
  const bad = new Set<Direction>();
  const gohoPos = positionInBoard(center, 5);
  if (gohoPos !== "center") {
    bad.add(gohoPos);
    bad.add(OPPOSITE[gohoPos]);
  }
  const honmeiPos = positionInBoard(center, honmei);
  if (honmeiPos !== "center") {
    bad.add(honmeiPos);
    bad.add(OPPOSITE[honmeiPos]);
  }
  bad.add(OPPOSITE[BRANCH_DIRECTION[mod(breakBranch, 12)]]);
  return DIRECTIONS.filter((dir) => !bad.has(dir) && LUCKY_STARS[honmei].includes(starAt(dir)));
}
