// src/lib/fortune/maya/index.ts
import { addDays, formatSlash, type LocalDate } from "../local-date";
import type { ElementRef, Fact, FortuneSystemModule } from "../types";
import {
  MOON_NAMES,
  SEAL_NAMES,
  TONE_NAMES,
  analogKin,
  antipodeKin,
  guideKin,
  kinOf,
  lastBirthday,
  occultKin,
  sealOf,
  thirteenMoon,
  toneOf,
  wavespellSeal,
} from "./calc";

/** 早見表の項目 id(1C の辞書データと一致させる)。moonId(0) は時間をはずした日 */
export const sealId = (n: number) => `seal-${n}`;
export const toneId = (n: number) => `tone-${n}`;
export const moonId = (n: number) => `moon-${n}`;

const ref = (id: string): ElementRef => ({ system: "maya", id });
const sealName = (kin: number) => SEAL_NAMES[sealOf(kin) - 1];
const kinFact = (label: string, kin: number): Fact => ({
  label,
  value: `${kin} ${sealName(kin)}`,
  refs: [ref(sealId(sealOf(kin)))],
});

export const maya: FortuneSystemModule = {
  id: "maya",
  name: "マヤ暦",
  nameEn: "Tzolkin",
  read(profile, _moment, today) {
    const kin = kinOf(profile.date);
    const tone = toneOf(kin);
    const wave = wavespellSeal(kin);
    const natal: Fact[] = [
      { label: "KIN", value: String(kin), refs: [ref(sealId(sealOf(kin)))] },
      { label: "太陽の紋章", value: sealName(kin), refs: [ref(sealId(sealOf(kin)))] },
      { label: "銀河の音", value: `${tone}(${TONE_NAMES[tone - 1]})`, refs: [ref(toneId(tone))] },
      { label: "ウェイブスペル", value: SEAL_NAMES[wave - 1], refs: [ref(sealId(wave))] },
      kinFact("ガイドKIN", guideKin(kin)),
      kinFact("類似KIN", analogKin(kin)),
      kinFact("反対KIN", antipodeKin(kin)),
      kinFact("神秘KIN", occultKin(kin)),
    ];
    const birthKinFact: Fact = { label: "本命KIN", value: `${kin} ${sealName(kin)}`, refs: [ref(sealId(sealOf(kin)))] };

    const todayKin = kinOf(today);
    const moon = thirteenMoon(today);
    const birthday = lastBirthday(profile.date, today);
    // 次の誕生日 = birthday より後で最初の誕生日(2月29日生まれは平年2月28日・閏年2月29日を正しく扱う)
    const nextBirthday = lastBirthday(profile.date, { year: birthday.year + 1, month: 12, day: 31 });
    const yearKin = kinOf(birthday);
    const yearEnd: LocalDate = addDays(nextBirthday, -1);

    return {
      id: "maya",
      name: "マヤ暦",
      nameEn: "Tzolkin",
      method: "13の月の暦(ドリームスペル)系。2月29日は数えない(2月28日と同じKIN)。年回りKINは直近の誕生日のKIN",
      natal,
      ambiguous: false,
      periods: {
        day: {
          period: "day",
          rangeLabel: formatSlash(today),
          headline: { text: `今日のKINは${sealName(todayKin)}・音${toneOf(todayKin)}`, ref: ref(sealId(sealOf(todayKin))) },
          chips: [
            kinFact("今日のKIN", todayKin),
            { label: "銀河の音", value: String(toneOf(todayKin)), refs: [ref(toneId(toneOf(todayKin)))] },
            birthKinFact,
          ],
        },
        month: moon.moon
          ? {
              period: "month",
              rangeLabel: `13の月の暦 第${moon.moon}の月`,
              headline: { text: `13の月の暦 第${moon.moon}の月(${MOON_NAMES[moon.moon - 1]})`, ref: ref(moonId(moon.moon)) },
              chips: [
                { label: `第${moon.moon}の月`, value: MOON_NAMES[moon.moon - 1], refs: [ref(moonId(moon.moon))] },
                { label: "ウェイブスペル", value: SEAL_NAMES[wave - 1], refs: [ref(sealId(wave))] },
              ],
            }
          : {
              period: "month",
              rangeLabel: "13の月の暦 時間をはずした日",
              headline: { text: "時間をはずした日", ref: ref(moonId(0)) },
              chips: [{ label: "13の月の暦", value: "時間をはずした日", refs: [ref(moonId(0))] }],
            },
        year: {
          period: "year",
          rangeLabel: `${formatSlash(birthday)}〜${formatSlash(yearEnd)}`,
          headline: { text: `年回りはKIN ${yearKin} ${sealName(yearKin)}`, ref: ref(sealId(sealOf(yearKin))) },
          chips: [kinFact("年回りKIN", yearKin), birthKinFact],
        },
      },
    };
  },
};
