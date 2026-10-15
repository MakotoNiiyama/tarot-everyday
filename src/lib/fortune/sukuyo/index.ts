// src/lib/fortune/sukuyo/index.ts
import { midpoint } from "../ambiguity";
import { lunarMonthSpan, lunarNewYear, lunarYearOf, toLunar } from "../astro/lunar-calendar";
import { RELATION_KINDS, mansionId, relationId } from "../element-ids";
import { addDays, formatSlash, mod, type LocalDate } from "../local-date";
import { PERIOD_WORD } from "../period-labels";
import { standardDate } from "../tokyo-time";
import type { ElementRef, Fact, FortuneSystemModule, Period, PeriodResult } from "../types";
import { MANSION_NAMES, RELATION_NAMES, lunarMonthMansion, relationIndex, tableMethod, yearMansion, type MansionMethod } from "./calc";

/** 本命宿の求め方(差し替えるときはここを変える) */
const method: MansionMethod = tableMethod;

const ref = (id: string): ElementRef => ({ system: "sukuyo", id });
const mansionRef = (m: number) => ref(mansionId(m + 1));
const relationRef = (r: number) => ref(relationId(RELATION_KINDS[r]));
const mansionFact = (key: string, label: string, m: number): Fact => ({ key, label, value: MANSION_NAMES[m], refs: [mansionRef(m)] });

const MANSION_LABEL: Record<Period, string> = { day: "今日の宿", month: "今月の宿", year: "今年の宿" };

function periodResult(period: Period, honmei: number, today: LocalDate): PeriodResult {
  let mansion: number;
  let relation: number;
  let rangeLabel: string;
  let subject: string;
  if (period === "day") {
    mansion = method(today);
    relation = relationIndex(honmei, mansion);
    rangeLabel = formatSlash(today);
    subject = `今日の宿は${MANSION_NAMES[mansion]}`;
  } else if (period === "month") {
    mansion = lunarMonthMansion(toLunar(today).month);
    relation = relationIndex(honmei, mansion);
    const span = lunarMonthSpan(today);
    rangeLabel = `${formatSlash(span.start)}〜${formatSlash(span.end)}`;
    subject = `${PERIOD_WORD.month}は${MANSION_NAMES[mansion]}の月`;
  } else {
    const year = lunarYearOf(today);
    mansion = yearMansion(year);
    // 年運だけは年の宿から本命宿までの距離で数える
    relation = relationIndex(mansion, honmei);
    rangeLabel = `${formatSlash(lunarNewYear(year))}〜${formatSlash(addDays(lunarNewYear(year + 1), -1))}`;
    subject = `${PERIOD_WORD.year}は${MANSION_NAMES[mansion]}の年`;
  }
  return {
    period,
    rangeLabel,
    headline: { text: `${subject}。本命宿との関係は「${RELATION_NAMES[relation]}」`, ref: relationRef(relation) },
    chips: [
      mansionFact("mansion", MANSION_LABEL[period], mansion),
      { key: "relation", label: "本命宿との関係", value: RELATION_NAMES[relation], refs: [relationRef(relation)] },
    ],
  };
}

export const sukuyo: FortuneSystemModule = {
  id: "sukuyo",
  name: "宿曜",
  nameEn: "Sukuyo",
  read(profile, moment, today) {
    // 時刻を指定したときは標準時(サマータイムは1時間戻す)の日付、それ以外は入力された誕生日
    const birthDate = profile.time.kind === "hour" ? standardDate(midpoint(moment.range)) : moment.localDate;
    const honmei = method(birthDate);
    const lunar = toLunar(birthDate);
    return {
      id: "sukuyo",
      name: "宿曜",
      nameEn: "Sukuyo",
      method:
        "27宿(牛宿を除く)。本命宿と日の宿は旧暦の月ごとの1日の宿(1月 室宿 … 12月 虚宿)から日ごとに1つ進める表の方式で、閏月は同じ名前の月の表を使う。月の宿はその旧暦月の1日の宿。年の宿は旧正月ごとに1つ進む28年周期(2011年 = 女宿。牛宿の年は斗宿とする)。関係は三九の秘法で、日・月は本命宿から、年は年の宿から数える。旧暦は朔と中気から求める(2033年は閏11月案)。生まれた日は、時刻を指定したときは標準時の日付、それ以外は誕生日",
      natal: [
        mansionFact("honmei", "本命宿", honmei),
        mansionFact("gyo", "業宿", mod(honmei + 9, 27)),
        mansionFact("tai", "胎宿", mod(honmei + 18, 27)),
        { key: "lunar-birthday", label: "旧暦の誕生日", value: `${lunar.leap ? "閏" : ""}${lunar.month}月${lunar.day}日`, refs: [] },
      ],
      ambiguous: false,
      periods: {
        day: periodResult("day", honmei, today),
        month: periodResult("month", honmei, today),
        year: periodResult("year", honmei, today),
      },
    };
  },
};
