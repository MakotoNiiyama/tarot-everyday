// src/lib/fortune/sanmei/index.ts
import { isAmbiguous, representative, resolvedValues, resolveOverRange } from "../ambiguity";
import { calendarPeriod } from "../astro/calendar-period";
import { jieBoundariesWithin } from "../astro/solar-terms";
import { isTimeKnown } from "../birth-moment";
import { ageOn, daiunAt, daiunNote, formatDaiunPlan, resolveDaiun, type DaiunPlan } from "../daiun";
import { ijoId, isouId, mainStarId, shukumeiId, subStarId, tenchuId } from "../element-ids";
import { resolvedFact } from "../fact";
import type { LocalDate } from "../local-date";
import { ijoNote, shukumeiNote } from "../natal-notes";
import { GANSHI_LABEL, PERIOD_WORD } from "../period-labels";
import { BRANCHES, STEMS, branchOf, cycleName, stemOf, tenGodIndex, twelveStageIndex } from "../sexagenary";
import { standardDate } from "../tokyo-time";
import type { ElementRef, Fact, FortuneSystemModule, NatalChart, Period, PeriodResult } from "../types";
import {
  MAIN_STAR_NAMES,
  SUB_STAR_NAMES,
  TENCHU_NAMES,
  bodyStars,
  sameSanmeiNatal,
  sanmeiNatalAt,
  tenchuOf,
  type BodyStars,
  type SanmeiNatal,
} from "./calc";
import { BRANCH_PILLAR_NAMES, ISOU_NAMES, PILLAR_NAMES, SHUKUMEI_NAMES, ijoKanshi, isouho, shukumeiChusatsu } from "./patterns";

const ref = (id: string): ElementRef => ({ system: "sanmei", id });
const mainRef = (n: number) => ref(mainStarId(n + 1));
const subRef = (n: number) => ref(subStarId(n + 1));

/** 人体星図のマス(label は図と一覧で共通) */
const BODY = [
  { key: "center", label: "中心星", kind: "main" },
  { key: "north", label: "頭(北)", kind: "main" },
  { key: "east", label: "左手(東)", kind: "main" },
  { key: "west", label: "右手(西)", kind: "main" },
  { key: "south", label: "腹(南)", kind: "main" },
  { key: "early", label: "左肩(初年)", kind: "sub" },
  { key: "middle", label: "左足(中年)", kind: "sub" },
  { key: "late", label: "右足(晩年)", kind: "sub" },
] as const satisfies readonly { key: keyof BodyStars; label: string; kind: "main" | "sub" }[];

type BodyKey = (typeof BODY)[number]["key"];
const BODY_BY_KEY = Object.fromEntries(BODY.map((b) => [b.key, b])) as Record<BodyKey, (typeof BODY)[number]>;

/** 図のマスの並び(左上から行ごと。null は空き) */
const LAYOUT: readonly (BodyKey | null)[] = [
  null, "north", "early",
  "west", "center", "east",
  "late", "south", "middle",
];

const PERIOD_UNIT: Record<Period, string> = { day: "日", month: "月", year: "年" };

const voidLabel = (cycle: number) => tenchuOf(cycle).branches.map((b) => BRANCHES[b]).join("");

function daiunChip(plan: DaiunPlan, dayStem: number, age: number): Fact {
  const current = daiunAt(plan, age);
  if (!current) return { key: "daiun", label: "大運", value: `立運前(${plan.startAge}歳から)`, refs: [] };
  const main = tenGodIndex(dayStem, stemOf(current.cycle));
  const sub = twelveStageIndex(dayStem, branchOf(current.cycle));
  return {
    key: "daiun",
    label: "大運",
    value: `${cycleName(current.cycle)}(${MAIN_STAR_NAMES[main]}・${SUB_STAR_NAMES[sub]}、${current.fromAge}〜${current.toAge}歳)`,
    refs: [mainRef(main)],
  };
}

function periodResult(
  period: Period,
  base: SanmeiNatal,
  today: LocalDate,
  daiun: { plan: DaiunPlan; age: number } | null,
  note?: string,
): PeriodResult {
  const cal = calendarPeriod(period, today);
  const c = cal.cycleIndex;
  const dayStem = stemOf(base.day);
  const main = tenGodIndex(dayStem, stemOf(c));
  const sub = twelveStageIndex(dayStem, branchOf(c));
  const tenchu = tenchuOf(base.day);
  const inVoid = tenchu.branches.includes(branchOf(c));
  const tenchuRef = ref(tenchuId(tenchu.number));
  const chips: Fact[] = [
    { key: "ganshi", label: GANSHI_LABEL[period], value: cycleName(c), refs: [] },
    { key: "main", label: "十大主星", value: MAIN_STAR_NAMES[main], refs: [mainRef(main)] },
    { key: "sub", label: "十二大従星", value: SUB_STAR_NAMES[sub], refs: [subRef(sub)] },
    inVoid
      ? { key: "tenchu", label: "天中殺", value: `該当(${voidLabel(base.day)})`, refs: [tenchuRef] }
      : { key: "tenchu", label: "天中殺", value: "該当しない", refs: [] },
  ];
  if (period === "year" && daiun) chips.push(daiunChip(daiun.plan, dayStem, daiun.age));
  return {
    period,
    rangeLabel: cal.rangeLabel,
    headline: inVoid
      ? { text: `${PERIOD_WORD[period]}は天中殺の${PERIOD_UNIT[period]}(${cycleName(c)})`, ref: tenchuRef }
      : {
          text: `${PERIOD_WORD[period]}の干支は${cycleName(c)}。日干${STEMS[dayStem]}から見て${MAIN_STAR_NAMES[main]}`,
          ref: mainRef(main),
        },
    chips,
    ...(note ? { note } : {}),
  };
}

export const sanmei: FortuneSystemModule = {
  id: "sanmei",
  name: "算命学",
  nameEn: "Sanmeigaku",
  read(profile, moment, today) {
    // 日柱は、時刻指定なら標準時(サマータイムは1時間戻す)の日付、それ以外は誕生日の暦日
    const hourKnown = isTimeKnown(profile.time);
    const natal = resolveOverRange(
      moment.range,
      jieBoundariesWithin(moment.range),
      (at) => sanmeiNatalAt(at, hourKnown ? standardDate(at) : moment.localDate),
      sameSanmeiNatal,
    );
    const fact = (key: string, label: string, format: (n: SanmeiNatal) => string, refsOf: (n: SanmeiNatal) => ElementRef[]) =>
      resolvedFact(natal, key, label, format, refsOf);

    const bodyFacts = Object.fromEntries(
      BODY.map(({ key, label, kind }) => [
        key,
        fact(
          key,
          label,
          (n) => (kind === "main" ? MAIN_STAR_NAMES : SUB_STAR_NAMES)[bodyStars(n)[key]],
          (n) => [(kind === "main" ? mainRef : subRef)(bodyStars(n)[key])],
        ),
      ]),
    ) as Record<BodyKey, Fact>;

    const base = representative(natal);
    // 宿命中殺・異常干支の「また、…」の一文。出生時刻の候補で結果が分かれるときは出さない
    const sameForAll = (text: (n: SanmeiNatal) => string | undefined) => {
      const texts = resolvedValues(natal).map(text);
      return texts.every((t) => t === texts[0]) ? texts[0] : undefined;
    };
    const highlights = [
      sameForAll((n) => shukumeiNote(shukumeiChusatsu(n).map((k) => SHUKUMEI_NAMES[k]))),
      sameForAll((n) => {
        const found = ijoKanshi(n);
        return ijoNote(
          found.map((m) => `${PILLAR_NAMES[m.pillar]}の${cycleName(m.cycleNumber - 1)}`),
          found.every((m) => m.kind === "angou"),
        );
      }),
    ].filter((t): t is string => t !== undefined);
    const daiunResolved = profile.gender ? resolveDaiun(natal, moment.range, profile.gender) : null;
    // 運勢の大運は代表の候補で計算し、候補に分かれるときは今年の運勢に注記を添える
    const plan = daiunResolved ? representative(daiunResolved) : null;

    const facts: Fact[] = [
      bodyFacts.center,
      fact("tenchu", "天中殺", (n) => TENCHU_NAMES[tenchuOf(n.day).number - 1], (n) => [ref(tenchuId(tenchuOf(n.day).number))]),
      fact("insen", "陰占", (n) => [n.year, n.month, n.day].map(cycleName).join("・"), () => []),
      bodyFacts.north,
      bodyFacts.east,
      bodyFacts.west,
      bodyFacts.south,
      bodyFacts.early,
      bodyFacts.middle,
      bodyFacts.late,
      ...(daiunResolved ? [resolvedFact(daiunResolved, "daiun", "大運", formatDaiunPlan, () => [])] : []),
      fact(
        "shukumei",
        "宿命中殺",
        (n) => shukumeiChusatsu(n).map((k) => SHUKUMEI_NAMES[k]).join("・") || "なし",
        (n) => shukumeiChusatsu(n).map((k) => ref(shukumeiId(k))),
      ),
      fact(
        "ijo",
        "異常干支",
        (n) =>
          ijoKanshi(n)
            .map((m) => `${cycleName(m.cycleNumber - 1)}(${PILLAR_NAMES[m.pillar]}・${m.kind === "normal" ? "通常" : "暗合"})`)
            .join("・") || "なし",
        (n) => ijoKanshi(n).map((m) => ref(ijoId(m.cycleNumber))),
      ),
      fact(
        "isou",
        "位相法",
        (n) =>
          isouho([branchOf(n.year), branchOf(n.month), branchOf(n.day)])
            .map((m) => `${m.pillars.map((p) => BRANCH_PILLAR_NAMES[p]).join("と")}が${ISOU_NAMES[m.kind]}`)
            .join("、") || "なし",
        (n) => isouho([branchOf(n.year), branchOf(n.month), branchOf(n.day)]).map((m) => ref(isouId(m.kind))),
      ),
    ];

    const chart: NatalChart = {
      kind: "body-stars",
      cells: LAYOUT.map((key) => {
        if (key === null) return null;
        const tone = key === "center" ? "center" : BODY_BY_KEY[key].kind;
        return { fact: bodyFacts[key], tone };
      }),
      factKeys: BODY.map((b) => b.key),
    };

    const daiun = plan ? { plan, age: ageOn(profile.date, today) } : null;
    return {
      id: "sanmei",
      name: "算命学",
      nameEn: "Sanmeigaku",
      method:
        "年・月・日の3柱(時柱は使わない)。年は立春、月は節入りで区切る。日柱の日付は、時刻指定時は標準時(サマータイムは1時間戻す。分が分からないときはその時の30分)、それ以外は誕生日の暦日。蔵干は二十八元を節入り日を1日目とする日数で選ぶ(高尾学館式。日数は標準時の日付で数える)。人体星図は頭=年干、腹=月干、左手(東)=年支蔵干、胸=月支蔵干、右手(西)=日支蔵干、十二大従星は年支=初年・月支=中年・日支=晩年。天中殺は日干支の旬で決める。宿命中殺は生年・生月・生日・日座・日居、異常干支は通常6種と暗合7種、位相法は支合・半会・方三位・対冲・刑・害・破。大運は節入り日までの日数÷3を四捨五入(1〜10歳)",
      natal: facts,
      ambiguous: isAmbiguous(natal),
      ...(highlights.length ? { highlights } : {}),
      chart,
      periods: {
        day: periodResult("day", base, today, daiun),
        month: periodResult("month", base, today, daiun),
        year: periodResult("year", base, today, daiun, daiunResolved ? daiunNote(daiunResolved) : undefined),
      },
    };
  },
};
