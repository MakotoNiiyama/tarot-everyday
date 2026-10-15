import { SearchMoonPhase } from "astronomy-engine";
import { isAmbiguous, resolveOverRange } from "../ambiguity";
import { bodyId, houseId, signId } from "../element-ids";
import { resolvedFact } from "../fact";
import { daysInMonth, formatSlash, type LocalDate } from "../local-date";
import { PERIOD_WORD } from "../period-labels";
import { formatTokyoHm, tokyoParts, tokyoToUtc } from "../tokyo-time";
import type { BirthTime, ElementRef, Fact, FortuneSystemModule, NatalChart, PeriodResult, Resolved, TimeRange } from "../types";
import { ASPECTS, findAspects } from "./aspects";
import { bodyLongitude, bodyPosition } from "./ephemeris";
import { HOUSE_SYSTEMS, angles, cusps, houseOf, type HouseSystem, type Place } from "./houses";
import { BODIES, SIGNS, formatDegree, signOf, type BodyKey } from "./zodiac";

const ref = (id: string): ElementRef => ({ system: "horoscope", id });
const signRef = (s: number) => ref(signId(SIGNS[s].key));
const houseRef = (n: number) => ref(houseId(n));
const signName = (s: number): string => SIGNS[s].name;

const BODY_NAME = Object.fromEntries(BODIES.map((b) => [b.key, b.name])) as Record<BodyKey, string>;
const POINT_NAME: Record<string, string> = { ...BODY_NAME, asc: "ASC", mc: "MC" };
const ASPECT_NAME = Object.fromEntries(ASPECTS.map((a) => [a.kind, a.name])) as Record<string, string>;

const HALF_HOUR = 30 * 60_000;
const MINUTE = 60_000;

/**
 * 範囲の中で星座(黄経 ÷ 30)が変わる時刻。30分ごとに区切って星座が変わる区間を見つけ、
 * 二分法で1分以内まで詰める
 */
export function signChangesWithin(range: TimeRange, lonAt: (at: Date) => number): Date[] {
  const result: Date[] = [];
  const end = range.end.getTime();
  let t0 = range.start.getTime();
  let s0 = signOf(lonAt(range.start));
  while (t0 < end) {
    const t1 = Math.min(t0 + HALF_HOUR, end);
    const s1 = signOf(lonAt(new Date(t1)));
    if (s1 !== s0) {
      let lo = t0;
      let hi = t1;
      while (hi - lo > MINUTE) {
        const mid = (lo + hi) / 2;
        if (signOf(lonAt(new Date(mid))) === s0) lo = mid;
        else hi = mid;
      }
      result.push(new Date(hi));
    }
    t0 = t1;
    s0 = s1;
  }
  return result;
}

/** ASC・ハウスの計算に使う代表の時刻(日本時間)と、仮計算の注記 */
function representativeHour(time: BirthTime): { hour: number; minute: number; note?: string } {
  switch (time.kind) {
    case "hour":
      return { hour: time.hour, minute: 30 };
    case "half":
      return time.half === "am"
        ? { hour: 6, minute: 0, note: "出生時刻が午前のため6時で仮計算" }
        : { hour: 18, minute: 0, note: "出生時刻が午後のため18時で仮計算" };
    case "unknown":
      return { hour: 12, minute: 0, note: "出生時刻不明のため正午で仮計算" };
  }
}

/** 天体の星座を範囲の中で判定する(範囲の中で変わる天体は候補になる) */
function resolveSign(range: TimeRange, lonAt: (at: Date) => number): Resolved<number> {
  return resolveOverRange(range, signChangesWithin(range, lonAt), (at) => signOf(lonAt(at)), (a, b) => a === b);
}

const noon = (d: LocalDate) => tokyoToUtc(d.year, d.month, d.day, 12, 0);
const monthDay = (at: Date) => {
  const p = tokyoParts(at);
  return `${p.month}/${p.day}`;
};
/** 天体の黄経(キロンの範囲外は使わないので、ここでは数値として扱う) */
const lonOf = (body: BodyKey) => (at: Date) => bodyLongitude(body, at) ?? NaN;

function dayResult(today: LocalDate, natalCusps: number[]): PeriodResult {
  const moonLon = lonOf("moon");
  const lon = moonLon(noon(today));
  const sign = signOf(lon);
  const house = houseOf(lon, natalCusps);
  const range = {
    start: tokyoToUtc(today.year, today.month, today.day, 0, 0),
    end: tokyoToUtc(today.year, today.month, today.day, 24, 0),
  };
  const changes = signChangesWithin(range, moonLon);
  let value = signName(sign);
  let refs = [signRef(sign)];
  if (changes.length > 0) {
    const from = signOf(moonLon(range.start));
    const to = signOf(moonLon(changes[0]));
    value = `${signName(from)}→${signName(to)}(${formatTokyoHm(changes[0])}〜)`;
    refs = [signRef(from), signRef(to)];
  }
  return {
    period: "day",
    rangeLabel: formatSlash(today),
    headline: { text: `${PERIOD_WORD.day}の月は${signName(sign)}。あなたの第${house}ハウスを通過`, ref: houseRef(house) },
    chips: [
      { key: "moon-sign", label: "今日の月", value, refs },
      { key: "moon-house", label: "月のハウス", value: `第${house}ハウス`, refs: [houseRef(house)] },
    ],
  };
}

/** 範囲の中の新月(0)・満月(180)の瞬間 */
function moonPhasesWithin(range: TimeRange, phase: 0 | 180): Date[] {
  const result: Date[] = [];
  let from = range.start;
  for (;;) {
    const found = SearchMoonPhase(phase, from, (range.end.getTime() - from.getTime()) / 86_400_000);
    if (!found || found.date >= range.end) break;
    result.push(found.date);
    from = new Date(found.date.getTime() + 86_400_000);
  }
  return result;
}

function monthResult(today: LocalDate, natalCusps: number[]): PeriodResult {
  const { year, month } = today;
  const last = daysInMonth(year, month);
  const range = { start: tokyoToUtc(year, month, 1, 0, 0), end: tokyoToUtc(year, month, last, 24, 0) };
  const moonLon = lonOf("moon");
  const phaseFact = (key: string, label: string, phase: 0 | 180): { fact: Fact; first?: { at: Date; sign: number; house: number } } => {
    const events = moonPhasesWithin(range, phase).map((at) => {
      const lon = moonLon(at);
      return { at, sign: signOf(lon), house: houseOf(lon, natalCusps) };
    });
    const value = events.length
      ? events.map((e) => `${monthDay(e.at)} ${signName(e.sign)}・第${e.house}ハウス`).join("、")
      : "なし";
    const refs = events.flatMap((e) => [signRef(e.sign), houseRef(e.house)]);
    return { fact: { key, label, value, refs }, first: events[0] };
  };
  const newMoon = phaseFact("new-moon", "新月", 0);
  const fullMoon = phaseFact("full-moon", "満月", 180);
  const marsLon = lonOf("mars")(noon({ year, month, day: 15 }));
  const marsSign = signOf(marsLon);
  const marsHouse = houseOf(marsLon, natalCusps);
  const lead = newMoon.first ? { word: "新月", ...newMoon.first } : { word: "満月", ...fullMoon.first! };
  return {
    period: "month",
    rangeLabel: `${formatSlash({ year, month, day: 1 })}〜${formatSlash({ year, month, day: last })}`,
    headline: {
      text: `${PERIOD_WORD.month}の${lead.word}は${monthDay(lead.at)}、${signName(lead.sign)}。あなたの第${lead.house}ハウスで迎える`,
      ref: houseRef(lead.house),
    },
    chips: [
      newMoon.fact,
      fullMoon.fact,
      { key: "mars", label: "火星", value: `${signName(marsSign)}・第${marsHouse}ハウス`, refs: [signRef(marsSign), houseRef(marsHouse)] },
    ],
  };
}

/**
 * 範囲の中で星座が変わる瞬間をすべて返す(1日ごとに調べ、両端で星座が違う日の中を二分法で詰める)。
 * 木星・土星は1日に 0.25 度ほどしか動かないので、1日の中で行って戻ることは考えない
 */
function signChangesByDay(start: Date, end: Date, lonAt: (at: Date) => number): Date[] {
  const DAY = 86_400_000;
  const result: Date[] = [];
  let s0 = signOf(lonAt(start));
  for (let t = start.getTime(); t < end.getTime(); t += DAY) {
    const next = Math.min(t + DAY, end.getTime());
    const s1 = signOf(lonAt(new Date(next)));
    if (s1 !== s0) {
      const found = signChangesWithin({ start: new Date(t), end: new Date(next) }, lonAt);
      result.push(...(found.length ? found : [new Date(next)]));
    }
    s0 = s1;
  }
  return result;
}

function yearResult(today: LocalDate, natalCusps: number[]): PeriodResult {
  const start = tokyoToUtc(today.year, 1, 1, 0, 0);
  const end = tokyoToUtc(today.year + 1, 1, 1, 0, 0);
  const chip = (body: "jupiter" | "saturn"): { fact: Fact; house: number } => {
    const lonAt = lonOf(body);
    const lon = lonAt(noon(today));
    const sign = signOf(lon);
    const house = houseOf(lon, natalCusps);
    // 年の中で星座が変わるときは「魚座→牡羊座(5/25〜)→魚座(9/1〜)」のようにつなぐ
    const steps = [{ sign: signOf(lonAt(start)), label: "" }].concat(
      signChangesByDay(start, end, lonAt).map((at) => ({ sign: signOf(lonAt(at)), label: `(${monthDay(at)}〜)` })),
    );
    const signs = steps.length > 1 ? steps.map((x) => `${signName(x.sign)}${x.label}`).join("→") : signName(sign);
    const refs = [...new Set(steps.length > 1 ? steps.map((x) => x.sign) : [sign])].map(signRef);
    return { fact: { key: body, label: BODY_NAME[body], value: `${signs}・第${house}ハウス`, refs: [...refs, houseRef(house)] }, house };
  };
  const jupiter = chip("jupiter");
  const saturn = chip("saturn");
  return {
    period: "year",
    rangeLabel: `${formatSlash({ year: today.year, month: 1, day: 1 })}〜${formatSlash({ year: today.year, month: 12, day: 31 })}`,
    headline: { text: `${PERIOD_WORD.year}の木星はあなたの第${jupiter.house}ハウスを運行`, ref: houseRef(jupiter.house) },
    chips: [jupiter.fact, saturn.fact],
  };
}

const withNote = (result: PeriodResult, note: string | undefined): PeriodResult => (note ? { ...result, note } : result);

const NATAL_LABEL: Partial<Record<BodyKey, string>> = { sun: "太陽星座", moon: "月星座" };

const METHOD =
  "トロピカル。地心の視黄経(その日の真の黄道)。天体は10天体+ドラゴンヘッド(真)・キロン(JPL Horizons の表)・リリス(平均)。ハウスは Placidus(Koch・ホールサインに切り替え可)。出生時刻が不明・午前午後のときは正午・6時・18時で仮計算。アスペクトは主要5種+150度(マイナーは30・45・72・135・144度)。オーブは太陽・月を含む組で 0・180度 10、90・120度 8、60度 6、150度 3、マイナー 2、含まない組は 2 ずつ狭い(150度とマイナーは同じ)。感受点は主要5種・オーブ3";

export const horoscope: FortuneSystemModule = {
  id: "horoscope",
  name: "西洋占星術",
  nameEn: "Horoscope",
  read(profile, moment, today) {
    const { date } = profile;
    const rep = representativeHour(profile.time);
    const at = tokyoToUtc(date.year, date.month, date.day, rep.hour, rep.minute);
    const place: Place = { lat: moment.location.lat, lon: moment.location.lon };
    const notes = [...(rep.note ? [rep.note] : []), ...(moment.location.isDefault ? ["出生地未入力のため明石基準"] : [])];

    const houseCusps = Object.fromEntries(HOUSE_SYSTEMS.map((s) => [s, cusps(s, at, place)])) as Record<HouseSystem, number[]>;
    const { asc, mc } = angles(at, place);

    // 天体(キロンが表の範囲外なら出さない)
    const bodies = BODIES.flatMap(({ key, name }) => {
      const pos = bodyPosition(key, at);
      if (!pos) return [];
      const resolved = resolveSign(moment.range, lonOf(key));
      const fact = resolvedFact(resolved, key, NATAL_LABEL[key] ?? name, signName, (s) => [signRef(s), ref(bodyId(key))]);
      const houses = Object.fromEntries(HOUSE_SYSTEMS.map((s) => [s, houseOf(pos.lon, houseCusps[s])])) as Record<HouseSystem, number>;
      return [{ key, name, lon: pos.lon, retrograde: pos.retrograde, houses, fact, resolved }];
    });

    // ASC は時刻を指定したときだけ、その1時間で候補にする
    const ascResolved: Resolved<number> =
      profile.time.kind === "hour"
        ? resolveSign(moment.range, (t) => angles(t, place).asc)
        : { kind: "fixed", value: signOf(asc) };
    // 出生時刻を仮に置いたときは、その時刻に左右される ASC・MC・天体の位置の要約に印を付ける
    const provisional = (s: number) => `${signName(s)}${rep.note ? "(仮)" : ""}`;
    const ascFact = resolvedFact(ascResolved, "asc", "ASC", provisional, (s) => [signRef(s)]);
    const mcFact: Fact = { key: "mc", label: "MC", value: provisional(signOf(mc)), refs: [signRef(signOf(mc))] };

    const points = [...bodies.map((b) => ({ key: b.key, lon: b.lon })), { key: "asc", lon: asc }, { key: "mc", lon: mc }];
    const aspects = findAspects(points).map((a) => ({ ...a, name: ASPECT_NAME[a.kind] }));

    const placidus = houseCusps.placidus;
    // 運勢のハウスは本命のカスプで決めるので、出生時刻が仮なら運勢にも注記する
    const houseNote = rep.note ? `ハウスは${rep.note}` : undefined;
    const positionsFact: Fact = {
      key: "positions",
      label: "天体の位置",
      value: (rep.note ? `${rep.note}: ` : "") + [
        ...bodies.map((b) => `${b.name} ${signName(signOf(b.lon))}${formatDegree(b.lon)}(第${b.houses.placidus}ハウス)`),
        `ASC ${signName(signOf(asc))}${formatDegree(asc)}`,
        `MC ${signName(signOf(mc))}${formatDegree(mc)}`,
      ].join("、"),
      refs: [],
    };
    const majorAspects = aspects.filter((a) => !a.minor);
    const aspectsFact: Fact = {
      key: "aspects",
      label: "主なアスペクト",
      value: majorAspects.length
        ? majorAspects.map((a) => `${POINT_NAME[a.a]}-${POINT_NAME[a.b]} ${a.name}(${a.orb.toFixed(1)}°)`).join("、")
        : "なし",
      refs: [],
    };

    const factOf = (key: BodyKey) => bodies.find((b) => b.key === key)!.fact;
    const others = bodies.filter((b) => b.key !== "sun" && b.key !== "moon");
    const natal: Fact[] = [factOf("sun"), factOf("moon"), ascFact, mcFact, ...others.map((b) => b.fact), positionsFact, aspectsFact];

    const chart: NatalChart = {
      kind: "horoscope",
      bodies: bodies.map(({ key, name, lon, retrograde, houses, fact }) => ({ key, name, lon, retrograde, houses, fact })),
      asc,
      mc,
      cusps: houseCusps,
      aspects,
      notes,
      factKeys: ["mc", ...others.map((b) => b.key), "positions", "aspects"],
    };

    return {
      id: "horoscope",
      name: "西洋占星術",
      nameEn: "Horoscope",
      method: METHOD,
      natal,
      periods: {
        day: withNote(dayResult(today, placidus), houseNote),
        month: withNote(monthResult(today, placidus), houseNote),
        year: withNote(yearResult(today, placidus), houseNote),
      },
      ambiguous: isAmbiguous(ascResolved) || bodies.some((b) => isAmbiguous(b.resolved)),
      chart,
    };
  },
};
