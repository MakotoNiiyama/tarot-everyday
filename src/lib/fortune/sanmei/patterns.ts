// src/lib/fortune/sanmei/patterns.ts
import { IJO_ANGOU, IJO_NORMAL, ISOU_KINDS, type IsouKind, type ShukumeiKind } from "../element-ids";
import { mod } from "../local-date";
import { branchOf } from "../sexagenary";
import { tenchuOf } from "./calc";

export type SanmeiPillar = "year" | "month" | "day";

export const PILLAR_NAMES: Record<SanmeiPillar, string> = { year: "年柱", month: "月柱", day: "日柱" };
export const BRANCH_PILLAR_NAMES: Record<SanmeiPillar, string> = { year: "年支", month: "月支", day: "日支" };

export const SHUKUMEI_NAMES: Record<ShukumeiKind, string> = {
  year: "生年中殺",
  month: "生月中殺",
  day: "生日中殺",
  nichiza: "日座中殺",
  nikkyo: "日居中殺",
};

export const ISOU_NAMES: Record<IsouKind, string> = {
  shigo: "支合",
  hankai: "半会",
  hosani: "方三位",
  taichu: "対冲",
  kei: "刑",
  gai: "害",
  ha: "破",
};

interface ThreePillars {
  year: number;
  month: number;
  day: number;
}

/** 宿命中殺(生年・生月・生日・日座・日居の順) */
export function shukumeiChusatsu(n: ThreePillars): ShukumeiKind[] {
  const dayVoid = tenchuOf(n.day).branches;
  const yearVoid = tenchuOf(n.year).branches;
  const result: ShukumeiKind[] = [];
  if (dayVoid.includes(branchOf(n.year))) result.push("year");
  if (dayVoid.includes(branchOf(n.month))) result.push("month");
  if (yearVoid.includes(branchOf(n.day))) result.push("day");
  const day = mod(n.day, 60);
  if (day === 10 || day === 11) result.push("nichiza"); // 甲戌・乙亥
  if (day === 40 || day === 41) result.push("nikkyo"); // 甲辰・乙巳
  return result;
}

/** 年・月・日の柱にある異常干支(干支番号は甲子 = 1) */
export function ijoKanshi(n: ThreePillars): { pillar: SanmeiPillar; cycleNumber: number; kind: "normal" | "angou" }[] {
  type Item = { pillar: SanmeiPillar; cycleNumber: number; kind: "normal" | "angou" };
  return (["year", "month", "day"] as const).flatMap((pillar): Item[] => {
    const cycleNumber = mod(n[pillar], 60) + 1;
    if ((IJO_NORMAL as readonly number[]).includes(cycleNumber)) return [{ pillar, cycleNumber, kind: "normal" }];
    if ((IJO_ANGOU as readonly number[]).includes(cycleNumber)) return [{ pillar, cycleNumber, kind: "angou" }];
    return [];
  });
}

const pairSet = (pairs: [number, number][]) => new Set(pairs.flatMap(([a, b]) => [`${a}-${b}`, `${b}-${a}`]));

const SHIGO = pairSet([[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]);
/** 三合(申子辰・亥卯未・寅午戌・巳酉丑)の中の2支 */
const HANKAI = pairSet(
  [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]].flatMap(([a, b, c]) => [[a, b], [b, c], [a, c]] as [number, number][]),
);
const KEI = pairSet([[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [7, 1], [0, 3], [4, 4], [6, 6], [9, 9], [11, 11]]);
const GAI = pairSet([[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]);
const HA = pairSet([[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]]);
const HOSANI = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];

const PAIR_TESTS: Record<Exclude<IsouKind, "hosani">, (a: number, b: number) => boolean> = {
  shigo: (a, b) => SHIGO.has(`${a}-${b}`),
  hankai: (a, b) => a !== b && HANKAI.has(`${a}-${b}`),
  taichu: (a, b) => mod(a - b, 12) === 6,
  kei: (a, b) => KEI.has(`${a}-${b}`),
  gai: (a, b) => GAI.has(`${a}-${b}`),
  ha: (a, b) => HA.has(`${a}-${b}`),
};

const PAIRS: [SanmeiPillar, SanmeiPillar][] = [
  ["year", "month"],
  ["year", "day"],
  ["month", "day"],
];

export interface IsouMatch {
  kind: IsouKind;
  pillars: SanmeiPillar[];
}

/** 位相法。年支・月支・日支の2支ずつ(方三位は3支)の関係を、種類の順・柱の組の順に返す */
export function isouho(branches: [year: number, month: number, day: number]): IsouMatch[] {
  const at: Record<SanmeiPillar, number> = { year: branches[0], month: branches[1], day: branches[2] };
  return ISOU_KINDS.flatMap((kind): IsouMatch[] => {
    if (kind === "hosani") {
      const set = new Set(branches);
      return HOSANI.some((g) => g.every((x) => set.has(x)) && set.size === 3)
        ? [{ kind, pillars: ["year", "month", "day"] }]
        : [];
    }
    return PAIRS.filter(([p, q]) => PAIR_TESTS[kind](at[p], at[q])).map(([p, q]) => ({ kind, pillars: [p, q] }));
  });
}
