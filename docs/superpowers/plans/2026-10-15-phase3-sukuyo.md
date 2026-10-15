# フェーズ3 宿曜 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 運勢ページ・ホーム・早見表に宿曜(27宿、三九の秘法)を追加する。

**Architecture:** 旧暦への変換を `src/lib/fortune/astro/lunar-calendar.ts`(astronomy-engine の朔と二十四節気の中気から求める)として作り、宿曜モジュール `src/lib/fortune/sukuyo/` は既存の占術モジュール(`FortuneSystemModule`)の形に合わせる。本命宿の求め方は関数1つ(`MansionMethod`)に閉じ込め、将来は月の黄経から求める方式に差し替えられるようにする。

**Tech Stack:** Next.js 16.2.1(静的エクスポート)/ React 19.2 / TypeScript / astronomy-engine / Vitest / Playwright

設計書: `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`(§3・§3.1・§7・§11.1)

---

## 決定事項

調査(出典は下記)とユーザーとの確認で次のとおり決めた。設計書にも反映する(Task 6)。

| 項目 | 決定 |
|---|---|
| 27宿の順 | 昴 畢 觜 参 井 鬼 柳 星 張 翼 軫 角 亢 氐 房 心 尾 箕 斗 女 虚 危 室 壁 奎 婁 胃(番号 0〜26) |
| 本命宿・日の宿 | 旧暦の月ごとの1日の宿(1月 室、2月 奎、3月 胃、4月 畢、5月 参、6月 鬼、7月 張、8月 角、9月 氐、10月 心、11月 斗、12月 虚)から、日が1つ進むごとに次の宿へ。閏月は同じ名前の月の表を使う |
| 月の宿 | その旧暦月の1日の宿(表の起点)。期間はその旧暦月の1日〜末日 |
| 年の宿 | 旧正月ごとに1つ進む28年周期。2011年(旧暦の年)= 女宿を起点に、k = (旧暦の年 − 2011) mod 28 が 27 の年は牛宿の年で、斗宿として扱う(ユーザー確認済み。光晴堂の方式)。それ以外は (19 + k) mod 27 の宿 |
| 三九の秘法 | 距離 0 = 命、9 = 業、18 = 胎、それ以外は (距離 mod 9) が 1〜8 の順に 栄 衰 安 危 成 壊 友 親 |
| 関係の向き | 日・月は「本命宿から、その日・月の宿まで」の距離 (宿 − 本命宿) mod 27。**年だけは逆**で「年の宿から本命宿まで」の距離 (本命宿 − 年の宿) mod 27 |
| 旧暦 | 朔の日(日本の標準時の日付)を1日、冬至を含む月を11月。冬至から次の冬至までに朔が13回あるときは、11月の次から数えて最初に中気を含まない月を閏月にする(2033年は閏11月案と一致する) |
| 生まれた日の日付 | 時刻を指定したときは標準時(サマータイムは1時間戻す)の日付、不明・午前午後のときは入力された誕生日(四柱推命・算命学と同じ)。日付だけで決まるので人物像は候補に分かれない |

出典: Wikipedia「二十七宿」、senjutsu.jp、divination.page、lmp.jp(閏月)、mokuryuu / nakshatra.tokyo / stellica(三九の秘法)、moonlabo(日の宿)、kosei-do.co.jp(年運・月運)、国立天文台・暦文協(2033年問題)。

## 検証用の固定値(試作で確認済み)

- 1990/3/29 は旧暦 3月3日(旧3月1日 = 1990/3/27)→ 胃(26) + 2 = 畢宿(1)。業宿 = 軫宿(10)、胎宿 = 女宿(19)。
- 2026/10/14 は旧暦 9月4日(旧9月 = 2026/10/11〜11/8)→ 氐(13) + 3 = 尾宿(16)。畢から 15 → 壊。
- 2026年の旧9月の宿は氐宿(13)。畢から 12 → 安。
- 2026年(旧暦の年。2026/2/17〜2027/2/6)は星宿(7)。逆向きに (1 − 7) mod 27 = 21 → 安。
- 1986/10/19 = 旧暦9月16日 → 畢宿。2026/10/1(旧8月21日)= 井宿、2026/10/31(旧9月21日)= 柳宿。
- 2023/3/22 = 旧暦 閏2月1日 → 奎宿。2033/12/22 = 閏11月1日。2026/2/17・2000/2/5 = 1月1日。2025/7/25 = 閏6月1日。
- 年の宿: 2009 斗、2010 斗(牛宿の年)、2011 女、2016 奎、2026 星。2026年の年運で、本命宿が婁なら胎、井・氐・室なら壊。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `src/lib/fortune/astro/lunar-calendar.ts`(新規) | 旧暦への変換、旧暦月の期間、旧正月の日付 |
| `src/lib/fortune/element-ids.ts`(変更) | 宿曜の早見表の項目 id |
| `src/lib/fortune/sukuyo/calc.ts`(新規) | 27宿、本命宿の求め方(差し替え可能)、三九の関係、年の宿 |
| `src/lib/fortune/sukuyo/index.ts`(新規) | 宿曜の読み取り(人物像・運勢) |
| `src/data/guide/sukuyo.ts`(新規) | 早見表の辞書(38項目) |
| `src/data/guide/types.ts`・`index.ts`(変更) | 早見表のタブに宿曜を追加 |
| `src/lib/fortune/registry.ts`・`system-names.ts`(変更) | 宿曜の登録 |
| `src/components/home-fortune-chips.tsx`(変更) | ホームのチップに宿曜の関係を足す |

テスト: `npx vitest run <path>`。lint: `npx eslint <path>`。E2E: `npx playwright test`(ポート3100。3200の dev サーバーは止めてから)。

---

### Task 1: 旧暦への変換

**Files:**
- Create: `src/lib/fortune/astro/lunar-calendar.ts`
- Test: `src/lib/fortune/astro/__tests__/lunar-calendar.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/astro/__tests__/lunar-calendar.test.ts
import { describe, it, expect } from "vitest";
import { lunarMonthSpan, lunarNewYear, lunarYearOf, toLunar } from "../lunar-calendar";

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("toLunar", () => {
  it.each([
    [d(2026, 2, 17), { month: 1, leap: false, day: 1 }],
    [d(2000, 2, 5), { month: 1, leap: false, day: 1 }],
    [d(1990, 3, 29), { month: 3, leap: false, day: 3 }],
    [d(2026, 10, 14), { month: 9, leap: false, day: 4 }],
    [d(1986, 10, 19), { month: 9, leap: false, day: 16 }],
    [d(2026, 10, 1), { month: 8, leap: false, day: 21 }],
    [d(2023, 3, 22), { month: 2, leap: true, day: 1 }],
    [d(2023, 4, 20), { month: 3, leap: false, day: 1 }],
    [d(2025, 7, 25), { month: 6, leap: true, day: 1 }],
    [d(2025, 6, 24), { month: 5, leap: false, day: 29 }],
  ])("%o は旧暦 %o", (date, expected) => {
    expect(toLunar(date)).toMatchObject(expected);
  });

  it("2033年問題は閏11月案になること", () => {
    expect(toLunar(d(2033, 12, 22))).toMatchObject({ month: 11, leap: true, day: 1 });
    expect(toLunar(d(2034, 1, 1))).toMatchObject({ month: 11, leap: true, day: 11 });
    expect(toLunar(d(2034, 2, 19))).toMatchObject({ month: 1, leap: false, day: 1 });
  });

  it("旧暦の年は旧正月で切り替わること", () => {
    expect(toLunar(d(2026, 2, 16)).year).toBe(2025);
    expect(toLunar(d(2026, 2, 17)).year).toBe(2026);
    expect(lunarYearOf(d(2027, 2, 6))).toBe(2026);
  });
});

describe("lunarMonthSpan / lunarNewYear", () => {
  it("その日を含む旧暦月の1日〜末日", () => {
    expect(lunarMonthSpan(d(2026, 10, 14))).toEqual({ start: d(2026, 10, 11), end: d(2026, 11, 8) });
  });

  it("旧正月の日付", () => {
    expect(lunarNewYear(2026)).toEqual(d(2026, 2, 17));
    expect(lunarNewYear(2027)).toEqual(d(2027, 2, 7));
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/astro/__tests__/lunar-calendar.test.ts`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/astro/lunar-calendar.ts
import { SearchMoonPhase } from "astronomy-engine";
import { fromJdn, toJdn, type LocalDate } from "../local-date";
import { standardDate } from "../tokyo-time";
import { solarLongitudeTime } from "./solar-terms";

/** 旧暦の年月日。year は旧正月で切り替わる年 */
export interface LunarDate {
  year: number;
  month: number;
  leap: boolean;
  day: number;
}

interface LunarMonth {
  /** 1日のユリウス日 */
  start: number;
  month: number;
  leap: boolean;
}

/** 標準時(UTC+9)の日付のユリウス日 */
const jdnOf = (at: Date) => toJdn(standardDate(at));

/** ユリウス日 jdn の日本時間0時 */
const instantOf = (jdn: number) => new Date((jdn - 2440588) * 86_400_000 - 9 * 3_600_000);

/** jdn より後(翌日以降)で最初の朔の日 */
function nextNewMoon(jdn: number): number {
  const found = SearchMoonPhase(0, instantOf(jdn + 1), 40);
  if (!found) throw new Error("朔が見つかりません");
  return jdnOf(found.date);
}

/** jdn 以前で最後の朔の日 */
function newMoonOnOrBefore(jdn: number): number {
  let last = nextNewMoon(jdn - 32);
  for (let next = nextNewMoon(last); next <= jdn; next = nextNewMoon(next)) last = next;
  return last;
}

/** 西暦 year の冬至を含む旧暦月(11月)の1日 */
const winterMonthStart = (year: number) => newMoonOnOrBefore(jdnOf(solarLongitudeTime(year, 270)));

/** [a, b) の日付に中気(太陽黄経が30度の倍数になる日)があるか */
function hasChuki(a: number, b: number, years: number[]): boolean {
  return years.some((y) =>
    Array.from({ length: 12 }, (_, k) => jdnOf(solarLongitudeTime(y, k * 30))).some((c) => c >= a && c < b),
  );
}

const cache = new Map<number, LunarMonth[]>();

/**
 * 西暦 year の冬至を含む月(11月)から、次の冬至を含む月の前までの旧暦月。
 * 朔が13回あるときは、11月の次から数えて最初に中気を含まない月を閏月にする(2033年は閏11月案と一致する)
 */
function monthsFromWinter(year: number): LunarMonth[] {
  const cached = cache.get(year);
  if (cached) return cached;
  const end = winterMonthStart(year + 1);
  const starts = [winterMonthStart(year)];
  for (let n = nextNewMoon(starts[0]); n < end; n = nextNewMoon(n)) starts.push(n);
  const edges = [...starts, end];
  const hasLeap = starts.length === 13;
  const months: LunarMonth[] = [];
  let month = 10;
  let leapUsed = false;
  for (let i = 0; i < starts.length; i++) {
    if (hasLeap && !leapUsed && i > 0 && !hasChuki(edges[i], edges[i + 1], [year, year + 1])) {
      months.push({ start: starts[i], month, leap: true });
      leapUsed = true;
      continue;
    }
    month = (month % 12) + 1;
    months.push({ start: starts[i], month, leap: false });
  }
  cache.set(year, months);
  return months;
}

/** jdn を含む旧暦月と、その次の月の1日 */
function monthAt(jdn: number): { month: LunarMonth; nextStart: number } {
  const date = fromJdn(jdn);
  const year = winterMonthStart(date.year) <= jdn ? date.year : date.year - 1;
  const months = monthsFromWinter(year);
  const i = months.findLastIndex((m) => m.start <= jdn);
  const nextStart = i + 1 < months.length ? months[i + 1].start : winterMonthStart(year + 1);
  return { month: months[i], nextStart };
}

/** 旧正月(旧暦の年 year の1月1日) */
export function lunarNewYear(year: number): LocalDate {
  const first = monthsFromWinter(year - 1).find((m) => m.month === 1 && !m.leap);
  if (!first) throw new Error(`${year}年の旧正月が見つかりません`);
  return fromJdn(first.start);
}

/** 旧正月で区切った年 */
export function lunarYearOf(d: LocalDate): number {
  return toJdn(d) >= toJdn(lunarNewYear(d.year)) ? d.year : d.year - 1;
}

export function toLunar(d: LocalDate): LunarDate {
  const jdn = toJdn(d);
  const { month } = monthAt(jdn);
  return { year: lunarYearOf(d), month: month.month, leap: month.leap, day: jdn - month.start + 1 };
}

/** その日を含む旧暦月の1日〜末日 */
export function lunarMonthSpan(d: LocalDate): { start: LocalDate; end: LocalDate } {
  const { month, nextStart } = monthAt(toJdn(d));
  return { start: fromJdn(month.start), end: fromJdn(nextStart - 1) };
}
```

注: `tsconfig.json` の `lib` は `esnext` なので `findLastIndex` を使ってよい。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/astro && npx eslint src/lib/fortune/astro && npx tsc --noEmit -p .`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/astro/lunar-calendar.ts src/lib/fortune/astro/__tests__/lunar-calendar.test.ts
git commit -m "feat: 朔と中気から旧暦の年月日を求める計算を追加(2033年は閏11月案)"
```

---

### Task 2: 宿曜の計算と早見表の項目 id

**Files:**
- Modify: `src/lib/fortune/element-ids.ts`
- Create: `src/lib/fortune/sukuyo/calc.ts`
- Test: `src/lib/fortune/__tests__/element-ids.test.ts`(追記)
- Test: `src/lib/fortune/sukuyo/__tests__/calc.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`element-ids.test.ts` の最初の `it` の `for (const ids …)` の前に追記:

```ts
    expect(ELEMENT_IDS.sukuyo).toHaveLength(27 + 11);
    expect(ELEMENT_IDS.sukuyo).toContain("mansion-1");
    expect(ELEMENT_IDS.sukuyo).toContain("mansion-27");
    expect(ELEMENT_IDS.sukuyo).toContain("relation-tai");
```

```ts
// src/lib/fortune/sukuyo/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import { MANSION_NAMES, RELATION_NAMES, relationIndex, tableMethod, yearMansion } from "../calc";

const name = (i: number) => MANSION_NAMES[i];
const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("tableMethod(旧暦の月日から表で引く)", () => {
  it.each([
    [d(1990, 3, 29), "畢宿"],
    [d(1986, 10, 19), "畢宿"],
    [d(2026, 10, 1), "井宿"],
    [d(2026, 10, 31), "柳宿"],
    [d(2026, 10, 14), "尾宿"],
    [d(2023, 3, 22), "奎宿"], // 閏2月1日は2月の表
  ])("%o の宿は %s", (date, expected) => {
    expect(name(tableMethod(date))).toBe(expected);
  });
});

describe("relationIndex(三九の秘法)", () => {
  it("距離から11の関係を返すこと", () => {
    const rel = (from: number, to: number) => RELATION_NAMES[relationIndex(from, to)];
    expect(rel(1, 1)).toBe("命");
    expect(rel(1, 2)).toBe("栄");
    expect(rel(1, 9)).toBe("親");
    expect(rel(1, 10)).toBe("業");
    expect(rel(1, 11)).toBe("栄");
    expect(rel(1, 16)).toBe("壊");
    expect(rel(1, 19)).toBe("胎");
    expect(rel(1, 0)).toBe("親"); // 距離 26
  });
});

describe("yearMansion(年の宿)", () => {
  it("2011年の女宿から1年に1つ進み、牛宿の年は斗宿とすること", () => {
    expect([2009, 2010, 2011, 2012, 2013, 2016, 2018, 2026, 2037, 2038, 2039].map((y) => name(yearMansion(y)))).toEqual([
      "斗宿", "斗宿", "女宿", "虚宿", "危宿", "奎宿", "胃宿", "星宿", "斗宿", "斗宿", "女宿",
    ]);
  });

  it("年運は年の宿から本命宿までの距離で数えること(2026年 星宿の年)", () => {
    const year = yearMansion(2026);
    const rel = (honmei: string) => RELATION_NAMES[relationIndex(year, MANSION_NAMES.indexOf(honmei as (typeof MANSION_NAMES)[number]))];
    expect(rel("婁宿")).toBe("胎");
    expect(["井宿", "氐宿", "室宿"].map(rel)).toEqual(["壊", "壊", "壊"]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/sukuyo src/lib/fortune/__tests__/element-ids.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

`src/lib/fortune/element-ids.ts` の `const range = …` の前に追記:

```ts
/** 宿曜の27宿(1 = 昴宿 … 27 = 胃宿)と三九の関係 */
export const mansionId = (n: number) => `mansion-${n}`;
export type RelationKind = "mei" | "ei" | "sui" | "an" | "ki" | "sei" | "kai" | "yu" | "shin" | "gyo" | "tai";
/** 三九の関係(命・栄・衰・安・危・成・壊・友・親・業・胎の順) */
export const RELATION_KINDS: readonly RelationKind[] = ["mei", "ei", "sui", "an", "ki", "sei", "kai", "yu", "shin", "gyo", "tai"];
export const relationId = (k: RelationKind) => `relation-${k}`;
```

`ElementSystemId` に `"sukuyo"` を足し、`ELEMENT_IDS` に追加:

```ts
  sukuyo: [...range(1, 27).map(mansionId), ...RELATION_KINDS.map(relationId)],
```

```ts
// src/lib/fortune/sukuyo/calc.ts
import { toLunar } from "../astro/lunar-calendar";
import { mod, type LocalDate } from "../local-date";

/** 27宿(牛宿を除く)。番号 0 = 昴宿 … 26 = 胃宿 */
export const MANSION_NAMES = [
  "昴宿", "畢宿", "觜宿", "参宿", "井宿", "鬼宿", "柳宿", "星宿", "張宿", "翼宿", "軫宿", "角宿", "亢宿", "氐宿",
  "房宿", "心宿", "尾宿", "箕宿", "斗宿", "女宿", "虚宿", "危宿", "室宿", "壁宿", "奎宿", "婁宿", "胃宿",
] as const;

/** 三九の関係。RELATION_KINDS(element-ids.ts)と同じ順 */
export const RELATION_NAMES = ["命", "栄", "衰", "安", "危", "成", "壊", "友", "親", "業", "胎"] as const;

/** 旧暦の各月の1日の宿(1月 = 室宿 … 12月 = 虚宿) */
const MONTH_START = [22, 24, 26, 1, 3, 5, 8, 11, 13, 15, 18, 20] as const;

/** 旧暦の月の宿(その月の1日の宿)。閏月は同じ名前の月と同じ */
export const lunarMonthMansion = (month: number) => MONTH_START[month - 1];

/** 生まれた日(または今日)の宿を求める方式。将来、月の黄経から求める方式に差し替えられるよう関数1つにしておく */
export type MansionMethod = (date: LocalDate) => number;

/** 旧暦の月日から表で引く方式(月の1日の宿から、日ごとに1つ進む) */
export const tableMethod: MansionMethod = (date) => {
  const lunar = toLunar(date);
  return mod(lunarMonthMansion(lunar.month) + lunar.day - 1, 27);
};

/** from の宿から見た to の宿の関係(RELATION_NAMES の番号)。距離は (to − from) mod 27 */
export function relationIndex(from: number, to: number): number {
  const distance = mod(to - from, 27);
  if (distance === 0) return 0;
  if (distance === 9) return 9;
  if (distance === 18) return 10;
  return mod(distance, 9);
}

/** 女宿の番号(年の宿の起点) */
const NYO = 19;

/** 旧暦の年の宿。2011年 = 女宿から1年に1つ進む28年周期で、牛宿に当たる年は斗宿とする */
export function yearMansion(lunarYear: number): number {
  const k = mod(lunarYear - 2011, 28);
  return k === 27 ? NYO - 1 : mod(NYO + k, 27);
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/sukuyo src/lib/fortune/__tests__/element-ids.test.ts && npx eslint src/lib/fortune && npx tsc --noEmit -p .`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/element-ids.ts src/lib/fortune/__tests__/element-ids.test.ts src/lib/fortune/sukuyo
git commit -m "feat: 宿曜の27宿・本命宿の表・三九の関係・年の宿の計算を追加"
```

---

### Task 3: 宿曜の読み取り(人物像・運勢)

**Files:**
- Create: `src/lib/fortune/sukuyo/index.ts`
- Test: `src/lib/fortune/sukuyo/__tests__/sukuyo.test.ts`

人物像(`natal`): `honmei`(本命宿)、`gyo`(業宿 = 本命宿 + 9)、`tai`(胎宿 = 本命宿 + 18)、`lunar-birthday`(旧暦の誕生日。例「3月3日」「閏2月1日」。参照なし)。最初の3つはタイルになる。

運勢: チップは `mansion`(今日の宿 / 今月の宿 / 今年の宿。参照は宿)と `relation`(本命宿との関係。参照は関係)。見出しは「今日の宿は尾宿。本命宿との関係は「壊」」「今月は氐宿の月。本命宿との関係は「安」」「今年は星宿の年。本命宿との関係は「安」」で、参照は関係。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/sukuyo/__tests__/sukuyo.test.ts
import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";
import { sukuyo } from "../index";

const today = { year: 2026, month: 10, day: 14 };
const read = (p: BirthProfile) => sukuyo.read(p, toBirthMoment(p), today);
const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };

describe("sukuyo.read 人物像", () => {
  it("本命宿・業宿・胎宿・旧暦の誕生日を返すこと", () => {
    const r = read(p);
    expect(r.id).toBe("sukuyo");
    expect(r.natal).toEqual([
      { key: "honmei", label: "本命宿", value: "畢宿", refs: [{ system: "sukuyo", id: "mansion-2" }] },
      { key: "gyo", label: "業宿", value: "軫宿", refs: [{ system: "sukuyo", id: "mansion-11" }] },
      { key: "tai", label: "胎宿", value: "女宿", refs: [{ system: "sukuyo", id: "mansion-20" }] },
      { key: "lunar-birthday", label: "旧暦の誕生日", value: "3月3日", refs: [] },
    ]);
    expect(r.ambiguous).toBe(false);
  });

  it("閏月は「閏」を付けること", () => {
    const r = read({ ...p, date: { year: 2023, month: 3, day: 22 } });
    expect(r.natal.find((f) => f.key === "lunar-birthday")?.value).toBe("閏2月1日");
    expect(r.natal[0].value).toBe("奎宿");
  });

  it("サマータイム中の0時台は標準時の前日で引くこと", () => {
    // 1949/7/1 0時台(サマータイム)は標準時で 6/30 23時台
    const at0 = read({ version: 1, date: { year: 1949, month: 7, day: 1 }, time: { kind: "hour", hour: 0 } });
    const prev = read({ version: 1, date: { year: 1949, month: 6, day: 30 }, time: { kind: "unknown" } });
    expect(at0.natal[0].value).toBe(prev.natal[0].value);
  });
});

describe("sukuyo.read 運勢", () => {
  it("今日は日の宿と本命宿からの関係", () => {
    const day = read(p).periods.day;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline).toEqual({ text: "今日の宿は尾宿。本命宿との関係は「壊」", ref: { system: "sukuyo", id: "relation-kai" } });
    expect(day.chips.map((c) => [c.key, c.label, c.value])).toEqual([
      ["mansion", "今日の宿", "尾宿"],
      ["relation", "本命宿との関係", "壊"],
    ]);
  });

  it("今月は旧暦の月の宿", () => {
    const month = read(p).periods.month;
    expect(month.rangeLabel).toBe("2026/10/11〜2026/11/8");
    expect(month.headline.text).toBe("今月は氐宿の月。本命宿との関係は「安」");
    expect(month.chips.map((c) => c.value)).toEqual(["氐宿", "安"]);
  });

  it("今年は旧暦の年の宿で、関係は年の宿から数えること", () => {
    const year = read(p).periods.year;
    expect(year.rangeLabel).toBe("2026/2/17〜2027/2/6");
    expect(year.headline).toEqual({ text: "今年は星宿の年。本命宿との関係は「安」", ref: { system: "sukuyo", id: "relation-an" } });
    expect(year.chips.map((c) => [c.label, c.value])).toEqual([
      ["今年の宿", "星宿"],
      ["本命宿との関係", "安"],
    ]);
  });

  it("旧正月の前は前の年の宿", () => {
    const r = sukuyo.read(p, toBirthMoment(p), { year: 2026, month: 2, day: 16 });
    expect(r.periods.year.chips[0].value).toBe("柳宿"); // 2025年 = (19 + 14) mod 27 = 6
    expect(r.periods.year.rangeLabel).toBe("2025/1/29〜2026/2/16");
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/sukuyo/__tests__/sukuyo.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
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
```

`midpoint` と `PERIOD_WORD` は既存(`src/lib/fortune/ambiguity.ts`、`src/lib/fortune/period-labels.ts`)。実際の export 名を確かめて合わせる。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/sukuyo && npx eslint src/lib/fortune/sukuyo && npx tsc --noEmit -p .`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/sukuyo
git commit -m "feat: 宿曜の人物像(本命宿・業宿・胎宿)と今日・今月・今年の運勢を追加"
```

---

### Task 4: 早見表の辞書(宿曜 38項目)

**Files:**
- Create: `src/data/guide/sukuyo.ts`
- Modify: `src/data/guide/types.ts`(`GuideSystemId` に `"sukuyo"`)

書き方は既存の `src/data/guide/sanmei.ts` に合わせる(`export const sukuyoEntries: GuideEntry[]`)。文章はすべてオリジナル。絵文字・記号の文字は使わない。決まりは既存の辞書と同じ(`keywords` 3〜5語・各8文字以内、`summary` 全角換算80〜160、`reading` ひらがな、`related` は同じ占術の実在 id)。

| グループ | id | 名前 | 読み | 文字の絵 |
|---|---|---|---|---|
| 二十七宿 | mansion-1〜27 | 昴宿 畢宿 觜宿 参宿 井宿 鬼宿 柳宿 星宿 張宿 翼宿 軫宿 角宿 亢宿 氐宿 房宿 心宿 尾宿 箕宿 斗宿 女宿 虚宿 危宿 室宿 壁宿 奎宿 婁宿 胃宿 | ぼうしゅく ひつしゅく ししゅく しんしゅく せいしゅく きしゅく りゅうしゅく せいしゅく ちょうしゅく よくしゅく しんしゅく かくしゅく こうしゅく ていしゅく ぼうしゅく しんしゅく びしゅく きしゅく としゅく じょしゅく きょしゅく きしゅく しつしゅく へきしゅく けいしゅく ろうしゅく いしゅく | 宿名の1字(昴 …) |
| 三九の関係 | relation-mei ei sui an ki sei kai yu shin gyo tai | 命 栄 衰 安 危 成 壊 友 親 業 胎 | めい えい すい あん き せい かい ゆう しん ごう たい | 1字 |

- `periodNote` は **三九の関係のグループだけ** に書く(運勢の見出し「本命宿との関係は「壊」。{periodNote}」で使う)。全角換算30〜80字、「今日・今月・今年・本日・この日・この月・この年」を含めない。二十七宿には書かない。
- 二十七宿の `summary` は、その宿を本命宿に持つ人の人柄。
- 三九の関係の `summary` は、その関係の意味(本命宿から数えて何番目か、相性での意味)。「壊」「危」なども、怖がらせない書き方にする(壊は「物事が壊れる」ではなく「破壊と再生、計画を見直す」など)。
- 色は付けない。`related`: 宿は前後の宿、関係は対になる関係(栄↔親、友↔衰、安↔壊、危↔成、業↔胎、命は業と胎)。

- [ ] **Step 1: `GuideSystemId` を `"tarot" | "numerology" | "kyusei" | "maya" | "shichu" | "sanmei" | "sukuyo"` にする**
- [ ] **Step 2: `src/data/guide/sukuyo.ts` を書く**
- [ ] **Step 3: `npx tsc --noEmit -p .` が通る**
- [ ] **Step 4: コミット**

```bash
git add src/data/guide/sukuyo.ts src/data/guide/types.ts
git commit -m "feat: 早見表に宿曜の辞書(二十七宿・三九の関係)を追加"
```

---

### Task 5: 早見表・運勢ページ・ホームに宿曜を登録する

**Files:**
- Modify: `src/data/guide/index.ts`、`src/data/guide/__tests__/entries.test.ts`、`src/data/guide/__tests__/index.test.ts`
- Modify: `src/components/guide/__tests__/guide-detail.test.tsx`、`src/components/guide/__tests__/guide-browser.test.tsx`
- Modify: `src/lib/fortune/registry.ts`、`src/lib/fortune/system-names.ts`、`src/lib/fortune/__tests__/registry.test.ts`
- Modify: `src/components/home-fortune-chips.tsx`(とそのテストがあれば)

- [ ] **Step 1: テストを更新する**

- `entries.test.ts`: `cases` に `["sukuyo", sukuyoEntries]`、`PERIOD_GROUPS` に `sukuyo: ["三九の関係"]`。
- `index.test.ts`: タブの順の最後に `["sukuyo", "宿曜"]`(テスト名も「…・算命学・宿曜」に)。グループの項目数に:

```ts
    expect(byId.sukuyo.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["二十七宿", 27],
      ["三九の関係", 11],
    ]);
```

  検索に `expect(searchGuide("ひつしゅく").map((e) => `${e.system}:${e.id}`)).toContain("sukuyo:mansion-2");`
- `guide-detail.test.tsx`: 静的パスの数に `ELEMENT_IDS.sukuyo.length` を足す。
- `guide-browser.test.tsx`: タブの一覧の最後に「宿曜」、End キーと ArrowLeft で移る先を「宿曜」に。
- `registry.test.ts`: 占術の順を `["numerology", "kyusei", "maya", "shichu", "sanmei", "sukuyo"]` に(テスト名も)。
- ホームのチップ: `src/components/__tests__/` などに home-fortune-chips のテストがあれば、宿曜の「本命宿との関係」が出ることを足す。なければ `src/components/__tests__/home-fortune-chips.test.tsx` を新しく作る:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HomeFortuneChips } from "../home-fortune-chips";

describe("HomeFortuneChips", () => {
  it("今日の要点に宿曜の関係を含めること", () => {
    render(
      <HomeFortuneChips
        profile={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }}
        today={{ year: 2026, month: 10, day: 14 }}
      />,
    );
    const list = screen.getByRole("list", { name: "今日の運勢の要点" });
    expect(within(list).getByText("本命宿との関係")).toBeInTheDocument();
    expect(within(list).getByText("壊")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/data/guide src/components src/lib/fortune/__tests__/registry.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

- `src/data/guide/index.ts`: `import { sukuyoEntries } from "./sukuyo";` と、`guideSystems` の最後に `{ id: "sukuyo", label: "宿曜", groups: groupEntries(sukuyoEntries) }`。
- `registry.ts`: `import { sukuyo } from "./sukuyo";`、`[numerology, kyusei, maya, shichu, sanmei, sukuyo]`。
- `system-names.ts`: 末尾に `{ id: "sukuyo", name: "宿曜" }`。
- `home-fortune-chips.tsx`: `HOME_KEYS` に `sukuyo: ["relation"]`、先頭コメントを「…・今日のKIN・宿曜の関係」に。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run && npx eslint src && npx tsc --noEmit -p .`
Expected: PASS。文章の決まりで落ちた辞書の項目は文章を直す(テストを緩めない)

- [ ] **Step 5: コミット**

```bash
git add src/data/guide src/components src/lib/fortune/registry.ts src/lib/fortune/system-names.ts src/lib/fortune/__tests__/registry.test.ts
git commit -m "feat: 早見表・運勢ページ・ホームに宿曜を追加"
```

---

### Task 6: E2E・設計書

**Files:**
- Modify: `e2e/profile-fortune.spec.ts`、`e2e/guide.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`

- [ ] **Step 1: E2E を更新する**

`profile-fortune.spec.ts` の最初のテスト名を「登録すると運勢ページに6占術の運勢が表示されること」にし、占術名の配列の最後に `"宿曜"` を足す。ホームのテスト(「ホームに今日の運勢のチップが出て…」)に `await expect(page.getByRole("region", { name: "今日の運勢" })).toContainText("本命宿との関係");` を足す。

`guide.spec.ts` に:

```ts
  test("宿曜のタブがあること", async ({ page }) => {
    await page.goto("/guide?tab=sukuyo");
    await expect(page.getByRole("tab", { name: "宿曜" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /二十七宿/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /三九の関係/ })).toBeVisible();
  });
```

- [ ] **Step 2: 設計書を更新する**

- §3 の宿曜の行を「27宿(牛宿を除く)。本命宿と日の宿は旧暦の月ごとの1日の宿から日ごとに進める表の方式(閏月は同じ名前の月の表)。月の宿はその旧暦月の1日の宿。年の宿は旧正月ごとに1つ進む28年周期(2011年 = 女宿。牛宿の年は斗宿とする)。関係は三九の秘法(命・栄・衰・安・危・成・壊・友・親・業・胎)で、日・月は本命宿から、年は年の宿から数える。表示: 本命宿・業宿・胎宿・旧暦の誕生日。本命宿の計算方式は差し替え可能な構造にする。相性診断は扱わない」に。
- §3.1 の宿曜の行の「年の区切り」を「旧正月」に、「今月」を「旧暦の月の宿」に。
- §6.1 の `lunar-calendar.ts` の説明に「2033年は閏11月案(冬至から次の冬至までに朔が13回あるとき、最初に中気を含まない月を閏月にする)」を足す。
- §7 の `GuideSystemId` に `"sukuyo"`。§7.1 の `periodNote` の説明に「宿曜は三九の関係」を足す。

- [ ] **Step 3: E2E を実行する**

Run: `npx playwright test`
Expected: すべて PASS(意図的な skip を除く)

- [ ] **Step 4: コミット**

```bash
git add e2e docs/superpowers/specs/2026-10-14-birth-fortune-design.md
git commit -m "test: 宿曜の運勢ページ・ホーム・早見表のE2Eを追加し、設計書を実装に合わせる"
```

---

### Task 7: 最終確認

- [ ] `npx vitest run`、`npx eslint src e2e`、`npm run build` がすべて成功する。`ls out/guide/sukuyo | head` に `mansion-1.html` などがある。
- [ ] `grep -l "三九の秘法" out/_next/static/chunks/*.js` が1つのチャンクだけを返し、そのチャンク名が `out/index.html`・`out/fortune.html`・`out/guide.html` に直接含まれない(計算エンジンが遅延読み込みのまま)。
- [ ] `grep -rnP "[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}]" src/lib/fortune/sukuyo src/lib/fortune/astro/lunar-calendar.ts src/data/guide/sukuyo.ts` が何も返さない。
