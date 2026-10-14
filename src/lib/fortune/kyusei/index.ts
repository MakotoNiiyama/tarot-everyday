// src/lib/fortune/kyusei/index.ts
import { describeResolved, isAmbiguous, representative, resolvedValues, resolveOverRange } from "../ambiguity";
import { jieBoundariesWithin, solarLongitudeTime, solarMonthAt } from "../astro/solar-terms";
import { directionId, palaceId, starId, type Direction } from "../element-ids";
import { addDays, formatSlash, type LocalDate } from "../local-date";
import { monthBranchIndex, yearBranchIndex } from "../sexagenary";
import { jstLocalDate, tokyoToUtc } from "../tokyo-time";
import type { ElementRef, Fact, FortuneSystemModule, Period, PeriodResult } from "../types";
import {
  DIRECTION_LABELS,
  PALACE_NAMES,
  STAR_NAMES,
  dayBranchIndex,
  dayStar,
  kyuseiNatalAt,
  luckyDirections,
  monthStar,
  positionInBoard,
  sameKyuseiNatal,
  yearStar,
  type KyuseiNatal,
} from "./calc";

const ref = (id: string): ElementRef => ({ system: "kyusei", id });

function unique<T>(items: T[], key: (v: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((v) => {
    const k = key(v);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function keishaLabel(k: Direction[]): string {
  if (k.length === 2) return `${PALACE_NAMES[k[0]]}(男性)または${PALACE_NAMES[k[1]]}(女性)`;
  return PALACE_NAMES[k[0]];
}

const PERIOD_WORD: Record<Period, string> = { day: "今日", month: "今月", year: "今年" };
const BOARD_LABEL: Record<Period, string> = { day: "日盤の中宮", month: "月盤の中宮", year: "年盤の中宮" };

function boardFor(period: Period, today: LocalDate) {
  // 暦の慣習どおり節入り・立春の当日は新しい月・年に含めるため、今日の終わり(23:59)で判定する
  const endOfToday = tokyoToUtc(today.year, today.month, today.day, 23, 59);
  const month = solarMonthAt(endOfToday);
  const ky = month.kyuseiYear;
  if (period === "year") {
    const start = jstLocalDate(solarLongitudeTime(ky, 315));
    const end = addDays(jstLocalDate(solarLongitudeTime(ky + 1, 315)), -1);
    return { center: yearStar(ky), branch: yearBranchIndex(ky), range: `${formatSlash(start)}〜${formatSlash(end)}` };
  }
  if (period === "month") {
    const start = jstLocalDate(month.start);
    const end = addDays(jstLocalDate(month.end), -1);
    return {
      center: monthStar(yearStar(ky), month.index),
      branch: monthBranchIndex(month.index),
      range: `${formatSlash(start)}〜${formatSlash(end)}`,
    };
  }
  return { center: dayStar(today), branch: dayBranchIndex(today), range: formatSlash(today) };
}

function periodResult(period: Period, natal: KyuseiNatal, today: LocalDate): PeriodResult {
  const board = boardFor(period, today);
  const pos = positionInBoard(board.center, natal.honmei);
  const posLabel = pos === "center" ? "中宮" : `${DIRECTION_LABELS[pos]}(${PALACE_NAMES[pos]})`;
  const lucky = luckyDirections(board.center, natal.honmei, board.branch);
  return {
    period,
    rangeLabel: board.range,
    headline: { text: `${PERIOD_WORD[period]}は本命星が${posLabel}に回る`, ref: ref(palaceId(pos)) },
    chips: [
      { label: "本命星の位置", value: posLabel, refs: [ref(palaceId(pos))] },
      {
        label: "吉方位",
        value: lucky.length ? lucky.map((d) => DIRECTION_LABELS[d]).join("・") : "なし",
        refs: lucky.map((d) => ref(directionId(d))),
      },
      { label: BOARD_LABEL[period], value: STAR_NAMES[board.center - 1], refs: [ref(starId(board.center))] },
    ],
  };
}

export const kyusei: FortuneSystemModule = {
  id: "kyusei",
  name: "九星気学",
  nameEn: "Nine Star Ki",
  read(profile, moment, today) {
    const natal = resolveOverRange(
      moment.range,
      jieBoundariesWithin(moment.range),
      (at) => kyuseiNatalAt(at, profile.gender),
      sameKyuseiNatal,
    );
    const values = resolvedValues(natal);
    const facts: Fact[] = [
      {
        label: "本命星",
        value: describeResolved(natal, (n) => STAR_NAMES[n.honmei - 1]),
        refs: unique(values.map((n) => ref(starId(n.honmei))), (r) => r.id),
      },
      {
        label: "月命星",
        value: describeResolved(natal, (n) => STAR_NAMES[n.getsumei - 1]),
        refs: unique(values.map((n) => ref(starId(n.getsumei))), (r) => r.id),
      },
      {
        label: "傾斜宮",
        value: describeResolved(natal, (n) => keishaLabel(n.keisha)),
        refs: unique(values.flatMap((n) => n.keisha.map((k) => ref(palaceId(k)))), (r) => r.id),
      },
    ];
    const base = representative(natal);

    return {
      id: "kyusei",
      name: "九星気学",
      nameEn: "Nine Star Ki",
      method:
        "年は立春、月は節入りで区切る。日盤は冬至・夏至に最も近い甲子日で陽遁・陰遁を切り替える。中宮傾斜は本命星ごとの表(五黄同士は男性=兌宮・女性=乾宮)。吉方位は五黄殺・暗剣殺・本命殺・本命的殺・破を除き、本命星と相生・比和の星が入る方位",
      natal: facts,
      ambiguous: isAmbiguous(natal),
      periods: {
        day: periodResult("day", base, today),
        month: periodResult("month", base, today),
        year: periodResult("year", base, today),
      },
    };
  },
};
