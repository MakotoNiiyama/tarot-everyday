// src/lib/fortune/kyusei/index.ts
import { describeCandidates, describeResolved, isAmbiguous, representative, resolvedValues, resolveOverRange } from "../ambiguity";
import { calendarPeriod } from "../astro/calendar-period";
import { jieBoundariesWithin } from "../astro/solar-terms";
import { directionId, palaceId, starId, type Direction } from "../element-ids";
import type { LocalDate } from "../local-date";
import { monthBranchIndex, yearBranchIndex } from "../sexagenary";
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
  const cal = calendarPeriod(period, today);
  if (period === "year") {
    return { center: yearStar(cal.kyuseiYear), branch: yearBranchIndex(cal.kyuseiYear), range: cal.rangeLabel };
  }
  if (period === "month") {
    return {
      center: monthStar(yearStar(cal.kyuseiYear), cal.solarMonthIndex),
      branch: monthBranchIndex(cal.solarMonthIndex),
      range: cal.rangeLabel,
    };
  }
  return { center: dayStar(today), branch: dayBranchIndex(today), range: cal.rangeLabel };
}

function periodResult(period: Period, natal: KyuseiNatal, today: LocalDate, note?: string): PeriodResult {
  const board = boardFor(period, today);
  const pos = positionInBoard(board.center, natal.honmei);
  const posLabel = pos === "center" ? "中宮" : `${DIRECTION_LABELS[pos]}(${PALACE_NAMES[pos]})`;
  const lucky = luckyDirections(board.center, natal.honmei, board.branch);
  return {
    period,
    rangeLabel: board.range,
    headline: { text: `${PERIOD_WORD[period]}は本命星が${posLabel}に回る`, ref: ref(palaceId(pos)) },
    chips: [
      { key: "position", label: "本命星の位置", value: posLabel, refs: [ref(palaceId(pos))] },
      {
        key: "lucky",
        label: "吉方位",
        value: lucky.length ? lucky.map((d) => DIRECTION_LABELS[d]).join("・") : "なし",
        refs: lucky.map((d) => ref(directionId(d))),
      },
      { key: "board-center", label: BOARD_LABEL[period], value: STAR_NAMES[board.center - 1], refs: [ref(starId(board.center))] },
    ],
    ...(note ? { note } : {}),
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
    /** 候補で表記が分かれるときだけ candidates を付けた事実 */
    const natalFact = (key: string, label: string, format: (n: KyuseiNatal) => string, refs: ElementRef[]): Fact => {
      const candidates = describeCandidates(natal, format);
      return {
        key,
        label,
        value: describeResolved(natal, format),
        refs: unique(refs, (r) => r.id),
        ...(candidates ? { candidates } : {}),
      };
    };
    const facts: Fact[] = [
      natalFact("honmei", "本命星", (n) => STAR_NAMES[n.honmei - 1], values.map((n) => ref(starId(n.honmei)))),
      natalFact("getsumei", "月命星", (n) => STAR_NAMES[n.getsumei - 1], values.map((n) => ref(starId(n.getsumei)))),
      natalFact(
        "keisha",
        "傾斜宮",
        (n) => keishaLabel(n.keisha),
        values.flatMap((n) => n.keisha.map((k) => ref(palaceId(k)))),
      ),
    ];
    const base = representative(natal);
    // 運勢は代表の本命星で計算する。本命星が候補に分かれるときはその旨を各期間に添える
    const otherHonmei = unique(values, (n) => String(n.honmei))
      .map((n) => n.honmei)
      .filter((h) => h !== base.honmei);
    const note = otherHonmei.length
      ? `本命星を${STAR_NAMES[base.honmei - 1]}として計算(出生時刻により${otherHonmei.map((h) => STAR_NAMES[h - 1]).join("・")}の可能性があります)`
      : undefined;

    return {
      id: "kyusei",
      name: "九星気学",
      nameEn: "Nine Star Ki",
      method:
        "年は立春、月は節入りで区切る。日盤は冬至・夏至に最も近い甲子日で陽遁・陰遁を切り替える。中宮傾斜は本命星ごとの表(五黄同士は男性=兌宮・女性=乾宮)。吉方位は五黄殺・暗剣殺・本命殺・本命的殺・破を除き、本命星と相生・比和の星が入る方位",
      natal: facts,
      ambiguous: isAmbiguous(natal),
      periods: {
        day: periodResult("day", base, today, note),
        month: periodResult("month", base, today, note),
        year: periodResult("year", base, today, note),
      },
    };
  },
};
