// src/lib/fortune/daiun.ts
import { midpoint, representative, resolvedValues } from "./ambiguity";
import { solarMonthAt } from "./astro/solar-terms";
import { mod, toJdn, type LocalDate } from "./local-date";
import { isYangStem, stemOf } from "./sexagenary";
import { jstLocalDate } from "./tokyo-time";
import type { Resolved, TimeRange } from "./types";

export interface DaiunPlan {
  /** 順行(月柱から進む)なら true、逆行(戻る)なら false */
  forward: boolean;
  /** 立運の年齢(1〜10) */
  startAge: number;
  /** 起点にする月柱の干支の番号 */
  monthCycle: number;
}

/**
 * 大運の向きと立運(四柱推命・算命学で共通)。
 * 年干が陽の男性・陰の女性は順行、それ以外は逆行。順行は次の節入り日まで、逆行は前の節入り日からの日数(日付の差)を
 * 3で割って四捨五入し、1〜10歳に収める(高尾学館式)
 */
export function daiunPlan(at: Date, yearCycle: number, monthCycle: number, gender: "male" | "female"): DaiunPlan {
  const forward = isYangStem(stemOf(yearCycle)) === (gender === "male");
  const month = solarMonthAt(at);
  const birth = toJdn(jstLocalDate(at));
  const days = forward ? toJdn(jstLocalDate(month.end)) - birth : birth - toJdn(jstLocalDate(month.start));
  return { forward, startAge: Math.min(10, Math.max(1, Math.round(days / 3))), monthCycle };
}

/**
 * 命式の候補ごとの大運。各候補はその区間の中央の瞬間で、確定なら出生の範囲の中央の瞬間で計算する。
 * 節入り・立春をまたぐと立運や向きが候補で分かれる
 */
export function resolveDaiun(
  natal: Resolved<{ year: number; month: number }>,
  range: TimeRange,
  gender: "male" | "female",
): Resolved<DaiunPlan> {
  if (natal.kind === "fixed") {
    return { kind: "fixed", value: daiunPlan(midpoint(range), natal.value.year, natal.value.month, gender) };
  }
  return {
    kind: "ambiguous",
    options: natal.options.map((o) => ({ value: daiunPlan(midpoint(o.range), o.value.year, o.value.month, gender), range: o.range })),
  };
}

/** 例: 2歳運・順行 */
export function formatDaiunPlan(plan: DaiunPlan): string {
  return `${plan.startAge}歳運・${plan.forward ? "順行" : "逆行"}`;
}

/** 大運が候補で分かれるときの今年の運勢への注記。分かれなければ undefined */
export function daiunNote(daiun: Resolved<DaiunPlan>): string | undefined {
  const base = formatDaiunPlan(representative(daiun));
  const others = [...new Set(resolvedValues(daiun).map(formatDaiunPlan))].filter((v) => v !== base);
  return others.length ? `大運を${base}として計算(出生時刻により${others.join("・")}の可能性があります)` : undefined;
}

export interface DaiunPeriod {
  /** 大運の干支の番号 */
  cycle: number;
  fromAge: number;
  toAge: number;
}

/** age 歳のときの大運。立運前は null */
export function daiunAt(plan: DaiunPlan, age: number): DaiunPeriod | null {
  if (age < plan.startAge) return null;
  const k = Math.floor((age - plan.startAge) / 10) + 1;
  const fromAge = plan.startAge + (k - 1) * 10;
  return { cycle: mod(plan.monthCycle + (plan.forward ? k : -k), 60), fromAge, toAge: fromAge + 9 };
}

/** 満年齢 */
export function ageOn(birth: LocalDate, today: LocalDate): number {
  const beforeBirthday = today.month < birth.month || (today.month === birth.month && today.day < birth.day);
  return today.year - birth.year - (beforeBirthday ? 1 : 0);
}
