// src/lib/fortune/shichu/index.ts
import { describeResolved, isAmbiguous, representative, resolvedValues, resolveOverRange } from "../ambiguity";
import { calendarPeriod } from "../astro/calendar-period";
import { jieBoundariesWithin } from "../astro/solar-terms";
import { isTimeKnown } from "../birth-moment";
import { ageOn, daiunAt, daiunNote, formatDaiunPlan, resolveDaiun, type DaiunPlan } from "../daiun";
import { FIVE_ELEMENTS, branchId, elementId, stemId, tsuhenId, unseiId } from "../element-ids";
import { resolvedFact } from "../fact";
import type { LocalDate } from "../local-date";
import { GANSHI_LABEL, PERIOD_WORD } from "../period-labels";
import {
  ELEMENT_NAMES,
  STEMS,
  TEN_GOD_NAMES,
  TWELVE_STAGE_NAMES,
  branchOf,
  cycleName,
  isYangStem,
  stemElement,
  stemOf,
  tenGodIndex,
  twelveStageIndex,
} from "../sexagenary";
import type { ElementRef, Fact, FortuneSystemModule, NatalChart, Period, PeriodResult } from "../types";
import { elementCounts, hourBoundariesWithin, sameShichuNatal, shichuNatalAt, zokan, type ShichuNatal } from "./calc";

const ref = (id: string): ElementRef => ({ system: "shichu", id });
const stemRef = (stem: number) => ref(stemId(stem + 1));
const pillarRefs = (cycle: number) => [stemRef(stemOf(cycle)), ref(branchId(branchOf(cycle) + 1))];

const PILLARS = [
  { key: "year-pillar", label: "年柱", pick: (n: ShichuNatal) => n.year },
  { key: "month-pillar", label: "月柱", pick: (n: ShichuNatal) => n.month },
  { key: "day-pillar", label: "日柱", pick: (n: ShichuNatal) => n.day },
  { key: "hour-pillar", label: "時柱", pick: (n: ShichuNatal) => n.hour },
] as const;

const UNKNOWN_HOUR = "時刻不明";

type Pillar = (typeof PILLARS)[number];

/** 命式表の行(干支の下に並べる柱の詳細) */
const DETAIL_ROWS = [
  { field: "tsuhen", label: "通変星" },
  { field: "zokan", label: "蔵干" },
  { field: "unsei", label: "十二運" },
] as const;

type PillarDetail = Record<(typeof DETAIL_ROWS)[number]["field"], { name: string; ref: ElementRef }>;

/** 柱の通変星・蔵干・十二運。日柱の通変星は「日主」で、参照は日干 */
function pillarDetail(n: ShichuNatal, cycle: number, isDay: boolean): PillarDetail {
  const dayStem = stemOf(n.day);
  const god = tenGodIndex(dayStem, stemOf(cycle));
  const hidden = zokan(branchOf(cycle), n.dayNumber);
  const stage = twelveStageIndex(dayStem, branchOf(cycle));
  return {
    tsuhen: isDay ? { name: "日主", ref: stemRef(dayStem) } : { name: TEN_GOD_NAMES[god], ref: ref(tsuhenId(god + 1)) },
    zokan: { name: STEMS[hidden], ref: stemRef(hidden) },
    unsei: { name: TWELVE_STAGE_NAMES[stage], ref: ref(unseiId(stage + 1)) },
  };
}

/** その命式での柱の詳細。時刻不明の時柱は null */
function detailOf(n: ShichuNatal, pillar: Pillar): PillarDetail | null {
  const c = pillar.pick(n);
  return c === null ? null : pillarDetail(n, c, pillar.key === "day-pillar");
}

function meishikiText(n: ShichuNatal): string {
  return PILLARS.map((pillar) => {
    const c = pillar.pick(n);
    const d = detailOf(n, pillar);
    if (c === null || d === null) return `${pillar.label} ${UNKNOWN_HOUR}`;
    return `${pillar.label} ${cycleName(c)}(${DETAIL_ROWS.map(({ field }) => d[field].name).join("・")})`;
  }).join("、");
}

function gogyoText(n: ShichuNatal): string {
  return elementCounts(n)
    .map((count, i) => `${ELEMENT_NAMES[i]}${count}`)
    .join("・");
}

function dominantElements(n: ShichuNatal): ElementRef[] {
  const counts = elementCounts(n);
  const max = Math.max(...counts);
  return FIVE_ELEMENTS.filter((_, i) => counts[i] === max).map((e) => ref(elementId(e)));
}

function daiunChip(plan: DaiunPlan, dayStem: number, age: number): Fact {
  const current = daiunAt(plan, age);
  if (!current) return { key: "daiun", label: "大運", value: `立運前(${plan.startAge}歳から)`, refs: [] };
  const god = tenGodIndex(dayStem, stemOf(current.cycle));
  return {
    key: "daiun",
    label: "大運",
    value: `${cycleName(current.cycle)}(${TEN_GOD_NAMES[god]}、${current.fromAge}〜${current.toAge}歳)`,
    refs: [ref(tsuhenId(god + 1))],
  };
}

function periodResult(
  period: Period,
  base: ShichuNatal,
  today: LocalDate,
  daiun: { plan: DaiunPlan; age: number } | null,
  note: string | undefined,
): PeriodResult {
  const cal = calendarPeriod(period, today);
  const c = cal.cycleIndex;
  const dayStem = stemOf(base.day);
  const god = tenGodIndex(dayStem, stemOf(c));
  const stage = twelveStageIndex(dayStem, branchOf(c));
  const godRef = ref(tsuhenId(god + 1));
  const chips: Fact[] = [
    { key: "ganshi", label: GANSHI_LABEL[period], value: cycleName(c), refs: pillarRefs(c) },
    { key: "tsuhen", label: "通変星", value: TEN_GOD_NAMES[god], refs: [godRef] },
    { key: "unsei", label: "十二運", value: TWELVE_STAGE_NAMES[stage], refs: [ref(unseiId(stage + 1))] },
  ];
  if (period === "year" && daiun) chips.push(daiunChip(daiun.plan, dayStem, daiun.age));
  return {
    period,
    rangeLabel: cal.rangeLabel,
    headline: {
      text: `${PERIOD_WORD[period]}の干支は${cycleName(c)}。日干${STEMS[dayStem]}に対して${STEMS[stemOf(c)]}は${TEN_GOD_NAMES[god]}`,
      ref: godRef,
    },
    chips,
    ...(note ? { note } : {}),
  };
}

export const shichu: FortuneSystemModule = {
  id: "shichu",
  name: "四柱推命",
  nameEn: "Four Pillars",
  read(profile, moment, today) {
    const hourKnown = isTimeKnown(profile.time);
    const options = { lon: moment.location.lon, hourKnown, localDate: moment.localDate };
    const boundaries = [
      ...jieBoundariesWithin(moment.range),
      ...(hourKnown ? hourBoundariesWithin(moment.range, moment.location.lon) : []),
    ];
    const natal = resolveOverRange(moment.range, boundaries, (at) => shichuNatalAt(at, options), sameShichuNatal);
    const fact = (key: string, label: string, format: (n: ShichuNatal) => string, refsOf: (n: ShichuNatal) => ElementRef[]) =>
      resolvedFact(natal, key, label, format, refsOf);

    const pillarFacts = PILLARS.map(({ key, label, pick }) =>
      fact(
        key,
        label,
        (n) => {
          const c = pick(n);
          return c === null ? UNKNOWN_HOUR : cycleName(c);
        },
        (n) => {
          const c = pick(n);
          return c === null ? [] : pillarRefs(c);
        },
      ),
    );
    // 命式はプロンプト用の要約。候補の注記は柱ごとに出すので、ここでは candidates を付けない
    const meishiki: Fact = { key: "meishiki", label: "命式", value: describeResolved(natal, meishikiText), refs: [] };
    const base = representative(natal);
    const daiunResolved = profile.gender ? resolveDaiun(natal, moment.range, profile.gender) : null;
    // 運勢の大運は代表の候補で計算する
    const plan = daiunResolved ? representative(daiunResolved) : null;

    const facts: Fact[] = [
      fact(
        "day-master",
        "日干",
        (n) => {
          const s = stemOf(n.day);
          return `${STEMS[s]}(${isYangStem(s) ? "陽" : "陰"}の${ELEMENT_NAMES[stemElement(s)]})`;
        },
        (n) => [stemRef(stemOf(n.day))],
      ),
      ...pillarFacts,
      meishiki,
      fact("gogyo", "五行バランス", gogyoText, dominantElements),
      ...(daiunResolved ? [resolvedFact(daiunResolved, "daiun", "大運", formatDaiunPlan, () => [])] : []),
    ];

    const chart: NatalChart = {
      kind: "pillars",
      columns: PILLARS.map((p) => p.label),
      rows: [
        { label: "干支", cells: pillarFacts },
        // 代表の命式で値がない(時刻不明の時柱)セルは空き。label は詳細シートの見出しに出る(例「年柱の通変星」)
        ...DETAIL_ROWS.map(({ field, label }) => ({
          label,
          cells: PILLARS.map((pillar) =>
            detailOf(base, pillar) === null
              ? null
              : fact(
                  `${pillar.key}-${field}`,
                  `${pillar.label}の${label}`,
                  (n) => detailOf(n, pillar)?.[field].name ?? UNKNOWN_HOUR,
                  (n) => {
                    const d = detailOf(n, pillar);
                    return d ? [d[field].ref] : [];
                  },
                ),
          ),
        })),
      ],
      factKeys: [...PILLARS.map((p) => p.key), "meishiki"],
    };

    // 運勢は代表の日柱で計算する。日柱が候補に分かれるときはその旨を各期間に添える
    const otherDays = [...new Set(resolvedValues(natal).map((n) => n.day))].filter((d) => d !== base.day);
    const note = otherDays.length
      ? `日柱を${cycleName(base.day)}として計算(出生時刻により${otherDays.map(cycleName).join("・")}の可能性があります)`
      : undefined;
    // 大運が候補に分かれるときは今年の運勢にだけ添える
    const yearNote = [note, daiunResolved && daiunNote(daiunResolved)].filter(Boolean).join("。") || undefined;
    const daiun = plan ? { plan, age: ageOn(profile.date, today) } : null;

    return {
      id: "shichu",
      name: "四柱推命",
      nameEn: "Four Pillars",
      method:
        "年柱は立春、月柱は節入りで区切る。日柱は0時切替で、23時台は時柱だけ翌日の子の刻。日柱の日付は、時刻指定時は標準時(サマータイムは1時間戻す)を出生地の経度で地方平均時に補正して出し(出生地未入力は明石基準で補正なし)、それ以外は誕生日の暦日。時刻を指定して分が分からないときはその時の30分で計算する。時刻が不明・午前午後のときは時柱を出さない。蔵干は月律分野蔵干(申の余気は戊)を、節入り日を1日目とする日数(標準時の日付で数える)で全柱に当てる。大運は年干の陰陽と性別で順逆を決め、節入り日までの日数÷3を四捨五入(1〜10歳)。神殺は扱わない",
      natal: facts,
      ambiguous: isAmbiguous(natal),
      chart,
      periods: {
        day: periodResult("day", base, today, daiun, note),
        month: periodResult("month", base, today, daiun, note),
        year: periodResult("year", base, today, daiun, yearNote),
      },
    };
  },
};
