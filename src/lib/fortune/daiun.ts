// src/lib/fortune/daiun.ts
import { solarMonthAt } from "./astro/solar-terms";
import { mod, toJdn, type LocalDate } from "./local-date";
import { isYangStem, stemOf } from "./sexagenary";
import { jstLocalDate } from "./tokyo-time";

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
