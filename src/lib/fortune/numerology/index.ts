// src/lib/fortune/numerology/index.ts
import { daysInMonth, formatSlash } from "../local-date";
import type { ElementRef, Fact, FortuneSystemModule } from "../types";
import { birthdayNumber, lifePath, numberId, personalDay, personalMonth, personalYear } from "./calc";

const ref = (n: number): ElementRef => ({ system: "numerology", id: numberId(n) });
const fact = (label: string, n: number): Fact => ({ label, value: String(n), refs: [ref(n)] });

export const numerology: FortuneSystemModule = {
  id: "numerology",
  name: "数秘術",
  nameEn: "Numerology",
  read(profile, _moment, today) {
    const lp = lifePath(profile.date);
    const bd = birthdayNumber(profile.date.day);
    const py = personalYear(profile.date, today.year);
    const pm = personalMonth(py, today.month);
    const pd = personalDay(pm, today.day);
    const lpFact = fact("ライフパス", lp);
    const lastDay = daysInMonth(today.year, today.month);

    return {
      id: "numerology",
      name: "数秘術",
      nameEn: "Numerology",
      method:
        "生年月日の全桁を一度に足す方式。11・22・33はマスターナンバーとして残す(パーソナルナンバーは1〜9に還元。年の区切りは1月1日)",
      natal: [lpFact, fact("バースデー", bd)],
      ambiguous: false,
      periods: {
        day: {
          period: "day",
          rangeLabel: formatSlash(today),
          headline: { text: `パーソナルデー${pd}`, ref: ref(pd) },
          chips: [fact("パーソナルデー", pd), lpFact],
        },
        month: {
          period: "month",
          rangeLabel: `${formatSlash({ ...today, day: 1 })}〜${formatSlash({ ...today, day: lastDay })}`,
          headline: { text: `パーソナルマンス${pm}`, ref: ref(pm) },
          chips: [fact("パーソナルマンス", pm), lpFact],
        },
        year: {
          period: "year",
          rangeLabel: `${today.year}/1/1〜${today.year}/12/31`,
          headline: { text: `パーソナルイヤー${py}`, ref: ref(py) },
          chips: [fact("パーソナルイヤー", py), lpFact],
        },
      },
    };
  },
};
