# フェーズ2 四柱推命・算命学 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 運勢ページと早見表に四柱推命・算命学を追加する(計算エンジン、人物像の命式表・人体星図、今日・今月・今年の運勢、早見表102項目)。

**Architecture:** 既存の占術モジュール(`FortuneSystemModule`)の形に合わせて `src/lib/fortune/shichu/` と `src/lib/fortune/sanmei/` を作る。干支の計算(通変星・十二運・月柱・時柱)、今日を含む暦の期間、大運は両占術で共有する。人物像の専用の図は `SystemReading.chart`(任意)で表し、`natal-section.tsx` が図の種類ごとに描く。

**Tech Stack:** Next.js 16.2.1(静的エクスポート)/ React 19.2 / TypeScript / Tailwind CSS v4 / astronomy-engine / Vitest + Testing Library / Playwright

設計書: `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`(§3・§3.1・§5・§6.2・§7・§11.2)

---

## 決定事項(このフェーズで確定したもの)

調査(出典は各タスクのコメントに記載)とユーザーとの確認で、次のとおり決めた。設計書にも反映する(Task 14)。

| 項目 | 決定 |
|---|---|
| 四柱推命の時柱 | 出生時刻を「時刻を指定」で入力したときだけ出す。不明・午前午後では「時刻不明」とし、五行バランスは年・月・日の3柱で数える |
| 四柱推命の経度補正 | 時刻を指定したときだけ、地方平均時(UTC + 経度/15 時間)で日柱・時柱を判定する。不明・午前午後では日本時間の暦日で日柱を出す(分単位の補正に意味がなく、日干が候補に割れるのを避ける) |
| 日数の数え方(蔵干・二十八元) | 節入り日を1日目とする日付で数える(高尾学館式)。年支・月支・日支・時支のすべてに、生まれ月の節入りからの同じ日数を当てる |
| 四柱推命の蔵干 | 月律分野蔵干。子 壬10・癸 / 丑 癸9・辛3・己 / 寅 戊7・丙7・甲 / 卯 甲10・乙 / 辰 乙9・癸3・戊 / 巳 戊5・庚9・丙 / 午 丙10・己9・丁 / 未 丁9・乙3・己 / 申 戊10・壬3・庚 / 酉 庚10・辛 / 戌 辛9・丁3・戊 / 亥 戊7・甲5・壬 |
| 算命学の二十八元 | 子 癸 / 丑 癸1-9・辛10-12・己13〜 / 寅 戊1-7・丙8-14・甲15〜 / 卯 乙 / 辰 乙1-9・癸10-12・戊13〜 / 巳 戊1-5・庚6-14・丙15〜 / 午 己1-19・丁20〜 / 未 丁1-9・乙10-12・己13〜 / 申 戊1-10・壬11-13・庚14〜 / 酉 辛 / 戌 辛1-9・丁10-12・戊13〜 / 亥 甲1-12・壬13〜 |
| 大運 | 年干が陽の男性・陰の女性は順行、それ以外は逆行。順行は次の節入り日まで、逆行は前の節入り日からの日数(日付の差)÷3を四捨五入し、1〜10歳に収める。四柱推命・算命学で共通 |
| 人体星図 | 図は本人と向かい合った向き。上段: 空き / 頭(北)=日干×年干 / 左肩(初年)=日干×年支の十二大従星。中段: 右手(西)=日干×日支蔵干 / 胸(中心星)=日干×月支蔵干 / 左手(東)=日干×年支蔵干。下段: 右足(晩年)=日干×日支 / 腹(南)=日干×月干 / 左足(中年)=日干×月支 |
| 十二大従星 | 十二運と同じ対応(長生=天貴星、沐浴=天恍星、冠帯=天南星、建禄=天禄星、帝旺=天将星、衰=天堂星、病=天胡星、死=天極星、墓=天庫星、絶=天馳星、胎=天報星、養=天印星)。陰干は逆回り、火土同根 |
| 宿命中殺 | 生年中殺(日干支の天中殺が年支)、生月中殺(日干支の天中殺が月支)、生日中殺(年干支の天中殺が日支)、日座中殺(日干支が甲戌・乙亥)、日居中殺(日干支が甲辰・乙巳) |
| 異常干支 | 通常異常干支6種(甲戌・乙亥・戊戌・庚子・辛亥・丁巳)+暗合異常干支7種(辛巳・壬午・丙戌・丁亥・戊子・癸巳・己亥)。年・月・日の3柱のどこかにあれば該当 |
| 位相法 | 年支・月支・日支の2支ずつで判定。支合(子丑・寅亥・卯戌・辰酉・巳申・午未)、半会(申子辰・亥卯未・寅午戌・巳酉丑の中の2支。旺支を含まない組も数える)、方三位(寅卯辰・巳午未・申酉戌・亥子丑の3支がそろう)、対冲(6支離れ)、刑(寅巳・巳申・寅申・丑戌・戌未・未丑・子卯、自刑は辰辰・午午・酉酉・亥亥)、害(子未・丑午・寅巳・卯辰・申亥・酉戌)、破(子酉・丑辰・寅亥・卯午・巳申・未戌) |
| 命式表の日柱の通変星 | 「日主」と表記する |

## 検証用の固定値(既存エンジンで確認済み)

- 1990/3/29 は 癸巳(干支番号 index 29)。年 庚午、月 己卯(啓蟄 1990/3/6 5:19 〜 清明 4/5 10:12)。節入り日を1日目として 24日目。
- 2026/10/14 は 辛酉。年 丙午、月 戊戌(寒露 2026/10/8 〜 立冬 11/7)。
- 1985/12/15 は 戊子。子月(大雪 1985/12/7 13:16 〜 小寒 1986/1/6 0:28)。年は 1985(乙丑)。
- 明石(出生地未入力)は経度 135.0 なので地方平均時の補正は 0。東京都は経度 139.69(+18.76分)。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `src/lib/fortune/sexagenary.ts`(変更) | 干支の共通計算: 五行・陰陽、干支番号、年柱・月柱・時柱、通変星、十二運 |
| `src/lib/fortune/astro/solar-terms.ts`(変更) | 節入り日を1日目とする日数 `dayNumberInSolarMonth` |
| `src/lib/fortune/astro/calendar-period.ts`(新規) | 今日を含む年(立春)・月(節入り)・日の期間と干支、期間の表示 |
| `src/lib/fortune/kyusei/index.ts`(変更) | 期間の計算を `calendarPeriod` に置き換える |
| `src/lib/fortune/daiun.ts`(新規) | 大運の向き・立運・その年齢の大運、満年齢 |
| `src/lib/fortune/fact.ts`(新規) | `Resolved<T>` から `Fact` を作る共通処理 |
| `src/lib/fortune/element-ids.ts`(変更) | 四柱推命・算命学の早見表の項目 id |
| `src/lib/fortune/types.ts`(変更) | `NatalChart`(命式表・人体星図)と `SystemReading.chart` |
| `src/lib/fortune/shichu/calc.ts`・`index.ts`(新規) | 四柱推命の計算と読み取り |
| `src/lib/fortune/sanmei/calc.ts`・`patterns.ts`・`index.ts`(新規) | 算命学の計算(星・天中殺)、宿命中殺・異常干支・位相法、読み取り |
| `src/data/guide/shichu.ts`・`sanmei.ts`(新規) | 早見表の辞書(49項目・53項目) |
| `src/data/guide/types.ts`・`index.ts`(変更) | 早見表のタブに2占術を追加 |
| `src/lib/fortune/registry.ts`・`system-names.ts`(変更) | 2占術の登録 |
| `src/components/fortune/natal-chart.tsx`(新規) | 命式表・人体星図の表示 |
| `src/components/fortune/natal-section.tsx`(変更) | 図があるときはタイルの代わりに図を出す |
| `src/components/profile/profile-form.tsx`(変更) | 時柱の説明文 |

テストの実行: `npx vitest run <path>`。lint: `npx eslint <path>`。E2E は `npx playwright test`(ポート3100。ポート3200の dev サーバーが動いていたら止めてから実行する)。

---

### Task 1: 干支の共通計算

**Files:**
- Modify: `src/lib/fortune/sexagenary.ts`
- Modify: `src/lib/fortune/astro/solar-terms.ts`
- Test: `src/lib/fortune/__tests__/sexagenary.test.ts`(追記)
- Test: `src/lib/fortune/astro/__tests__/solar-terms.test.ts`(追記)

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/fortune/__tests__/sexagenary.test.ts` の末尾に追記する(既存の import 行に必要な名前を足す):

```ts
import {
  BRANCHES,
  STEMS,
  TEN_GOD_NAMES,
  TWELVE_STAGE_NAMES,
  branchElement,
  branchOf,
  cycleIndexOf,
  cycleName,
  hourBranchIndex,
  hourCycleIndex,
  isYangStem,
  monthCycleIndex,
  stemElement,
  stemOf,
  tenGodIndex,
  twelveStageIndex,
  yearCycleIndex,
} from "../sexagenary";

describe("干支番号", () => {
  it("十干と十二支から六十干支の番号を求めること", () => {
    expect(cycleIndexOf(0, 0)).toBe(0); // 甲子
    expect(cycleIndexOf(0, 10)).toBe(10); // 甲戌
    expect(cycleIndexOf(2, 6)).toBe(42); // 丙午
    expect(cycleIndexOf(9, 5)).toBe(29); // 癸巳
    expect(() => cycleIndexOf(0, 1)).toThrow();
  });

  it("番号から十干・十二支を取り出すこと", () => {
    expect(stemOf(29)).toBe(9);
    expect(branchOf(29)).toBe(5);
    expect(stemOf(-1)).toBe(9);
  });

  it("立春で区切った年の干支", () => {
    expect(cycleName(yearCycleIndex(1984))).toBe("甲子");
    expect(cycleName(yearCycleIndex(1990))).toBe("庚午");
    expect(cycleName(yearCycleIndex(2026))).toBe("丙午");
  });

  it("節月の干支(甲己の年は丙寅から)", () => {
    expect(cycleName(monthCycleIndex(2026, 0))).toBe("庚寅");
    expect(cycleName(monthCycleIndex(1990, 1))).toBe("己卯");
    expect(cycleName(monthCycleIndex(2026, 8))).toBe("戊戌");
    expect(cycleName(monthCycleIndex(1985, 10))).toBe("戊子");
    expect(cycleName(monthCycleIndex(1984, 0))).toBe("丙寅");
  });

  it("時の十二支(23時と0時は子)", () => {
    expect([23, 0, 1, 2, 13, 14, 15, 22].map(hourBranchIndex)).toEqual([0, 0, 1, 1, 7, 7, 8, 11]);
  });

  it("時柱の干支(甲己の日は甲子から)", () => {
    expect(cycleName(hourCycleIndex(0, 0))).toBe("甲子");
    expect(cycleName(hourCycleIndex(9, 0))).toBe("壬子");
    expect(cycleName(hourCycleIndex(9, 7))).toBe("己未");
  });
});

describe("五行・陰陽", () => {
  it("十干と十二支の五行(0 = 木 … 4 = 水)", () => {
    expect(STEMS.map((_, s) => stemElement(s))).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(BRANCHES.map((_, b) => branchElement(b))).toEqual([4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]);
    expect(isYangStem(0)).toBe(true);
    expect(isYangStem(9)).toBe(false);
  });
});

describe("通変星", () => {
  it("日干から見た十干の通変星", () => {
    const name = (day: number, other: number) => TEN_GOD_NAMES[tenGodIndex(day, other)];
    expect(name(9, 9)).toBe("比肩");
    expect(name(0, 1)).toBe("劫財");
    expect(name(9, 1)).toBe("食神");
    expect(name(0, 3)).toBe("傷官");
    expect(name(0, 4)).toBe("偏財");
    expect(name(9, 2)).toBe("正財");
    expect(name(9, 5)).toBe("偏官");
    expect(name(9, 4)).toBe("正官");
    expect(name(9, 7)).toBe("偏印");
    expect(name(9, 6)).toBe("印綬");
  });
});

describe("十二運", () => {
  it("陽干は順行・陰干は逆行、土は火と同じ(火土同根)", () => {
    const name = (day: number, branch: number) => TWELVE_STAGE_NAMES[twelveStageIndex(day, branch)];
    expect(name(0, 11)).toBe("長生"); // 甲・亥
    expect(name(0, 3)).toBe("帝旺"); // 甲・卯
    expect(name(9, 3)).toBe("長生"); // 癸・卯
    expect(name(9, 11)).toBe("帝旺"); // 癸・亥
    expect(name(9, 6)).toBe("絶"); // 癸・午
    expect(name(9, 5)).toBe("胎"); // 癸・巳
    expect(name(9, 7)).toBe("墓"); // 癸・未
    expect(name(4, 2)).toBe("長生"); // 戊・寅
    expect(name(5, 9)).toBe("長生"); // 己・酉
  });
});
```

`src/lib/fortune/astro/__tests__/solar-terms.test.ts` の末尾に追記する(import に `dayNumberInSolarMonth` と `tokyoToUtc` を足す):

```ts
describe("dayNumberInSolarMonth", () => {
  it("節入り日を1日目として数えること", () => {
    // 啓蟄 1990/3/6 5:19
    expect(dayNumberInSolarMonth(tokyoToUtc(1990, 3, 29, 14, 0))).toBe(24);
    expect(dayNumberInSolarMonth(tokyoToUtc(1990, 3, 6, 12, 0))).toBe(1);
    // 節入りの時刻より前は前の月(立春 1990/2/4 から数えて31日目)
    expect(dayNumberInSolarMonth(tokyoToUtc(1990, 3, 6, 3, 0))).toBe(31);
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/__tests__/sexagenary.test.ts src/lib/fortune/astro/__tests__/solar-terms.test.ts`
Expected: FAIL(`cycleIndexOf` などが export されていない)

- [ ] **Step 3: 実装する**

`src/lib/fortune/sexagenary.ts` の末尾に追記する:

```ts
/** 五行の名前(0 = 木, 1 = 火, 2 = 土, 3 = 金, 4 = 水) */
export const ELEMENT_NAMES = ["木", "火", "土", "金", "水"] as const;

/** 通変星(日干から見た十干の関係)。0 = 比肩 … 9 = 印綬 */
export const TEN_GOD_NAMES = ["比肩", "劫財", "食神", "傷官", "偏財", "正財", "偏官", "正官", "偏印", "印綬"] as const;

/** 十二運。0 = 長生 … 11 = 養 */
export const TWELVE_STAGE_NAMES = ["長生", "沐浴", "冠帯", "建禄", "帝旺", "衰", "病", "死", "墓", "絶", "胎", "養"] as const;

const BRANCH_ELEMENTS = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] as const;

/** 十干(0 = 甲 … 9 = 癸)の五行 */
export const stemElement = (stem: number) => Math.floor(mod(stem, 10) / 2);
/** 十二支(0 = 子 … 11 = 亥)の五行 */
export const branchElement = (branch: number) => BRANCH_ELEMENTS[mod(branch, 12)];
export const isYangStem = (stem: number) => mod(stem, 2) === 0;

/** 六十干支の番号の十干・十二支 */
export const stemOf = (cycle: number) => mod(cycle, 10);
export const branchOf = (cycle: number) => mod(cycle, 12);

/** 十干と十二支から六十干支の番号(陰陽が合わない組み合わせはない) */
export function cycleIndexOf(stem: number, branch: number): number {
  const n = mod(6 * stem - 5 * branch, 60);
  if (stemOf(n) !== mod(stem, 10) || branchOf(n) !== mod(branch, 12)) {
    throw new Error(`${STEMS[mod(stem, 10)]}${BRANCHES[mod(branch, 12)]} は六十干支にありません`);
  }
  return n;
}

/** 立春で区切った年の干支の番号(1984 = 甲子) */
export const yearCycleIndex = (kyuseiYear: number) => mod(kyuseiYear - 4, 60);

/** 節月(0 = 寅月)の干支の番号。月の十干は年の十干から決まる(甲己の年は丙寅から) */
export function monthCycleIndex(kyuseiYear: number, solarMonthIndex: number): number {
  const stem = mod(2 * stemOf(yearCycleIndex(kyuseiYear)) + 2 + solarMonthIndex, 10);
  return cycleIndexOf(stem, monthBranchIndex(solarMonthIndex));
}

/** 時(0〜23)の十二支。23時と0時は子 */
export const hourBranchIndex = (hour: number) => Math.floor((hour + 1) / 2) % 12;

/** 時柱の干支の番号。時の十干は日の十干から決まる(甲己の日は甲子から) */
export function hourCycleIndex(dayStem: number, hourBranch: number): number {
  return cycleIndexOf(mod(2 * dayStem + hourBranch, 10), hourBranch);
}

/** 日干から見た十干 other の通変星(TEN_GOD_NAMES の番号) */
export function tenGodIndex(dayStem: number, other: number): number {
  const relation = mod(stemElement(other) - stemElement(dayStem), 5); // 0 同じ / 1 日干が生む / 2 日干が剋す / 3 日干を剋す / 4 日干を生む
  return relation * 2 + (isYangStem(other) === isYangStem(dayStem) ? 0 : 1);
}

/** 十干の長生の十二支(土は火と同じ) */
const CHOSEI_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] as const;

/** 日干から見た十二支の十二運(TWELVE_STAGE_NAMES の番号)。陽干は順行、陰干は逆行 */
export function twelveStageIndex(dayStem: number, branch: number): number {
  const start = CHOSEI_BRANCH[mod(dayStem, 10)];
  return isYangStem(dayStem) ? mod(branch - start, 12) : mod(start - branch, 12);
}
```

`src/lib/fortune/astro/solar-terms.ts` の末尾に追記する(import に `toJdn` と `jstLocalDate` を足す: `import { toJdn } from "../local-date";`、`import { jstLocalDate, tokyoParts } from "../tokyo-time";`):

```ts
/** その瞬間が、属する節月の何日目か(節入り日を1日目とする日付で数える。蔵干・二十八元の選択に使う) */
export function dayNumberInSolarMonth(at: Date): number {
  const month = solarMonthAt(at);
  return toJdn(jstLocalDate(at)) - toJdn(jstLocalDate(month.start)) + 1;
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/__tests__/sexagenary.test.ts src/lib/fortune/astro/__tests__/solar-terms.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/sexagenary.ts src/lib/fortune/astro/solar-terms.ts src/lib/fortune/__tests__/sexagenary.test.ts src/lib/fortune/astro/__tests__/solar-terms.test.ts
git commit -m "feat: 干支の共通計算(月柱・時柱・通変星・十二運・五行)と節月の日数を追加"
```

---

### Task 2: 今日を含む暦の期間(九星気学から切り出す)

**Files:**
- Create: `src/lib/fortune/astro/calendar-period.ts`
- Modify: `src/lib/fortune/kyusei/index.ts`(`boardFor`)
- Test: `src/lib/fortune/astro/__tests__/calendar-period.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/astro/__tests__/calendar-period.test.ts
import { describe, it, expect } from "vitest";
import { cycleName } from "../../sexagenary";
import { calendarPeriod } from "../calendar-period";

const today = { year: 2026, month: 10, day: 14 };

describe("calendarPeriod", () => {
  it("年は立春から次の立春の前日まで", () => {
    const p = calendarPeriod("year", today);
    expect(p.kyuseiYear).toBe(2026);
    expect(p.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(cycleName(p.cycleIndex)).toBe("丙午");
  });

  it("月は節入り日から次の節入り日の前日まで", () => {
    const p = calendarPeriod("month", today);
    expect(p.solarMonthIndex).toBe(8);
    expect(p.rangeLabel).toBe("2026/10/8〜2026/11/6");
    expect(cycleName(p.cycleIndex)).toBe("戊戌");
  });

  it("日はその日", () => {
    const p = calendarPeriod("day", today);
    expect(p.rangeLabel).toBe("2026/10/14");
    expect(cycleName(p.cycleIndex)).toBe("辛酉");
  });

  it("節入り日の当日は、節入りの時刻より前でも新しい月に含めること", () => {
    // 寒露 2026/10/8 の当日
    const p = calendarPeriod("month", { year: 2026, month: 10, day: 8 });
    expect(p.rangeLabel).toBe("2026/10/8〜2026/11/6");
    expect(cycleName(p.cycleIndex)).toBe("戊戌");
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/astro/__tests__/calendar-period.test.ts`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/astro/calendar-period.ts
import { addDays, formatSlash, type LocalDate } from "../local-date";
import { dayCycleIndex, monthCycleIndex, yearCycleIndex } from "../sexagenary";
import { jstLocalDate, tokyoToUtc } from "../tokyo-time";
import type { Period } from "../types";
import { solarLongitudeTime, solarMonthAt } from "./solar-terms";

export interface CalendarPeriod {
  /** 立春で区切った年 */
  kyuseiYear: number;
  /** 節月(0 = 寅月 … 11 = 丑月) */
  solarMonthIndex: number;
  /** その期間の干支の番号(年柱・月柱・日柱と同じ数え方) */
  cycleIndex: number;
  /** 例: 2026/2/4〜2027/2/3 */
  rangeLabel: string;
}

const span = (start: Date, end: Date) =>
  `${formatSlash(jstLocalDate(start))}〜${formatSlash(addDays(jstLocalDate(end), -1))}`;

/**
 * 今日を含む年(立春)・月(節入り)・日の期間。
 * 暦の慣習どおり節入り・立春の当日は新しい月・年に含めるため、今日の終わり(23:59)で判定する(設計書 §3.1)
 */
export function calendarPeriod(period: Period, today: LocalDate): CalendarPeriod {
  const endOfToday = tokyoToUtc(today.year, today.month, today.day, 23, 59);
  const month = solarMonthAt(endOfToday);
  const ky = month.kyuseiYear;
  const base = { kyuseiYear: ky, solarMonthIndex: month.index };
  if (period === "year") {
    return {
      ...base,
      cycleIndex: yearCycleIndex(ky),
      rangeLabel: span(solarLongitudeTime(ky, 315), solarLongitudeTime(ky + 1, 315)),
    };
  }
  if (period === "month") {
    return { ...base, cycleIndex: monthCycleIndex(ky, month.index), rangeLabel: span(month.start, month.end) };
  }
  return { ...base, cycleIndex: dayCycleIndex(today), rangeLabel: formatSlash(today) };
}
```

`src/lib/fortune/kyusei/index.ts` の `boardFor` を `calendarPeriod` で書き直す(戻り値の形は変えない):

```ts
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
```

あわせて `kyusei/index.ts` の import を整理する: `import { calendarPeriod } from "../astro/calendar-period";` を足し、使わなくなった `solarLongitudeTime`・`solarMonthAt`・`addDays`・`formatSlash`・`jstLocalDate`・`tokyoToUtc` を外す(`jieBoundariesWithin` と `LocalDate` 型は残す)。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/astro src/lib/fortune/kyusei && npx eslint src/lib/fortune/kyusei src/lib/fortune/astro`
Expected: PASS(九星気学の既存テストも変わらず通る)、lint エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/astro/calendar-period.ts src/lib/fortune/astro/__tests__/calendar-period.test.ts src/lib/fortune/kyusei/index.ts
git commit -m "refactor: 今日を含む年・月・日の期間と干支の計算を九星気学から切り出す"
```

---

### Task 3: 大運と、候補つきの事実を作る共通処理

**Files:**
- Create: `src/lib/fortune/daiun.ts`
- Create: `src/lib/fortune/fact.ts`
- Test: `src/lib/fortune/__tests__/daiun.test.ts`
- Test: `src/lib/fortune/__tests__/fact.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/__tests__/daiun.test.ts
import { describe, it, expect } from "vitest";
import { ageOn, daiunAt, daiunPlan } from "../daiun";
import { cycleName, monthCycleIndex, yearCycleIndex } from "../sexagenary";
import { tokyoToUtc } from "../tokyo-time";

describe("daiunPlan", () => {
  it("陰年の女性は順行し、次の節入り日までの日数÷3を四捨五入すること", () => {
    // 1985/12/15 生まれ(乙丑年・戊子月)。次の節入りは 1986/1/6 で 22日 → 7歳運
    const plan = daiunPlan(tokyoToUtc(1985, 12, 15, 12, 0), yearCycleIndex(1985), monthCycleIndex(1985, 10), "female");
    expect(plan).toEqual({ forward: true, startAge: 7, monthCycle: monthCycleIndex(1985, 10) });
  });

  it("陽年の男性は順行、陽年の女性は逆行すること", () => {
    const at = tokyoToUtc(1990, 3, 29, 14, 0); // 庚午年・己卯月。次の節入り 4/5 まで7日、前の節入り 3/6 から23日
    const month = monthCycleIndex(1990, 1);
    expect(daiunPlan(at, yearCycleIndex(1990), month, "male")).toEqual({ forward: true, startAge: 2, monthCycle: month });
    expect(daiunPlan(at, yearCycleIndex(1990), month, "female")).toEqual({ forward: false, startAge: 8, monthCycle: month });
  });

  it("日数が少なくても1歳運、多くても10歳運に収めること", () => {
    // 1990/4/4 は清明(4/5)の前日 → 順行で1日 → 0 を 1 にする
    const plan = daiunPlan(tokyoToUtc(1990, 4, 4, 12, 0), yearCycleIndex(1990), monthCycleIndex(1990, 1), "male");
    expect(plan.startAge).toBe(1);
  });
});

describe("daiunAt", () => {
  const plan = { forward: true, startAge: 2, monthCycle: monthCycleIndex(1990, 1) }; // 己卯

  it("立運前は null", () => {
    expect(daiunAt(plan, 1)).toBeNull();
  });

  it("立運から10年ごとに月柱から1つずつ進むこと", () => {
    expect(daiunAt(plan, 2)).toEqual({ cycle: monthCycleIndex(1990, 1) + 1, fromAge: 2, toAge: 11 });
    const at36 = daiunAt(plan, 36)!;
    expect(cycleName(at36.cycle)).toBe("癸未");
    expect([at36.fromAge, at36.toAge]).toEqual([32, 41]);
  });

  it("逆行は月柱から1つずつ戻ること", () => {
    const back = daiunAt({ ...plan, forward: false, startAge: 8 }, 36)!;
    expect(cycleName(back.cycle)).toBe("丙子");
    expect([back.fromAge, back.toAge]).toEqual([28, 37]);
  });
});

describe("ageOn", () => {
  it("満年齢を返すこと", () => {
    const birth = { year: 1990, month: 3, day: 29 };
    expect(ageOn(birth, { year: 2026, month: 3, day: 28 })).toBe(35);
    expect(ageOn(birth, { year: 2026, month: 3, day: 29 })).toBe(36);
    expect(ageOn(birth, { year: 2026, month: 10, day: 14 })).toBe(36);
  });
});
```

```ts
// src/lib/fortune/__tests__/fact.test.ts
import { describe, it, expect } from "vitest";
import { resolvedFact } from "../fact";
import type { Resolved } from "../types";

const at = (h: number) => new Date(Date.UTC(2026, 0, 1, h));
const ref = (id: string) => ({ system: "shichu" as const, id });

describe("resolvedFact", () => {
  it("確定なら候補を付けないこと", () => {
    const r: Resolved<number> = { kind: "fixed", value: 1 };
    expect(resolvedFact(r, "k", "ラベル", (v) => `値${v}`, (v) => [ref(`x-${v}`)])).toEqual({
      key: "k",
      label: "ラベル",
      value: "値1",
      refs: [ref("x-1")],
    });
  });

  it("候補で表記が分かれるときは candidates を付け、参照の重複を除くこと", () => {
    const r: Resolved<number> = {
      kind: "ambiguous",
      options: [
        { value: 1, range: { start: at(0), end: at(5) } },
        { value: 2, range: { start: at(5), end: at(10) } },
      ],
    };
    const f = resolvedFact(r, "k", "ラベル", (v) => `値${v}`, () => [ref("same")]);
    expect(f.value).toMatch(/^値1\(〜\d+:\d\d\) \/ 値2\(\d+:\d\d〜\)$/);
    expect(f.candidates).toHaveLength(2);
    expect(f.refs).toEqual([ref("same")]);
  });

  it("候補があっても表記が同じなら candidates を付けないこと", () => {
    const r: Resolved<number> = {
      kind: "ambiguous",
      options: [
        { value: 1, range: { start: at(0), end: at(5) } },
        { value: 2, range: { start: at(5), end: at(10) } },
      ],
    };
    const f = resolvedFact(r, "k", "ラベル", () => "同じ", () => []);
    expect(f).toEqual({ key: "k", label: "ラベル", value: "同じ", refs: [] });
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/__tests__/daiun.test.ts src/lib/fortune/__tests__/fact.test.ts`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
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
```

```ts
// src/lib/fortune/fact.ts
import { describeCandidates, describeResolved, resolvedValues } from "./ambiguity";
import type { ElementRef, Fact, Resolved } from "./types";

/**
 * 出生時刻で分かれうる計算結果から表示用の事実を作る。
 * 表記が分かれるときだけ candidates を付け、参照は候補の順に重複を除いて並べる
 */
export function resolvedFact<T>(
  resolved: Resolved<T>,
  key: string,
  label: string,
  format: (v: T) => string,
  refsOf: (v: T) => ElementRef[],
): Fact {
  const candidates = describeCandidates(resolved, format);
  const seen = new Set<string>();
  const refs = resolvedValues(resolved)
    .flatMap(refsOf)
    .filter((r) => {
      const k = `${r.system}:${r.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  return { key, label, value: describeResolved(resolved, format), refs, ...(candidates ? { candidates } : {}) };
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/__tests__/daiun.test.ts src/lib/fortune/__tests__/fact.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/daiun.ts src/lib/fortune/fact.ts src/lib/fortune/__tests__/daiun.test.ts src/lib/fortune/__tests__/fact.test.ts
git commit -m "feat: 大運(順逆・立運・その年齢の大運)と、候補つきの事実を作る共通処理を追加"
```

---

### Task 4: 早見表の項目 id と、人物像の図の型

**Files:**
- Modify: `src/lib/fortune/element-ids.ts`
- Modify: `src/lib/fortune/types.ts`
- Test: `src/lib/fortune/__tests__/element-ids.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/fortune/__tests__/element-ids.test.ts` の `it` の中、`for (const ids …)` の前に追記する:

```ts
    expect(ELEMENT_IDS.shichu).toHaveLength(10 + 12 + 10 + 12 + 5);
    expect(ELEMENT_IDS.shichu).toContain("stem-10");
    expect(ELEMENT_IDS.shichu).toContain("branch-12");
    expect(ELEMENT_IDS.shichu).toContain("tsuhen-10");
    expect(ELEMENT_IDS.shichu).toContain("unsei-12");
    expect(ELEMENT_IDS.shichu).toContain("element-water");
    expect(ELEMENT_IDS.sanmei).toHaveLength(10 + 12 + 6 + 5 + 13 + 7);
    expect(ELEMENT_IDS.sanmei).toContain("main-10");
    expect(ELEMENT_IDS.sanmei).toContain("sub-12");
    expect(ELEMENT_IDS.sanmei).toContain("tenchu-6");
    expect(ELEMENT_IDS.sanmei).toContain("shukumei-nikkyo");
    expect(ELEMENT_IDS.sanmei).toContain("ijo-11");
    expect(ELEMENT_IDS.sanmei).toContain("isou-ha");
```

さらに別の `it` を足す:

```ts
  it("異常干支の id は干支番号(甲子 = 1)で、通常6種と暗合7種", () => {
    expect(ELEMENT_IDS.sanmei.filter((id) => id.startsWith("ijo-"))).toEqual(
      [11, 12, 35, 37, 48, 54, 18, 19, 23, 24, 25, 30, 36].map((n) => `ijo-${n}`),
    );
  });
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/__tests__/element-ids.test.ts`
Expected: FAIL(`ELEMENT_IDS.shichu` が undefined)

- [ ] **Step 3: 実装する**

`src/lib/fortune/element-ids.ts` の `const range = …` の前に追記する:

```ts
/** 四柱推命の十干(1 = 甲 … 10 = 癸)・十二支(1 = 子 … 12 = 亥)・通変星(1 = 比肩 … 10 = 印綬)・十二運(1 = 長生 … 12 = 養) */
export const stemId = (n: number) => `stem-${n}`;
export const branchId = (n: number) => `branch-${n}`;
export const tsuhenId = (n: number) => `tsuhen-${n}`;
export const unseiId = (n: number) => `unsei-${n}`;

/** 五行(sexagenary.ts の ELEMENT_NAMES と同じ順) */
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export const FIVE_ELEMENTS: readonly FiveElement[] = ["wood", "fire", "earth", "metal", "water"];
export const elementId = (e: FiveElement) => `element-${e}`;

/** 算命学の十大主星(1 = 貫索星 … 10 = 玉堂星。通変星と同じ順)・十二大従星(1 = 天貴星 … 12 = 天印星。十二運と同じ順) */
export const mainStarId = (n: number) => `main-${n}`;
export const subStarId = (n: number) => `sub-${n}`;
/** 天中殺(1 = 子丑 … 6 = 戌亥) */
export const tenchuId = (n: number) => `tenchu-${n}`;

/** 宿命中殺の種類(生年・生月・生日・日座・日居) */
export type ShukumeiKind = "year" | "month" | "day" | "nichiza" | "nikkyo";
export const SHUKUMEI_KINDS: readonly ShukumeiKind[] = ["year", "month", "day", "nichiza", "nikkyo"];
export const shukumeiId = (k: ShukumeiKind) => `shukumei-${k}`;

/** 異常干支の干支番号(甲子 = 1)。通常異常干支6種のあとに暗合異常干支7種 */
export const IJO_NORMAL = [11, 12, 35, 37, 48, 54] as const;
export const IJO_ANGOU = [18, 19, 23, 24, 25, 30, 36] as const;
export const ijoId = (cycleNumber: number) => `ijo-${cycleNumber}`;

/** 位相法の種類(支合・半会・方三位・対冲・刑・害・破) */
export type IsouKind = "shigo" | "hankai" | "hosani" | "taichu" | "kei" | "gai" | "ha";
export const ISOU_KINDS: readonly IsouKind[] = ["shigo", "hankai", "hosani", "taichu", "kei", "gai", "ha"];
export const isouId = (k: IsouKind) => `isou-${k}`;
```

`ELEMENT_IDS` を次に置き換える:

```ts
/** 早見表の項目を持つ実装済みの占術 */
export type ElementSystemId = "numerology" | "kyusei" | "maya" | "shichu" | "sanmei";

/** 占術ごとの早見表の項目 id の一覧 */
export const ELEMENT_IDS: Record<ElementSystemId, readonly string[]> = {
  numerology: [...range(1, 9), 11, 22, 33].map(numberId),
  kyusei: [...range(1, 9).map(starId), ...PALACES.map(palaceId), ...DIRECTIONS.map(directionId)],
  maya: [...range(1, 20).map(sealId), ...range(1, 13).map(toneId), ...range(0, 13).map(moonId)],
  shichu: [
    ...range(1, 10).map(stemId),
    ...range(1, 12).map(branchId),
    ...range(1, 10).map(tsuhenId),
    ...range(1, 12).map(unseiId),
    ...FIVE_ELEMENTS.map(elementId),
  ],
  sanmei: [
    ...range(1, 10).map(mainStarId),
    ...range(1, 12).map(subStarId),
    ...range(1, 6).map(tenchuId),
    ...SHUKUMEI_KINDS.map(shukumeiId),
    ...[...IJO_NORMAL, ...IJO_ANGOU].map(ijoId),
    ...ISOU_KINDS.map(isouId),
  ],
};
```

`src/lib/fortune/types.ts` の `SystemReading` の前に追記し、`SystemReading` に `chart` を足す:

```ts
/**
 * 人物像の専用の図(設計書 §11.2)。セルは表示用の事実(タップで詳細)。
 * factKeys は natal のうちこの図が表している事実の key で、図があるときは一覧に重ねて出さない
 */
export type NatalChart =
  | {
      /** 四柱推命の命式表。columns は柱の名前、rows は「干支・通変星・蔵干・十二運」。空きのセルは null */
      kind: "pillars";
      columns: string[];
      rows: { label: string; cells: (Fact | null)[] }[];
      factKeys: string[];
    }
  | {
      /** 算命学の人体星図。3×3 を左上から行ごとに並べる。空きのマスは null */
      kind: "body-stars";
      cells: ({ fact: Fact; tone: "center" | "main" | "sub" } | null)[];
      factKeys: string[];
    };
```

`SystemReading` の `ambiguous` の後に:

```ts
  /** 人物像の専用の図(四柱推命の命式表・算命学の人体星図)。なければタイルで表示する */
  chart?: NatalChart;
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune && npx tsc --noEmit -p .`
Expected: PASS、型エラーなし(`registry.test.ts` の `ELEMENT_IDS[r.id as keyof typeof ELEMENT_IDS]` はそのまま通る)

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/element-ids.ts src/lib/fortune/types.ts src/lib/fortune/__tests__/element-ids.test.ts
git commit -m "feat: 四柱推命・算命学の早見表の項目 id と、人物像の図の型を追加"
```

---

### Task 5: 四柱推命の計算

**Files:**
- Create: `src/lib/fortune/shichu/calc.ts`
- Test: `src/lib/fortune/shichu/__tests__/calc.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/shichu/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import { STEMS, cycleName } from "../../sexagenary";
import { tokyoToUtc } from "../../tokyo-time";
import { elementCounts, hourBoundariesWithin, localMeanTime, sameShichuNatal, shichuNatalAt, zokan } from "../calc";

const date = { year: 1990, month: 3, day: 29 };

describe("zokan(月律分野蔵干)", () => {
  it("節入り日を1日目とする日数で1つに絞ること", () => {
    const name = (branch: number, day: number) => STEMS[zokan(branch, day)];
    expect(name(6, 24)).toBe("丁"); // 午: 丙10・己9・丁
    expect(name(6, 10)).toBe("丙");
    expect(name(6, 11)).toBe("己");
    expect(name(3, 24)).toBe("乙"); // 卯: 甲10・乙
    expect(name(5, 24)).toBe("丙"); // 巳: 戊5・庚9・丙
    expect(name(5, 5)).toBe("戊");
    expect(name(5, 14)).toBe("庚");
    expect(name(7, 24)).toBe("己"); // 未: 丁9・乙3・己
    expect(name(8, 1)).toBe("戊"); // 申の余気は戊
    expect(name(0, 31)).toBe("癸");
  });
});

describe("localMeanTime", () => {
  it("経度135度では日本標準時と同じ壁時計になること", () => {
    const lmt = localMeanTime(tokyoToUtc(1990, 3, 29, 14, 0), 135);
    expect([lmt.getUTCHours(), lmt.getUTCMinutes()]).toEqual([14, 0]);
  });

  it("東京(139.69度)では約19分進むこと", () => {
    const lmt = localMeanTime(tokyoToUtc(1990, 3, 29, 14, 0), 139.69);
    expect([lmt.getUTCHours(), lmt.getUTCMinutes()]).toEqual([14, 18]);
  });
});

describe("shichuNatalAt", () => {
  it("時刻を指定したときは4柱を出すこと(明石基準)", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 14, 30), { lon: 135, hourKnown: true, localDate: date });
    expect([n.year, n.month, n.day].map(cycleName)).toEqual(["庚午", "己卯", "癸巳"]);
    expect(n.hour === null ? null : cycleName(n.hour)).toBe("己未");
    expect(n.dayNumber).toBe(24);
  });

  it("時刻が分からないときは時柱を出さず、日柱は日本時間の暦日で出すこと", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 23, 50), { lon: 141.35, hourKnown: false, localDate: date });
    expect(cycleName(n.day)).toBe("癸巳");
    expect(n.hour).toBeNull();
  });

  it("23時台は日柱をその日のまま、時柱だけ翌日の子の刻にすること", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 23, 30), { lon: 135, hourKnown: true, localDate: date });
    expect(cycleName(n.day)).toBe("癸巳");
    // 翌日 甲午 の子の刻 → 甲子
    expect(n.hour === null ? null : cycleName(n.hour)).toBe("甲子");
  });

  it("経度補正で0時をまたぐと日柱も変わること", () => {
    // 福岡(130.42度)の 0:10 は地方平均時で前日 23:51 → 日柱は前日(3/29)の 癸巳。
    // 23時台なので時柱は翌日(3/30 甲午)の子の刻 → 甲子
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 30, 0, 10), {
      lon: 130.42,
      hourKnown: true,
      localDate: { year: 1990, month: 3, day: 30 },
    });
    expect(cycleName(n.day)).toBe("癸巳");
    expect(n.hour === null ? null : cycleName(n.hour)).toBe("甲子");
  });
});

describe("hourBoundariesWithin", () => {
  it("地方平均時の奇数時ちょうどと0時を、範囲の内側だけ返すこと", () => {
    const range = { start: tokyoToUtc(1990, 3, 29, 14, 0), end: tokyoToUtc(1990, 3, 29, 15, 0) };
    // 東京: 地方平均時 15:00 = 日本時間 14:41 ごろ
    const b = hourBoundariesWithin(range, 139.69);
    expect(b).toHaveLength(1);
    expect(b[0].getTime()).toBeCloseTo(tokyoToUtc(1990, 3, 29, 15, 0).getTime() - 18.76 * 60_000, -3);
    // 明石: 15:00 は範囲の端なので含めない
    expect(hourBoundariesWithin(range, 135)).toEqual([]);
  });

  it("0時(日付の境目)も含めること", () => {
    const range = { start: tokyoToUtc(1990, 3, 29, 23, 0), end: tokyoToUtc(1990, 3, 30, 0, 0) };
    // 札幌(141.35度): 地方平均時 0:00 = 日本時間 23:35 ごろ
    expect(hourBoundariesWithin(range, 141.35)).toHaveLength(1);
  });
});

describe("elementCounts", () => {
  it("天干と地支の五行を数え、時柱がなければ3柱で数えること", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 14, 30), { lon: 135, hourKnown: true, localDate: date });
    // 庚(金) 己(土) 癸(水) 己(土) / 午(火) 卯(木) 巳(火) 未(土)
    expect(elementCounts(n)).toEqual([1, 2, 3, 1, 1]);
    expect(elementCounts({ ...n, hour: null })).toEqual([1, 2, 1, 1, 1]);
  });
});

describe("sameShichuNatal", () => {
  it("4柱と日数がすべて同じときだけ同じとみなすこと", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 14, 30), { lon: 135, hourKnown: true, localDate: date });
    expect(sameShichuNatal(n, { ...n })).toBe(true);
    expect(sameShichuNatal(n, { ...n, hour: null })).toBe(false);
    expect(sameShichuNatal(n, { ...n, dayNumber: 25 })).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/shichu/__tests__/calc.test.ts`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/shichu/calc.ts
import { dayNumberInSolarMonth, solarMonthAt } from "../astro/solar-terms";
import type { LocalDate } from "../local-date";
import {
  branchElement,
  branchOf,
  dayCycleIndex,
  hourBranchIndex,
  hourCycleIndex,
  monthCycleIndex,
  stemElement,
  stemOf,
  yearCycleIndex,
} from "../sexagenary";
import type { TimeRange } from "../types";

/**
 * 月律分野蔵干。十二支ごとに [十干, その蔵干が受け持つ最後の日(節入り日を1日目)] を余気・中気・本気の順に並べる。
 * 日本で最も一般的な表(『星平会海』『淵海子平』系)。申の余気は戊とする
 */
const ZOKAN: readonly (readonly (readonly [stem: number, lastDay: number])[])[] = [
  [[8, 10], [9, Infinity]], // 子 壬10・癸
  [[9, 9], [7, 12], [5, Infinity]], // 丑 癸9・辛3・己
  [[4, 7], [2, 14], [0, Infinity]], // 寅 戊7・丙7・甲
  [[0, 10], [1, Infinity]], // 卯 甲10・乙
  [[1, 9], [9, 12], [4, Infinity]], // 辰 乙9・癸3・戊
  [[4, 5], [6, 14], [2, Infinity]], // 巳 戊5・庚9・丙
  [[2, 10], [5, 19], [3, Infinity]], // 午 丙10・己9・丁
  [[3, 9], [1, 12], [5, Infinity]], // 未 丁9・乙3・己
  [[4, 10], [8, 13], [6, Infinity]], // 申 戊10・壬3・庚
  [[6, 10], [7, Infinity]], // 酉 庚10・辛
  [[7, 9], [3, 12], [4, Infinity]], // 戌 辛9・丁3・戊
  [[4, 7], [0, 12], [8, Infinity]], // 亥 戊7・甲5・壬
];

/** 十二支の蔵干(節入り日を1日目とする日数で1つに絞る) */
export function zokan(branch: number, dayNumber: number): number {
  const found = ZOKAN[branch].find(([, lastDay]) => dayNumber <= lastDay);
  return (found ?? ZOKAN[branch][ZOKAN[branch].length - 1])[0];
}

export interface ShichuNatal {
  /** 六十干支の番号(0 = 甲子) */
  year: number;
  month: number;
  day: number;
  /** 時刻を指定していないときは null */
  hour: number | null;
  /** 生まれ月の節入り日を1日目とする日数(蔵干の選択に使う) */
  dayNumber: number;
}

/** 地方平均時(UTC + 経度/15 時間)の壁時計。getUTC* で読む */
export function localMeanTime(at: Date, lon: number): Date {
  return new Date(at.getTime() + lon * 4 * 60_000);
}

export interface ShichuOptions {
  /** 出生地の経度(未入力なら明石 135.0) */
  lon: number;
  /** 出生時刻を「時刻を指定」で入力したか。false なら時柱を出さず、日柱は localDate で出す */
  hourKnown: boolean;
  /** 日本時間の生年月日 */
  localDate: LocalDate;
}

/**
 * その瞬間に生まれたときの命式。年柱は立春、月柱は節入り(どちらも瞬間で判定)。
 * 時刻を指定したときは地方平均時で日柱(0時切替)と時柱を出し、23時台は時柱だけ翌日の子の刻にする
 */
export function shichuNatalAt(at: Date, options: ShichuOptions): ShichuNatal {
  const month = solarMonthAt(at);
  const base = {
    year: yearCycleIndex(month.kyuseiYear),
    month: monthCycleIndex(month.kyuseiYear, month.index),
    dayNumber: dayNumberInSolarMonth(at),
  };
  if (!options.hourKnown) return { ...base, day: dayCycleIndex(options.localDate), hour: null };
  const lmt = localMeanTime(at, options.lon);
  const day = dayCycleIndex({ year: lmt.getUTCFullYear(), month: lmt.getUTCMonth() + 1, day: lmt.getUTCDate() });
  const h = lmt.getUTCHours();
  const hourDayStem = stemOf(h === 23 ? day + 1 : day);
  return { ...base, day, hour: hourCycleIndex(hourDayStem, hourBranchIndex(h)) };
}

export function sameShichuNatal(a: ShichuNatal, b: ShichuNatal): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.dayNumber === b.dayNumber;
}

/** 時柱の境目(地方平均時の奇数時ちょうど)と日付の境目(地方平均時の0時)のうち、範囲の内側にあるもの */
export function hourBoundariesWithin(range: TimeRange, lon: number): Date[] {
  const offset = lon * 4 * 60_000;
  const hourMs = 3_600_000;
  const result: Date[] = [];
  for (let t = Math.ceil((range.start.getTime() + offset) / hourMs) * hourMs; t - offset < range.end.getTime(); t += hourMs) {
    const h = new Date(t).getUTCHours();
    const at = new Date(t - offset);
    if ((h % 2 === 1 || h === 0) && at > range.start && at < range.end) result.push(at);
  }
  return result;
}

/** 五行の数(0 = 木 … 4 = 水)。天干と地支を数え、時柱がなければ3柱で数える */
export function elementCounts(n: ShichuNatal): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const c of [n.year, n.month, n.day, n.hour]) {
    if (c === null) continue;
    counts[stemElement(stemOf(c))]++;
    counts[branchElement(branchOf(c))]++;
  }
  return counts;
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/shichu/__tests__/calc.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/shichu
git commit -m "feat: 四柱推命の命式の計算(4柱・地方平均時の補正・月律分野蔵干・五行の数)を追加"
```

---

### Task 6: 四柱推命の読み取り(人物像・命式表・運勢)

**Files:**
- Create: `src/lib/fortune/shichu/index.ts`
- Test: `src/lib/fortune/shichu/__tests__/shichu.test.ts`

人物像の事実(`natal`)の順と key:

| key | ラベル | 値の例 | 参照 |
|---|---|---|---|
| `day-master` | 日干 | 癸(陰の水) | 十干 |
| `year-pillar` / `month-pillar` / `day-pillar` / `hour-pillar` | 年柱 / 月柱 / 日柱 / 時柱 | 庚午 / 時刻不明 | 十干・十二支(時刻不明なら空) |
| `meishiki` | 命式 | 年柱 庚午(印綬・丁・絶) / 月柱 己卯(偏官・乙・長生) / 日柱 癸巳(日主・丙・胎) / 時柱 時刻不明 | なし(総合鑑定プロンプト用。candidates は付けない) |
| `gogyo` | 五行バランス | 木1・火2・土1・金1・水1 | いちばん多い五行(同数なら全部) |
| `daiun` | 大運 | 2歳運・順行 | なし(性別が未入力なら事実ごと出さない) |

命式表(`chart.kind = "pillars"`)の行は「干支・通変星・蔵干・十二運」。`factKeys` は `year-pillar`・`month-pillar`・`day-pillar`・`hour-pillar`・`meishiki`(一覧には日干・五行バランス・大運が残る)。時刻不明のとき、時柱の列は干支の行だけ「時刻不明」で、ほかの行は `null`。日柱の通変星は「日主」(参照は日干の十干)。

運勢(§3.1): 今日=日の干支と命式の関係、今月=月の干支、今年=年の干支+大運。チップは `ganshi`(日の干支 / 月の干支 / 年の干支。参照: 十干・十二支)、`tsuhen`(通変星)、`unsei`(十二運。日干から見たその期間の十二支)、今年だけ `daiun`(性別があるとき)。見出しは「{今日|今月|今年}の干支は{干支}。日干{癸}に対して{辛}は{偏印}」で、参照は通変星。日柱が候補に分かれるときは各期間に「日柱を{A}として計算(出生時刻により{B}の可能性があります)」の注記を付ける。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/shichu/__tests__/shichu.test.ts
import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";
import { shichu } from "../index";

const today = { year: 2026, month: 10, day: 14 };
const read = (p: BirthProfile) => shichu.read(p, toBirthMoment(p), today);
const fact = (r: ReturnType<typeof read>, key: string) => r.natal.find((f) => f.key === key);

describe("shichu.read 人物像", () => {
  const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };

  it("日干と4柱を返すこと(明石基準)", () => {
    const r = read(p);
    expect(r.id).toBe("shichu");
    expect(r.natal.map((f) => f.key)).toEqual([
      "day-master",
      "year-pillar",
      "month-pillar",
      "day-pillar",
      "hour-pillar",
      "meishiki",
      "gogyo",
    ]);
    expect(fact(r, "day-master")).toEqual({
      key: "day-master",
      label: "日干",
      value: "癸(陰の水)",
      refs: [{ system: "shichu", id: "stem-10" }],
    });
    expect(fact(r, "year-pillar")?.value).toBe("庚午");
    expect(fact(r, "year-pillar")?.refs).toEqual([
      { system: "shichu", id: "stem-7" },
      { system: "shichu", id: "branch-7" },
    ]);
    expect(fact(r, "month-pillar")?.value).toBe("己卯");
    expect(fact(r, "day-pillar")?.value).toBe("癸巳");
    expect(fact(r, "hour-pillar")?.value).toBe("己未");
    expect(fact(r, "meishiki")?.value).toBe(
      "年柱 庚午(印綬・丁・絶) / 月柱 己卯(偏官・乙・長生) / 日柱 癸巳(日主・丙・胎) / 時柱 己未(偏官・己・墓)",
    );
    expect(fact(r, "gogyo")).toEqual({
      key: "gogyo",
      label: "五行バランス",
      value: "木1・火2・土3・金1・水1",
      refs: [{ system: "shichu", id: "element-earth" }],
    });
    expect(r.ambiguous).toBe(false);
  });

  it("命式表を返すこと", () => {
    const r = read(p);
    expect(r.chart?.kind).toBe("pillars");
    if (r.chart?.kind !== "pillars") return;
    expect(r.chart.columns).toEqual(["年柱", "月柱", "日柱", "時柱"]);
    expect(r.chart.rows.map((row) => [row.label, row.cells.map((c) => c?.value ?? null)])).toEqual([
      ["干支", ["庚午", "己卯", "癸巳", "己未"]],
      ["通変星", ["印綬", "偏官", "日主", "偏官"]],
      ["蔵干", ["丁", "乙", "丙", "己"]],
      ["十二運", ["絶", "長生", "胎", "墓"]],
    ]);
    expect(r.chart.factKeys).toEqual(["year-pillar", "month-pillar", "day-pillar", "hour-pillar", "meishiki"]);
  });

  it("時刻不明なら時柱を「時刻不明」にし、五行は3柱で数えること", () => {
    const r = read({ ...p, time: { kind: "unknown" } });
    expect(fact(r, "hour-pillar")).toEqual({ key: "hour-pillar", label: "時柱", value: "時刻不明", refs: [] });
    expect(fact(r, "gogyo")?.value).toBe("木1・火2・土1・金1・水1");
    if (r.chart?.kind !== "pillars") throw new Error("命式表がない");
    expect(r.chart.rows.map((row) => row.cells[3]?.value ?? null)).toEqual(["時刻不明", null, null, null]);
    expect(r.ambiguous).toBe(false);
  });

  it("東京の14時台は時柱を候補にすること(地方平均時 15:00 = 14:41 ごろ)", () => {
    const r = read({ ...p, prefecture: "13" });
    expect(fact(r, "hour-pillar")?.value).toMatch(/^己未\(〜14:4\d\) \/ 庚申\(14:4\d〜\)$/);
    expect(r.ambiguous).toBe(true);
    expect(fact(r, "meishiki")?.candidates).toBeUndefined();
  });

  it("性別があれば大運を返すこと", () => {
    expect(fact(read({ ...p, gender: "male" }), "daiun")).toEqual({ key: "daiun", label: "大運", value: "2歳運・順行", refs: [] });
    expect(fact(read({ ...p, gender: "female" }), "daiun")?.value).toBe("8歳運・逆行");
    expect(fact(read(p), "daiun")).toBeUndefined();
  });

  it("節入り当日で時刻不明なら月柱を候補にすること", () => {
    // 啓蟄 1990/3/6 5:19
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 6 }, time: { kind: "unknown" } });
    expect(fact(r, "month-pillar")?.value).toMatch(/^戊寅\(〜5:19\) \/ 己卯\(5:19〜\)$/);
    expect(r.ambiguous).toBe(true);
  });
});

describe("shichu.read 運勢", () => {
  const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" };

  it("今日は日の干支と日干の関係", () => {
    const day = read(p).periods.day;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline).toEqual({
      text: "今日の干支は辛酉。日干癸に対して辛は偏印",
      ref: { system: "shichu", id: "tsuhen-9" },
    });
    expect(day.chips.map((c) => [c.key, c.label, c.value])).toEqual([
      ["ganshi", "日の干支", "辛酉"],
      ["tsuhen", "通変星", "偏印"],
      ["unsei", "十二運", "病"],
    ]);
  });

  it("今月は月の干支", () => {
    const month = read(p).periods.month;
    expect(month.rangeLabel).toBe("2026/10/8〜2026/11/6");
    expect(month.chips.map((c) => c.value)).toEqual(["戊戌", "正官", "衰"]);
  });

  it("今年は年の干支と大運", () => {
    const year = read(p).periods.year;
    expect(year.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(year.chips.map((c) => [c.key, c.value])).toEqual([
      ["ganshi", "丙午"],
      ["tsuhen", "正財"],
      ["unsei", "絶"],
      ["daiun", "癸未(比肩、32〜41歳)"],
    ]);
  });

  it("性別がなければ大運のチップを出さないこと", () => {
    const year = read({ ...p, gender: undefined }).periods.year;
    expect(year.chips.map((c) => c.key)).toEqual(["ganshi", "tsuhen", "unsei"]);
  });

  it("日柱が候補に分かれるときは注記を付けること", () => {
    // 福岡の0時台: 地方平均時 0:00 = 0:18 ごろ。0:00〜0:18 は前日の日柱
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 30 }, time: { kind: "hour", hour: 0 }, prefecture: "40" });
    expect(r.natal.find((f) => f.key === "day-pillar")?.value).toMatch(/^癸巳\(〜0:1\d\) \/ 甲午\(0:1\d〜\)$/);
    for (const period of ["day", "month", "year"] as const) {
      expect(r.periods[period].note).toBe("日柱を癸巳として計算(出生時刻により甲午の可能性があります)");
    }
  });
});
```

福岡県のコードと経度は `src/lib/fortune/prefectures.ts` で確かめる(コード `"40"`、経度 130.4 前後)。違えば、テストのコメントと時刻を実際の値に合わせる。

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/shichu/__tests__/shichu.test.ts`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/shichu/index.ts
import { describeResolved, isAmbiguous, representative, resolvedValues, resolveOverRange } from "../ambiguity";
import { calendarPeriod } from "../astro/calendar-period";
import { jieBoundariesWithin } from "../astro/solar-terms";
import { ageOn, daiunAt, daiunPlan, type DaiunPlan } from "../daiun";
import { FIVE_ELEMENTS, branchId, elementId, stemId, tsuhenId, unseiId } from "../element-ids";
import { resolvedFact } from "../fact";
import type { LocalDate } from "../local-date";
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
import type { ElementRef, Fact, FortuneSystemModule, NatalChart, Period, PeriodResult, TimeRange } from "../types";
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

/** 柱の通変星。日柱は「日主」 */
function pillarTsuhen(n: ShichuNatal, cycle: number, isDay: boolean): string {
  return isDay ? "日主" : TEN_GOD_NAMES[tenGodIndex(stemOf(n.day), stemOf(cycle))];
}

function meishikiText(n: ShichuNatal): string {
  return PILLARS.map(({ label, pick }) => {
    const c = pick(n);
    if (c === null) return `${label} ${UNKNOWN_HOUR}`;
    const dayStem = stemOf(n.day);
    const detail = [
      pillarTsuhen(n, c, label === "日柱"),
      STEMS[zokan(branchOf(c), n.dayNumber)],
      TWELVE_STAGE_NAMES[twelveStageIndex(dayStem, branchOf(c))],
    ].join("・");
    return `${label} ${cycleName(c)}(${detail})`;
  }).join(" / ");
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

const PERIOD_WORD: Record<Period, string> = { day: "今日", month: "今月", year: "今年" };
const GANSHI_LABEL: Record<Period, string> = { day: "日の干支", month: "月の干支", year: "年の干支" };

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
    const hourKnown = profile.time.kind === "hour";
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
    // 大運は代表の候補の区間の中央の瞬間で計算する
    const repRange = natal.kind === "fixed" ? moment.range : natal.options[0].range;
    const plan = profile.gender ? daiunPlan(midpoint(repRange), base.year, base.month, profile.gender) : null;

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
      ...(plan ? [{ key: "daiun", label: "大運", value: `${plan.startAge}歳運・${plan.forward ? "順行" : "逆行"}`, refs: [] }] : []),
    ];

    /** 命式表のセル。代表の命式で値がない(時刻不明の時柱)なら空き。label は詳細シートの見出しに出る(例「年柱の通変星」) */
    const cell = (
      key: string,
      label: string,
      format: (n: ShichuNatal) => string | null,
      refsOf: (n: ShichuNatal) => ElementRef[],
    ): Fact | null => {
      if (format(base) === null) return null;
      return fact(key, label, (n) => format(n) ?? UNKNOWN_HOUR, refsOf);
    };
    const chart: NatalChart = {
      kind: "pillars",
      columns: PILLARS.map((p) => p.label),
      rows: [
        { label: "干支", cells: pillarFacts },
        {
          label: "通変星",
          cells: PILLARS.map(({ key, label, pick }) =>
            cell(
              `${key}-tsuhen`,
              `${label}の通変星`,
              (n) => {
                const c = pick(n);
                return c === null ? null : pillarTsuhen(n, c, label === "日柱");
              },
              (n) => {
                const c = pick(n);
                if (c === null) return [];
                return label === "日柱" ? [stemRef(stemOf(n.day))] : [ref(tsuhenId(tenGodIndex(stemOf(n.day), stemOf(c)) + 1))];
              },
            ),
          ),
        },
        {
          label: "蔵干",
          cells: PILLARS.map(({ key, label, pick }) =>
            cell(
              `${key}-zokan`,
              `${label}の蔵干`,
              (n) => {
                const c = pick(n);
                return c === null ? null : STEMS[zokan(branchOf(c), n.dayNumber)];
              },
              (n) => {
                const c = pick(n);
                return c === null ? [] : [stemRef(zokan(branchOf(c), n.dayNumber))];
              },
            ),
          ),
        },
        {
          label: "十二運",
          cells: PILLARS.map(({ key, label, pick }) =>
            cell(
              `${key}-unsei`,
              `${label}の十二運`,
              (n) => {
                const c = pick(n);
                return c === null ? null : TWELVE_STAGE_NAMES[twelveStageIndex(stemOf(n.day), branchOf(c))];
              },
              (n) => {
                const c = pick(n);
                return c === null ? [] : [ref(unseiId(twelveStageIndex(stemOf(n.day), branchOf(c)) + 1))];
              },
            ),
          ),
        },
      ],
      factKeys: [...PILLARS.map((p) => p.key), "meishiki"],
    };

    // 運勢は代表の日柱で計算する。日柱が候補に分かれるときはその旨を各期間に添える
    const otherDays = [...new Set(resolvedValues(natal).map((n) => n.day))].filter((d) => d !== base.day);
    const note = otherDays.length
      ? `日柱を${cycleName(base.day)}として計算(出生時刻により${otherDays.map(cycleName).join("・")}の可能性があります)`
      : undefined;
    const daiun = plan ? { plan, age: ageOn(profile.date, today) } : null;

    return {
      id: "shichu",
      name: "四柱推命",
      nameEn: "Four Pillars",
      method:
        "年柱は立春、月柱は節入りで区切る。日柱は0時切替で、23時台は時柱だけ翌日の子の刻。時刻を指定したときだけ出生地の経度で地方平均時に補正して日柱・時柱を出す(出生地未入力は明石基準で補正なし)。時刻が不明・午前午後のときは時柱を出さない。蔵干は月律分野蔵干(申の余気は戊)を、節入り日を1日目とする日数で全柱に当てる。大運は年干の陰陽と性別で順逆を決め、節入り日までの日数÷3を四捨五入(1〜10歳)。神殺は扱わない",
      natal: facts,
      ambiguous: isAmbiguous(natal),
      chart,
      periods: {
        day: periodResult("day", base, today, daiun, note),
        month: periodResult("month", base, today, daiun, note),
        year: periodResult("year", base, today, daiun, note),
      },
    };
  },
};

function midpoint(range: TimeRange): Date {
  return new Date((range.start.getTime() + range.end.getTime()) / 2);
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/shichu && npx eslint src/lib/fortune/shichu`
Expected: PASS、lint エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/shichu
git commit -m "feat: 四柱推命の人物像(命式表・五行・大運)と今日・今月・今年の運勢を追加"
```

---

### Task 7: 算命学の計算(星・天中殺・宿命中殺・異常干支・位相法)

**Files:**
- Create: `src/lib/fortune/sanmei/calc.ts`
- Create: `src/lib/fortune/sanmei/patterns.ts`
- Test: `src/lib/fortune/sanmei/__tests__/calc.test.ts`
- Test: `src/lib/fortune/sanmei/__tests__/patterns.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/sanmei/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import { STEMS, cycleIndexOf, cycleName } from "../../sexagenary";
import { tokyoToUtc } from "../../tokyo-time";
import { MAIN_STAR_NAMES, SUB_STAR_NAMES, TENCHU_NAMES, bodyStars, nijuhachigen, sanmeiNatalAt, tenchuOf } from "../calc";

const date = { year: 1990, month: 3, day: 29 };

describe("nijuhachigen(二十八元)", () => {
  it("節入り日を1日目とする日数で初元・中元・本元を選ぶこと", () => {
    const name = (branch: number, day: number) => STEMS[nijuhachigen(branch, day)];
    expect(name(0, 1)).toBe("癸"); // 子
    expect(name(1, 9)).toBe("癸"); // 丑
    expect(name(1, 10)).toBe("辛");
    expect(name(1, 13)).toBe("己");
    expect(name(6, 19)).toBe("己"); // 午
    expect(name(6, 20)).toBe("丁");
    expect(name(6, 24)).toBe("丁");
    expect(name(3, 24)).toBe("乙"); // 卯
    expect(name(5, 24)).toBe("丙"); // 巳
    expect(name(8, 11)).toBe("壬"); // 申
    expect(name(11, 12)).toBe("甲"); // 亥
    expect(name(11, 13)).toBe("壬");
  });
});

describe("sanmeiNatalAt", () => {
  it("年・月・日の3柱と日数を返すこと(日柱は暦日)", () => {
    const n = sanmeiNatalAt(tokyoToUtc(1990, 3, 29, 12, 0), date);
    expect([n.year, n.month, n.day].map(cycleName)).toEqual(["庚午", "己卯", "癸巳"]);
    expect(n.dayNumber).toBe(24);
  });
});

describe("bodyStars(人体星図)", () => {
  it("十大主星と十二大従星を配置すること", () => {
    const s = bodyStars(sanmeiNatalAt(tokyoToUtc(1990, 3, 29, 12, 0), date));
    expect({
      north: MAIN_STAR_NAMES[s.north],
      south: MAIN_STAR_NAMES[s.south],
      east: MAIN_STAR_NAMES[s.east],
      center: MAIN_STAR_NAMES[s.center],
      west: MAIN_STAR_NAMES[s.west],
      early: SUB_STAR_NAMES[s.early],
      middle: SUB_STAR_NAMES[s.middle],
      late: SUB_STAR_NAMES[s.late],
    }).toEqual({
      north: "玉堂星", // 癸 × 年干 庚
      south: "車騎星", // 癸 × 月干 己
      east: "禄存星", // 癸 × 年支 午 の蔵干 丁
      center: "鳳閣星", // 癸 × 月支 卯 の蔵干 乙
      west: "司禄星", // 癸 × 日支 巳 の蔵干 丙
      early: "天馳星", // 癸 × 午(絶)
      middle: "天貴星", // 癸 × 卯(長生)
      late: "天報星", // 癸 × 巳(胎)
    });
  });
});

describe("tenchuOf", () => {
  it("日干支の旬から天中殺の2支を求めること", () => {
    expect(tenchuOf(0)).toEqual({ number: 6, branches: [10, 11] }); // 甲子旬 → 戌亥
    expect(tenchuOf(10)).toEqual({ number: 5, branches: [8, 9] }); // 甲戌旬 → 申酉
    expect(tenchuOf(29)).toEqual({ number: 4, branches: [6, 7] }); // 癸巳(甲申旬) → 午未
    expect(tenchuOf(59)).toEqual({ number: 1, branches: [0, 1] }); // 癸亥(甲寅旬) → 子丑
    expect(TENCHU_NAMES[tenchuOf(cycleIndexOf(2, 2)).number - 1]).toBe("戌亥天中殺"); // 丙寅は甲子旬
  });
});
```

```ts
// src/lib/fortune/sanmei/__tests__/patterns.test.ts
import { describe, it, expect } from "vitest";
import { cycleIndexOf } from "../../sexagenary";
import { ijoKanshi, isouho, shukumeiChusatsu } from "../patterns";

/** 干支の名前から番号 */
const c = (stem: string, branch: string) =>
  cycleIndexOf("甲乙丙丁戊己庚辛壬癸".indexOf(stem), "子丑寅卯辰巳午未申酉戌亥".indexOf(branch));

describe("shukumeiChusatsu", () => {
  it("年支が日干支の天中殺なら生年中殺", () => {
    // 癸巳(午未天中殺)の日に 庚午 の年
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("癸", "巳") })).toEqual(["year"]);
  });

  it("月支が日干支の天中殺なら生月中殺", () => {
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("癸", "未"), day: c("癸", "巳") })).toEqual(["year", "month"]);
  });

  it("日支が年干支の天中殺なら生日中殺", () => {
    // 甲子年(戌亥天中殺)の 丙戌 の日。丙戌は甲申旬(午未天中殺)なので年支 子 は該当しない
    expect(shukumeiChusatsu({ year: c("甲", "子"), month: c("丙", "寅"), day: c("丙", "戌") })).toEqual(["day"]);
  });

  it("日干支が甲戌・乙亥なら日座中殺、甲辰・乙巳なら日居中殺", () => {
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("甲", "戌") })).toContain("nichiza");
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("乙", "亥") })).toContain("nichiza");
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("甲", "辰") })).toContain("nikkyo");
    expect(shukumeiChusatsu({ year: c("庚", "午"), month: c("己", "卯"), day: c("乙", "巳") })).toContain("nikkyo");
  });
});

describe("ijoKanshi", () => {
  it("年・月・日の柱にある異常干支を返すこと", () => {
    expect(ijoKanshi({ year: c("庚", "午"), month: c("己", "卯"), day: c("癸", "巳") })).toEqual([
      { pillar: "day", cycleNumber: 30, kind: "angou" },
    ]);
    expect(ijoKanshi({ year: c("甲", "戌"), month: c("丁", "巳"), day: c("甲", "子") })).toEqual([
      { pillar: "year", cycleNumber: 11, kind: "normal" },
      { pillar: "month", cycleNumber: 54, kind: "normal" },
    ]);
    expect(ijoKanshi({ year: c("甲", "子"), month: c("丙", "寅"), day: c("丁", "卯") })).toEqual([]);
  });
});

describe("isouho(位相法)", () => {
  /** 年支・月支・日支 */
  const b = (...names: string[]) => names.map((n) => "子丑寅卯辰巳午未申酉戌亥".indexOf(n)) as [number, number, number];

  it("2支ずつの関係を、種類の順・柱の組の順に返すこと", () => {
    expect(isouho(b("午", "卯", "巳"))).toEqual([{ kind: "ha", pillars: ["year", "month"] }]);
    expect(isouho(b("子", "丑", "午"))).toEqual([
      { kind: "shigo", pillars: ["year", "month"] },
      { kind: "taichu", pillars: ["year", "day"] },
      { kind: "gai", pillars: ["month", "day"] },
    ]);
  });

  it("半会は旺支を含まない組も数えること", () => {
    expect(isouho(b("申", "辰", "卯"))).toEqual([
      { kind: "hankai", pillars: ["year", "month"] },
      { kind: "gai", pillars: ["month", "day"] },
    ]);
  });

  it("方三位は3支がそろったときだけ", () => {
    expect(isouho(b("寅", "卯", "辰"))).toEqual([
      { kind: "hosani", pillars: ["year", "month", "day"] },
      { kind: "gai", pillars: ["month", "day"] },
    ]);
  });

  it("寅亥・巳申は支合と破の両方、自刑は同じ支どうし", () => {
    expect(isouho(b("寅", "亥", "未"))).toEqual([
      { kind: "shigo", pillars: ["year", "month"] },
      { kind: "hankai", pillars: ["month", "day"] },
      { kind: "ha", pillars: ["year", "month"] },
    ]);
    expect(isouho(b("午", "午", "子"))).toEqual([
      { kind: "taichu", pillars: ["year", "day"] },
      { kind: "taichu", pillars: ["month", "day"] },
      { kind: "kei", pillars: ["year", "month"] },
    ]);
  });
});
```

注: テストの期待値は「位相法の種類の順(支合・半会・方三位・対冲・刑・害・破)→ 柱の組の順(年月・年日・月日)」で並べている。`b("子", "丑", "午")` は 子丑=支合(年月)、子午=対冲(年日)、丑午=害(月日)。`b("寅", "亥", "未")` は 寅亥=支合(年月)・破(年月)、亥未=半会(月日)、寅未は関係なし。

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/sanmei`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/sanmei/calc.ts
import { dayNumberInSolarMonth, solarMonthAt } from "../astro/solar-terms";
import { mod, type LocalDate } from "../local-date";
import { branchOf, dayCycleIndex, monthCycleIndex, stemOf, tenGodIndex, twelveStageIndex, yearCycleIndex } from "../sexagenary";

/** 十大主星(通変星と同じ順: 比肩=貫索星 … 印綬=玉堂星) */
export const MAIN_STAR_NAMES = [
  "貫索星", "石門星", "鳳閣星", "調舒星", "禄存星", "司禄星", "車騎星", "牽牛星", "龍高星", "玉堂星",
] as const;

/** 十二大従星(十二運と同じ順: 長生=天貴星 … 養=天印星) */
export const SUB_STAR_NAMES = [
  "天貴星", "天恍星", "天南星", "天禄星", "天将星", "天堂星", "天胡星", "天極星", "天庫星", "天馳星", "天報星", "天印星",
] as const;

/** 天中殺(1 = 子丑 … 6 = 戌亥) */
export const TENCHU_NAMES = ["子丑天中殺", "寅卯天中殺", "辰巳天中殺", "午未天中殺", "申酉天中殺", "戌亥天中殺"] as const;

/**
 * 二十八元。十二支ごとに [十干, その蔵干が受け持つ最後の日(節入り日を1日目)] を初元・中元・本元の順に並べる(高尾学館式)
 */
const NIJUHACHIGEN: readonly (readonly (readonly [stem: number, lastDay: number])[])[] = [
  [[9, Infinity]], // 子 癸
  [[9, 9], [7, 12], [5, Infinity]], // 丑 癸1-9・辛10-12・己
  [[4, 7], [2, 14], [0, Infinity]], // 寅 戊1-7・丙8-14・甲
  [[1, Infinity]], // 卯 乙
  [[1, 9], [9, 12], [4, Infinity]], // 辰 乙1-9・癸10-12・戊
  [[4, 5], [6, 14], [2, Infinity]], // 巳 戊1-5・庚6-14・丙
  [[5, 19], [3, Infinity]], // 午 己1-19・丁
  [[3, 9], [1, 12], [5, Infinity]], // 未 丁1-9・乙10-12・己
  [[4, 10], [8, 13], [6, Infinity]], // 申 戊1-10・壬11-13・庚
  [[7, Infinity]], // 酉 辛
  [[7, 9], [3, 12], [4, Infinity]], // 戌 辛1-9・丁10-12・戊
  [[0, 12], [8, Infinity]], // 亥 甲1-12・壬
];

/** 十二支の蔵干(二十八元を節入り日を1日目とする日数で選ぶ) */
export function nijuhachigen(branch: number, dayNumber: number): number {
  const list = NIJUHACHIGEN[branch];
  return (list.find(([, lastDay]) => dayNumber <= lastDay) ?? list[list.length - 1])[0];
}

export interface SanmeiNatal {
  /** 六十干支の番号(0 = 甲子) */
  year: number;
  month: number;
  day: number;
  /** 生まれ月の節入り日を1日目とする日数 */
  dayNumber: number;
}

/** その瞬間に生まれたときの宿命(年・月・日の3柱。時柱は使わない。日柱は日本時間の暦日) */
export function sanmeiNatalAt(at: Date, localDate: LocalDate): SanmeiNatal {
  const month = solarMonthAt(at);
  return {
    year: yearCycleIndex(month.kyuseiYear),
    month: monthCycleIndex(month.kyuseiYear, month.index),
    day: dayCycleIndex(localDate),
    dayNumber: dayNumberInSolarMonth(at),
  };
}

export function sameSanmeiNatal(a: SanmeiNatal, b: SanmeiNatal): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.dayNumber === b.dayNumber;
}

/** 人体星図。十大主星は MAIN_STAR_NAMES、十二大従星は SUB_STAR_NAMES の番号 */
export interface BodyStars {
  /** 頭(北)= 日干 × 年干 */
  north: number;
  /** 腹(南)= 日干 × 月干 */
  south: number;
  /** 左手(東)= 日干 × 年支の蔵干 */
  east: number;
  /** 胸(中心星)= 日干 × 月支の蔵干 */
  center: number;
  /** 右手(西)= 日干 × 日支の蔵干 */
  west: number;
  /** 左肩(初年)= 日干 × 年支 */
  early: number;
  /** 左足(中年)= 日干 × 月支 */
  middle: number;
  /** 右足(晩年)= 日干 × 日支 */
  late: number;
}

export function bodyStars(n: SanmeiNatal): BodyStars {
  const d = stemOf(n.day);
  const hidden = (cycle: number) => nijuhachigen(branchOf(cycle), n.dayNumber);
  return {
    north: tenGodIndex(d, stemOf(n.year)),
    south: tenGodIndex(d, stemOf(n.month)),
    east: tenGodIndex(d, hidden(n.year)),
    center: tenGodIndex(d, hidden(n.month)),
    west: tenGodIndex(d, hidden(n.day)),
    early: twelveStageIndex(d, branchOf(n.year)),
    middle: twelveStageIndex(d, branchOf(n.month)),
    late: twelveStageIndex(d, branchOf(n.day)),
  };
}

/** 干支の旬(甲で始まる10日)に欠ける2支が天中殺。number は TENCHU_NAMES の 1 始まりの番号 */
export function tenchuOf(cycle: number): { number: number; branches: [number, number] } {
  const first = mod(Math.floor(mod(cycle, 60) / 10) * 10 + 10, 12);
  return { number: first / 2 + 1, branches: [first, first + 1] };
}
```

```ts
// src/lib/fortune/sanmei/patterns.ts
import { IJO_ANGOU, IJO_NORMAL, ISOU_KINDS, type IsouKind, type ShukumeiKind } from "../element-ids";
import { mod } from "../local-date";
import { branchOf } from "../sexagenary";
import { tenchuOf } from "./calc";

export type SanmeiPillar = "year" | "month" | "day";

export const PILLAR_NAMES: Record<SanmeiPillar, string> = { year: "年柱", month: "月柱", day: "日柱" };
export const BRANCH_PILLAR_NAMES: Record<SanmeiPillar, string> = { year: "年支", month: "月支", day: "日支" };

export const SHUKUMEI_NAMES: Record<ShukumeiKind, string> = {
  year: "生年中殺",
  month: "生月中殺",
  day: "生日中殺",
  nichiza: "日座中殺",
  nikkyo: "日居中殺",
};

export const ISOU_NAMES: Record<IsouKind, string> = {
  shigo: "支合",
  hankai: "半会",
  hosani: "方三位",
  taichu: "対冲",
  kei: "刑",
  gai: "害",
  ha: "破",
};

interface ThreePillars {
  year: number;
  month: number;
  day: number;
}

/** 宿命中殺(生年・生月・生日・日座・日居の順) */
export function shukumeiChusatsu(n: ThreePillars): ShukumeiKind[] {
  const dayVoid = tenchuOf(n.day).branches;
  const yearVoid = tenchuOf(n.year).branches;
  const result: ShukumeiKind[] = [];
  if (dayVoid.includes(branchOf(n.year))) result.push("year");
  if (dayVoid.includes(branchOf(n.month))) result.push("month");
  if (yearVoid.includes(branchOf(n.day))) result.push("day");
  const day = mod(n.day, 60);
  if (day === 10 || day === 11) result.push("nichiza"); // 甲戌・乙亥
  if (day === 40 || day === 41) result.push("nikkyo"); // 甲辰・乙巳
  return result;
}

/** 年・月・日の柱にある異常干支(干支番号は甲子 = 1) */
export function ijoKanshi(n: ThreePillars): { pillar: SanmeiPillar; cycleNumber: number; kind: "normal" | "angou" }[] {
  return (["year", "month", "day"] as const).flatMap((pillar) => {
    const cycleNumber = mod(n[pillar], 60) + 1;
    if ((IJO_NORMAL as readonly number[]).includes(cycleNumber)) return [{ pillar, cycleNumber, kind: "normal" as const }];
    if ((IJO_ANGOU as readonly number[]).includes(cycleNumber)) return [{ pillar, cycleNumber, kind: "angou" as const }];
    return [];
  });
}

const pairSet = (pairs: [number, number][]) => new Set(pairs.flatMap(([a, b]) => [`${a}-${b}`, `${b}-${a}`]));

const SHIGO = pairSet([[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]);
/** 三合(申子辰・亥卯未・寅午戌・巳酉丑)の中の2支 */
const HANKAI = pairSet(
  [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]].flatMap(([a, b, c]) => [[a, b], [b, c], [a, c]] as [number, number][]),
);
const KEI = pairSet([[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [7, 1], [0, 3], [4, 4], [6, 6], [9, 9], [11, 11]]);
const GAI = pairSet([[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]);
const HA = pairSet([[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]]);
const HOSANI = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];

const PAIR_TESTS: Record<Exclude<IsouKind, "hosani">, (a: number, b: number) => boolean> = {
  shigo: (a, b) => SHIGO.has(`${a}-${b}`),
  hankai: (a, b) => a !== b && HANKAI.has(`${a}-${b}`),
  taichu: (a, b) => mod(a - b, 12) === 6,
  kei: (a, b) => KEI.has(`${a}-${b}`),
  gai: (a, b) => GAI.has(`${a}-${b}`),
  ha: (a, b) => HA.has(`${a}-${b}`),
};

const PAIRS: [SanmeiPillar, SanmeiPillar][] = [
  ["year", "month"],
  ["year", "day"],
  ["month", "day"],
];

export interface IsouMatch {
  kind: IsouKind;
  pillars: SanmeiPillar[];
}

/** 位相法。年支・月支・日支の2支ずつ(方三位は3支)の関係を、種類の順・柱の組の順に返す */
export function isouho(branches: [year: number, month: number, day: number]): IsouMatch[] {
  const at: Record<SanmeiPillar, number> = { year: branches[0], month: branches[1], day: branches[2] };
  return ISOU_KINDS.flatMap((kind): IsouMatch[] => {
    if (kind === "hosani") {
      const set = new Set(branches);
      return HOSANI.some((g) => g.every((x) => set.has(x)) && set.size === 3)
        ? [{ kind, pillars: ["year", "month", "day"] }]
        : [];
    }
    return PAIRS.filter(([p, q]) => PAIR_TESTS[kind](at[p], at[q])).map(([p, q]) => ({ kind, pillars: [p, q] }));
  });
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/sanmei && npx eslint src/lib/fortune/sanmei`
Expected: PASS、lint エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/sanmei
git commit -m "feat: 算命学の計算(二十八元・人体星図・天中殺・宿命中殺・異常干支・位相法)を追加"
```

---

### Task 8: 算命学の読み取り(人物像・人体星図・運勢)

**Files:**
- Create: `src/lib/fortune/sanmei/index.ts`
- Test: `src/lib/fortune/sanmei/__tests__/sanmei.test.ts`

人物像の事実(`natal`)の順と key:

| key | ラベル | 値の例(1990/3/29) | 参照 |
|---|---|---|---|
| `center` | 中心星 | 鳳閣星 | 十大主星 |
| `tenchu` | 天中殺 | 午未天中殺 | 天中殺 |
| `insen` | 陰占 | 庚午・己卯・癸巳 | なし |
| `north` | 頭(北) | 玉堂星 | 十大主星 |
| `east` | 左手(東) | 禄存星 | 十大主星 |
| `west` | 右手(西) | 司禄星 | 十大主星 |
| `south` | 腹(南) | 車騎星 | 十大主星 |
| `early` | 左肩(初年) | 天馳星 | 十二大従星 |
| `middle` | 左足(中年) | 天貴星 | 十二大従星 |
| `late` | 右足(晩年) | 天報星 | 十二大従星 |
| `daiun` | 大運 | 2歳運・順行 | なし(性別がなければ出さない) |
| `shukumei` | 宿命中殺 | 生年中殺 / なし | 該当する宿命中殺 |
| `ijo` | 異常干支 | 癸巳(日柱・暗合) / なし | 該当する異常干支 |
| `isou` | 位相法 | 年支と月支が破 / なし | 該当する位相法 |

人体星図(`chart.kind = "body-stars"`)のマス(左上から行ごと): `null`, north(main), early(sub) / west(main), center(center), east(main) / late(sub), south(main), middle(sub)。`factKeys` は center・north・east・west・south・early・middle・late。

運勢: チップは `ganshi`(日の干支 / 月の干支 / 年の干支。参照なし)、`main`(十大主星。日干×その期間の十干)、`sub`(十二大従星。日干×その期間の十二支)、`tenchu`(天中殺。該当なら「該当(午未)」で参照は天中殺、該当しなければ「該当しない」で参照なし)、今年だけ `daiun`(性別があるとき。「癸未(貫索星・天庫星、32〜41歳)」、参照は十大主星)。見出しは、天中殺に当たる期間なら「{今日|今月|今年}は天中殺の{日|月|年}({干支})」(参照は天中殺)、当たらなければ「{今日|今月|今年}の干支は{干支}。日干{癸}から見て{龍高星}」(参照は十大主星)。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/sanmei/__tests__/sanmei.test.ts
import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";
import { sanmei } from "../index";

const today = { year: 2026, month: 10, day: 14 };
const read = (p: BirthProfile) => sanmei.read(p, toBirthMoment(p), today);
const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
const values = (r: ReturnType<typeof read>) => Object.fromEntries(r.natal.map((f) => [f.key, f.value]));

describe("sanmei.read 人物像", () => {
  it("中心星・天中殺・陰占・人体星図・宿命中殺・異常干支・位相法を返すこと", () => {
    const r = read(p);
    expect(r.id).toBe("sanmei");
    expect(r.natal.map((f) => f.key)).toEqual([
      "center", "tenchu", "insen", "north", "east", "west", "south", "early", "middle", "late", "shukumei", "ijo", "isou",
    ]);
    expect(values(r)).toEqual({
      center: "鳳閣星",
      tenchu: "午未天中殺",
      insen: "庚午・己卯・癸巳",
      north: "玉堂星",
      east: "禄存星",
      west: "司禄星",
      south: "車騎星",
      early: "天馳星",
      middle: "天貴星",
      late: "天報星",
      shukumei: "生年中殺",
      ijo: "癸巳(日柱・暗合)",
      isou: "年支と月支が破",
    });
    expect(r.natal[0].refs).toEqual([{ system: "sanmei", id: "main-3" }]);
    expect(r.natal.find((f) => f.key === "tenchu")?.refs).toEqual([{ system: "sanmei", id: "tenchu-4" }]);
    expect(r.natal.find((f) => f.key === "ijo")?.refs).toEqual([{ system: "sanmei", id: "ijo-30" }]);
    expect(r.natal.find((f) => f.key === "isou")?.refs).toEqual([{ system: "sanmei", id: "isou-ha" }]);
    expect(r.ambiguous).toBe(false);
  });

  it("人体星図を返すこと", () => {
    const r = read(p);
    if (r.chart?.kind !== "body-stars") throw new Error("人体星図がない");
    expect(r.chart.cells.map((c) => (c ? [c.fact.label, c.fact.value, c.tone] : null))).toEqual([
      null,
      ["頭(北)", "玉堂星", "main"],
      ["左肩(初年)", "天馳星", "sub"],
      ["右手(西)", "司禄星", "main"],
      ["中心星", "鳳閣星", "center"],
      ["左手(東)", "禄存星", "main"],
      ["右足(晩年)", "天報星", "sub"],
      ["腹(南)", "車騎星", "main"],
      ["左足(中年)", "天貴星", "sub"],
    ]);
    expect(r.chart.factKeys).toEqual(["center", "north", "east", "west", "south", "early", "middle", "late"]);
  });

  it("該当がなければ「なし」にすること", () => {
    // 「なし」のときは参照が空、該当があるときは参照があることを確かめる
    const r = read({ version: 1, date: { year: 2000, month: 1, day: 1 }, time: { kind: "unknown" } });
    for (const key of ["shukumei", "ijo", "isou"]) {
      const f = r.natal.find((x) => x.key === key)!;
      if (f.value === "なし") expect(f.refs).toEqual([]);
      else expect(f.refs.length).toBeGreaterThan(0);
    }
  });

  it("性別があれば大運を返すこと", () => {
    expect(read({ ...p, gender: "male" }).natal.find((f) => f.key === "daiun")?.value).toBe("2歳運・順行");
    expect(read(p).natal.find((f) => f.key === "daiun")).toBeUndefined();
  });

  it("節入り当日で時刻不明なら月の星を候補にすること", () => {
    // 啓蟄 1990/3/6 5:19
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 6 }, time: { kind: "unknown" } });
    expect(r.natal.find((f) => f.key === "insen")?.value).toMatch(/^庚午・戊寅・\S+\(〜5:19\) \/ 庚午・己卯・\S+\(5:19〜\)$/);
    expect(r.ambiguous).toBe(true);
  });
});

describe("sanmei.read 運勢", () => {
  it("今日は日の干支の星", () => {
    const day = read(p).periods.day;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline).toEqual({ text: "今日の干支は辛酉。日干癸から見て龍高星", ref: { system: "sanmei", id: "main-9" } });
    expect(day.chips.map((c) => [c.key, c.value])).toEqual([
      ["ganshi", "辛酉"],
      ["main", "龍高星"],
      ["sub", "天胡星"],
      ["tenchu", "該当しない"],
    ]);
  });

  it("今月は月の干支の星", () => {
    const month = read(p).periods.month;
    expect(month.chips.map((c) => c.value)).toEqual(["戊戌", "牽牛星", "天堂星", "該当しない"]);
  });

  it("天中殺の年は見出しで知らせること", () => {
    // 2026 丙午年。癸巳の日生まれは午未天中殺
    const year = read({ ...p, gender: "male" }).periods.year;
    expect(year.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(year.headline).toEqual({ text: "今年は天中殺の年(丙午)", ref: { system: "sanmei", id: "tenchu-4" } });
    expect(year.chips.map((c) => [c.key, c.value])).toEqual([
      ["ganshi", "丙午"],
      ["main", "司禄星"],
      ["sub", "天馳星"],
      ["tenchu", "該当(午未)"],
      ["daiun", "癸未(貫索星・天庫星、32〜41歳)"],
    ]);
  });
});
```

期待値の根拠: 大運 癸未 は日干 癸 × 癸 = 貫索星、癸 × 未 = 墓 = 天庫星。2026年 丙 は 癸 × 丙 = 正財 = 司禄星、午 は絶 = 天馳星。2026/10 戊戌: 戊 = 正官 = 牽牛星、戌 = 衰 = 天堂星。2026/10/14 辛酉: 辛 = 偏印 = 龍高星、酉 = 病 = 天胡星。

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/sanmei/__tests__/sanmei.test.ts`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/sanmei/index.ts
import { isAmbiguous, representative, resolveOverRange } from "../ambiguity";
import { calendarPeriod } from "../astro/calendar-period";
import { jieBoundariesWithin } from "../astro/solar-terms";
import { ageOn, daiunAt, daiunPlan, type DaiunPlan } from "../daiun";
import { ijoId, isouId, mainStarId, shukumeiId, subStarId, tenchuId } from "../element-ids";
import { resolvedFact } from "../fact";
import type { LocalDate } from "../local-date";
import { BRANCHES, STEMS, branchOf, cycleName, stemOf, tenGodIndex, twelveStageIndex } from "../sexagenary";
import type { ElementRef, Fact, FortuneSystemModule, NatalChart, Period, PeriodResult, TimeRange } from "../types";
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

/** 図のマスの並び(左上から行ごと。null は空き) */
const LAYOUT: readonly ((typeof BODY)[number]["key"] | null)[] = [
  null, "north", "early",
  "west", "center", "east",
  "late", "south", "middle",
];

const PERIOD_WORD: Record<Period, string> = { day: "今日", month: "今月", year: "今年" };
const PERIOD_UNIT: Record<Period, string> = { day: "日", month: "月", year: "年" };
const GANSHI_LABEL: Record<Period, string> = { day: "日の干支", month: "月の干支", year: "年の干支" };

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
  };
}

const midpoint = (range: TimeRange) => new Date((range.start.getTime() + range.end.getTime()) / 2);

export const sanmei: FortuneSystemModule = {
  id: "sanmei",
  name: "算命学",
  nameEn: "Sanmeigaku",
  read(profile, moment, today) {
    const natal = resolveOverRange(
      moment.range,
      jieBoundariesWithin(moment.range),
      (at) => sanmeiNatalAt(at, moment.localDate),
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
    ) as Record<(typeof BODY)[number]["key"], Fact>;

    const base = representative(natal);
    const repRange = natal.kind === "fixed" ? moment.range : natal.options[0].range;
    const plan = profile.gender ? daiunPlan(midpoint(repRange), base.year, base.month, profile.gender) : null;

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
      ...(plan ? [{ key: "daiun", label: "大運", value: `${plan.startAge}歳運・${plan.forward ? "順行" : "逆行"}`, refs: [] }] : []),
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
        const tone = key === "center" ? "center" : BODY.find((b) => b.key === key)!.kind;
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
        "年・月・日の3柱(時柱は使わない)。年は立春、月は節入りで区切り、日柱は暦日。蔵干は二十八元を節入り日を1日目とする日数で選ぶ(高尾学館式)。人体星図は頭=年干、腹=月干、左手(東)=年支蔵干、胸=月支蔵干、右手(西)=日支蔵干、十二大従星は年支=初年・月支=中年・日支=晩年。天中殺は日干支の旬で決める。宿命中殺は生年・生月・生日・日座・日居、異常干支は通常6種と暗合7種、位相法は支合・半会・方三位・対冲・刑・害・破。大運は節入り日までの日数÷3を四捨五入(1〜10歳)",
      natal: facts,
      ambiguous: isAmbiguous(natal),
      chart,
      periods: {
        day: periodResult("day", base, today, daiun),
        month: periodResult("month", base, today, daiun),
        year: periodResult("year", base, today, daiun),
      },
    };
  },
};
```

注: 「節入り当日で時刻不明」のテストで、日支の蔵干が節入りの前後で変わり右手(西)なども候補になりうる。期待値は陰占の表記だけを確かめている。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/sanmei && npx eslint src/lib/fortune/sanmei`
Expected: PASS、lint エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/sanmei
git commit -m "feat: 算命学の人物像(人体星図・天中殺・宿命中殺・異常干支・位相法・大運)と運勢を追加"
```

---

### Task 9: 早見表の辞書(四柱推命 49項目)

**Files:**
- Create: `src/data/guide/shichu.ts`
- Modify: `src/data/guide/types.ts`(`GuideSystemId` に `"shichu" | "sanmei"` を足す)

辞書の書き方は既存の `src/data/guide/kyusei.ts` に合わせる(`export const shichuEntries: GuideEntry[] = [ … ]`、グループごとにコメント)。**文章はすべてオリジナルで書く**(書籍やサイトの解説文を流用しない)。絵文字・記号の文字は使わない。

決まり(Task 11 のテストで確かめる):
- `keywords` は3〜5語、各8文字以内。
- `summary` は全角換算80〜160字(半角は0.5字)。その項目の人物像・意味を2〜3文で。
- `periodNote` は **通変星のグループだけ** に書く(運勢の見出しで使う)。全角換算30〜80字、「今日・今月・今年・本日・この日・この月・この年」を含めない。ほかのグループには `periodNote` を書かない。
- `reading` はひらがな。
- `image` は `{ kind: "glyph", text, color }`。改行は `\n` で3行まで。
- `related` は同じ占術の実在する id だけ。

五行の色: 木 `#6F9A5A`、火 `#C75B39`、土 `#B89A5A`、金 `#E5B85A`、水 `#8FB8A0`。

| グループ | id | 名前 | 読み | 文字の絵 | 色 | related の例 |
|---|---|---|---|---|---|---|
| 十干 | stem-1〜10 | 甲 乙 丙 丁 戊 己 庚 辛 壬 癸 | きのえ きのと ひのえ ひのと つちのえ つちのと かのえ かのと みずのえ みずのと | 1字(甲 …) | 十干の五行 | 同じ五行の干、その五行(element-*) |
| 十二支 | branch-1〜12 | 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥 | ね うし とら う たつ み うま ひつじ さる とり いぬ い | 1字 | 十二支の五行(子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水) | 対冲の支、その五行 |
| 通変星 | tsuhen-1〜10 | 比肩 劫財 食神 傷官 偏財 正財 偏官 正官 偏印 印綬 | ひけん ごうざい しょくじん しょうかん へんざい せいざい へんかん せいかん へんいん いんじゅ | 2字 | 色なし(既定) | 対になる星(比肩と劫財 など) |
| 十二運 | unsei-1〜12 | 長生 沐浴 冠帯 建禄 帝旺 衰 病 死 墓 絶 胎 養 | ちょうせい もくよく かんたい けんろく ていおう すい びょう し ぼ ぜつ たい よう | 1〜2字 | 色なし | 前後の段階 |
| 五行 | element-wood/fire/earth/metal/water | 木 火 土 金 水 | もく か ど ごん すい | 1字 | 五行の色 | 生む五行・剋す五行 |

`nameEn` は十干(例 "Yang Wood" / "Yin Wood")、十二支(例 "Rat")、五行(例 "Wood")に付ける。通変星・十二運には付けない。

通変星の `summary` は「その星が命式に目立つ人の傾向」、`periodNote` は「その星が巡ってきたときの過ごし方」を書く。十二運の `summary` は「その段階のエネルギーの性質」。

- [ ] **Step 1: `src/data/guide/types.ts` の `GuideSystemId` を更新する**

```ts
/** 早見表の占術(タロットを含む) */
export type GuideSystemId = "tarot" | "numerology" | "kyusei" | "maya" | "shichu" | "sanmei";
```

- [ ] **Step 2: `src/data/guide/shichu.ts` を書く**

1項目の例(この形で49項目すべてを書く):

```ts
import type { GuideEntry } from "./types";

/** 四柱推命の早見表 */
export const shichuEntries: GuideEntry[] = [
  // 十干
  {
    system: "shichu",
    id: "stem-1",
    group: "十干",
    name: "甲",
    reading: "きのえ",
    nameEn: "Yang Wood",
    keywords: ["大樹", "まっすぐ", "向上心", "リーダー"],
    summary:
      "天に向かってまっすぐ伸びる大樹を表す干です。曲がったことを嫌う素直さと、目標に向かって伸び続ける向上心があります。頼られると力を発揮し、自然と人をまとめる立場に立ちやすいでしょう。",
    image: { kind: "glyph", text: "甲", color: "#6F9A5A" },
    related: ["stem-2", "element-wood"],
  },
  // …(残りの十干・十二支・通変星・十二運・五行)
];
```

通変星の例(`periodNote` を持つ):

```ts
  {
    system: "shichu",
    id: "tsuhen-3",
    group: "通変星",
    name: "食神",
    reading: "しょくじん",
    keywords: ["楽しみ", "表現", "おおらか", "衣食住"],
    summary:
      "日干が生み出す、陰陽が同じ星です。好きなことを楽しみながら形にする力があり、おおらかで人を和ませます。衣食住に恵まれやすく、心の余裕がそのまま豊かさにつながるタイプです。",
    periodNote: "楽しむ気持ちが運を呼ぶ巡りです。好きなことに時間を使い、感じたことを素直に表現してみましょう。",
    image: { kind: "glyph", text: "食神" },
    related: ["tsuhen-4", "tsuhen-1"],
  },
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit -p .`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/data/guide/shichu.ts src/data/guide/types.ts
git commit -m "feat: 早見表に四柱推命の辞書(十干・十二支・通変星・十二運・五行)を追加"
```

---

### Task 10: 早見表の辞書(算命学 53項目)

**Files:**
- Create: `src/data/guide/sanmei.ts`

決まりは Task 9 と同じ。`periodNote` は **十大主星と天中殺のグループだけ** に書く。天中殺の `summary` は「その天中殺を持つ人の傾向」、`periodNote` は「天中殺の期間に入ったときの過ごし方」(6種それぞれの特色を出す。新しいことを大きく始めるより整える時期、という共通の考え方は守る)。

| グループ | id | 名前 | 読み | 文字の絵 | 色 |
|---|---|---|---|---|---|
| 十大主星 | main-1〜10 | 貫索星 石門星 鳳閣星 調舒星 禄存星 司禄星 車騎星 牽牛星 龍高星 玉堂星 | かんさくせい せきもんせい ほうかくせい ちょうじょせい ろくぞんせい しろくせい しゃきせい けんぎゅうせい りゅうこうせい ぎょくどうせい | 2字(貫索 …) | 五行の色(貫索・石門=木、鳳閣・調舒=火、禄存・司禄=土、車騎・牽牛=金、龍高・玉堂=水) |
| 十二大従星 | sub-1〜12 | 天貴星 天恍星 天南星 天禄星 天将星 天堂星 天胡星 天極星 天庫星 天馳星 天報星 天印星 | てんきせい てんこうせい てんなんせい てんろくせい てんしょうせい てんどうせい てんこせい てんきょくせい てんこせい てんちせい てんぽうせい てんいんせい | 2字(天貴 …) | 色なし |
| 天中殺 | tenchu-1〜6 | 子丑天中殺 寅卯天中殺 辰巳天中殺 午未天中殺 申酉天中殺 戌亥天中殺 | ねうしてんちゅうさつ とらうてんちゅうさつ たつみてんちゅうさつ うまひつじてんちゅうさつ さるとりてんちゅうさつ いぬいてんちゅうさつ | 2字(子丑 …) | 色なし |
| 宿命中殺 | shukumei-year/month/day/nichiza/nikkyo | 生年中殺 生月中殺 生日中殺 日座中殺 日居中殺 | せいねんちゅうさつ せいげつちゅうさつ せいじつちゅうさつ にちざちゅうさつ にっきょちゅうさつ | 「生年\n中殺」のように2行 | 色なし |
| 異常干支 | ijo-11 12 35 37 48 54(通常)/ ijo-18 19 23 24 25 30 36(暗合) | 甲戌 乙亥 戊戌 庚子 辛亥 丁巳 / 辛巳 壬午 丙戌 丁亥 戊子 癸巳 己亥 | きのえいぬ きのとい つちのえいぬ かのえね かのとい ひのとみ / かのとみ みずのえうま ひのえいぬ ひのとい つちのえね みずのとみ つちのとい | 2字(甲戌 …) | 色なし |
| 位相法 | isou-shigo/hankai/hosani/taichu/kei/gai/ha | 支合 半会 方三位 対冲 刑 害 破 | しごう はんかい ほうさんい たいちゅう けい がい は | 1〜3字 | 色なし |

- 異常干支の `summary` には「通常異常干支」か「暗合異常干支」かを書く。`keywords` の1つに「通常異常干支」または「暗合異常干支」を入れる(8文字以内に収まらない場合は「通常」「暗合」)。
- 位相法の `summary` には、その関係になる十二支の組み合わせを書く(例: 支合は子丑・寅亥・卯戌・辰酉・巳申・午未)。
- 十大主星の `nameEn` は付けない。

- [ ] **Step 1: `src/data/guide/sanmei.ts` を書く**(形は Task 9 の例と同じ。`export const sanmeiEntries: GuideEntry[]`)

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit -p .`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/data/guide/sanmei.ts
git commit -m "feat: 早見表に算命学の辞書(十大主星・十二大従星・天中殺・宿命中殺・異常干支・位相法)を追加"
```

---

### Task 11: 早見表のタブに2占術を追加する

**Files:**
- Modify: `src/data/guide/index.ts`
- Modify: `src/data/guide/__tests__/entries.test.ts`
- Modify: `src/data/guide/__tests__/index.test.ts`
- Modify: `src/components/guide/__tests__/guide-detail.test.tsx`
- Modify: `src/app/guide/[system]/[id]/page.tsx`(先頭コメント)

- [ ] **Step 1: テストを更新する**

`src/data/guide/__tests__/entries.test.ts`:

```ts
import { sanmeiEntries } from "../sanmei";
import { shichuEntries } from "../shichu";

const cases: [keyof typeof ELEMENT_IDS, GuideEntry[]][] = [
  ["numerology", numerologyEntries],
  ["kyusei", kyuseiEntries],
  ["maya", mayaEntries],
  ["shichu", shichuEntries],
  ["sanmei", sanmeiEntries],
];

/** 運勢の見出しに使うグループ(periodNote を持つ)。書かれていない占術は全グループ */
const PERIOD_GROUPS: Partial<Record<keyof typeof ELEMENT_IDS, string[]>> = {
  shichu: ["通変星"],
  sanmei: ["十大主星", "天中殺"],
};
```

文章の決まりの `it.each` の中の `periodNote` の確認を次に置き換える:

```ts
    const needsNote = PERIOD_GROUPS[system]?.includes(e.group) ?? true;
    if (needsNote) {
      expect(e.periodNote).toBeDefined();
      expect(width(e.periodNote ?? "")).toBeGreaterThanOrEqual(30);
      expect(width(e.periodNote ?? "")).toBeLessThanOrEqual(80);
      expect(e.periodNote).not.toMatch(PERIOD_WORDS);
    } else {
      expect(e.periodNote).toBeUndefined();
    }
```

`src/data/guide/__tests__/index.test.ts`:

```ts
  it("タブの順は タロット・数秘術・九星気学・マヤ暦・四柱推命・算命学", () => {
    expect(guideSystems.map((s) => [s.id, s.label])).toEqual([
      ["tarot", "タロット"],
      ["numerology", "数秘術"],
      ["kyusei", "九星気学"],
      ["maya", "マヤ暦"],
      ["shichu", "四柱推命"],
      ["sanmei", "算命学"],
    ]);
  });
```

「グループの順と項目数」に追記:

```ts
    expect(byId.shichu.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["十干", 10],
      ["十二支", 12],
      ["通変星", 10],
      ["十二運", 12],
      ["五行", 5],
    ]);
    expect(byId.sanmei.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["十大主星", 10],
      ["十二大従星", 12],
      ["天中殺", 6],
      ["宿命中殺", 5],
      ["異常干支", 13],
      ["位相法", 7],
    ]);
```

検索のテストに追記(`describe("searchGuide"` の中):

```ts
  it("四柱推命・算命学の項目も読みで検索できること", () => {
    expect(searchGuide("きのえ").map((e) => `${e.system}:${e.id}`)).toContain("shichu:stem-1");
    expect(searchGuide("てんちゅうさつ").filter((e) => e.system === "sanmei")).toHaveLength(6);
  });
```

`src/components/guide/__tests__/guide-detail.test.tsx` の9行目:

```ts
    expect(params).toHaveLength(
      ELEMENT_IDS.numerology.length + ELEMENT_IDS.kyusei.length + ELEMENT_IDS.maya.length + ELEMENT_IDS.shichu.length + ELEMENT_IDS.sanmei.length,
    );
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/data/guide src/components/guide`
Expected: FAIL(タブが4つのまま)

- [ ] **Step 3: 実装する**

`src/data/guide/index.ts`:

```ts
import { sanmeiEntries } from "./sanmei";
import { shichuEntries } from "./shichu";
```

```ts
export const guideSystems: GuideSystem[] = [
  { id: "tarot", label: "タロット", groups: groupEntries(tarotEntries) },
  { id: "numerology", label: "数秘術", groups: groupEntries(numerologyEntries) },
  { id: "kyusei", label: "九星気学", groups: groupEntries(kyuseiEntries) },
  { id: "maya", label: "マヤ暦", groups: groupEntries(mayaEntries) },
  { id: "shichu", label: "四柱推命", groups: groupEntries(shichuEntries) },
  { id: "sanmei", label: "算命学", groups: groupEntries(sanmeiEntries) },
];
```

`src/app/guide/[system]/[id]/page.tsx` の1行目のコメントを `// 早見表の項目の詳細ページ(タロット以外の占術。タロットは /guide/tarot/[id])` にする。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/data/guide src/components/guide`
Expected: PASS。文章の決まりで落ちた項目があれば、その項目の文章を直して再実行する(テストを緩めない)

- [ ] **Step 5: コミット**

```bash
git add src/data/guide src/components/guide/__tests__/guide-detail.test.tsx "src/app/guide/[system]/[id]/page.tsx"
git commit -m "feat: 早見表のタブに四柱推命・算命学を追加"
```

---

### Task 12: 運勢ページに2占術を登録する

**Files:**
- Modify: `src/lib/fortune/registry.ts`
- Modify: `src/lib/fortune/system-names.ts`
- Modify: `src/lib/fortune/__tests__/registry.test.ts`

- [ ] **Step 1: テストを更新する**

```ts
  it("実装済みの占術を設計書の順(数秘術・九星気学・マヤ暦・四柱推命・算命学)で持つこと", () => {
    expect(fortuneSystems.map((s) => s.id)).toEqual(["numerology", "kyusei", "maya", "shichu", "sanmei"]);
  });

  it("readAll で全占術の結果を返すこと", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    expect(readings.map((r) => r.id)).toEqual(["numerology", "kyusei", "maya", "shichu", "sanmei"]);
    // (以下は既存のまま)
```

さらに追記:

```ts
  it("図のセルの key は人物像の中で重ならず、参照 id は早見表にあること", () => {
    for (const gender of [undefined, "male", "female"] as const) {
      const readings = readAll({ ...profile, gender }, { year: 2026, month: 10, day: 14 });
      for (const r of readings) {
        if (!r.chart) continue;
        const cells =
          r.chart.kind === "pillars"
            ? r.chart.rows.flatMap((row) => row.cells)
            : r.chart.cells.map((c) => c?.fact ?? null);
        for (const cell of cells) {
          if (!cell) continue;
          for (const ref of cell.refs) expect(ELEMENT_IDS[r.id as keyof typeof ELEMENT_IDS]).toContain(ref.id);
        }
        for (const key of r.chart.factKeys) expect(r.natal.map((f) => f.key)).toContain(key);
      }
    }
  });
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/__tests__/registry.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

`src/lib/fortune/registry.ts`:

```ts
import { sanmei } from "./sanmei";
import { shichu } from "./shichu";
```

```ts
export const fortuneSystems: readonly FortuneSystemModule[] = [numerology, kyusei, maya, shichu, sanmei];
```

`src/lib/fortune/system-names.ts` の配列の末尾に:

```ts
  { id: "shichu", name: "四柱推命" },
  { id: "sanmei", name: "算命学" },
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune src/components`
Expected: PASS(運勢ページの部品のテストも、占術が増えても通る)。落ちたテストが「占術が3つ」を前提にしていたら、そのテストを5占術に合わせて直す

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/registry.ts src/lib/fortune/system-names.ts src/lib/fortune/__tests__/registry.test.ts
git commit -m "feat: 運勢ページに四柱推命・算命学を登録"
```

---

### Task 13: 人物像の命式表・人体星図の表示

**Files:**
- Create: `src/components/fortune/natal-chart.tsx`
- Modify: `src/components/fortune/natal-section.tsx`
- Test: `src/components/fortune/__tests__/natal-chart.test.tsx`

デザインの規則(設計書 §10.1・§11.2):
- 命式表: 左に44pxの行ラベル列+年柱・月柱・日柱・時柱の4列。セルは popover 地・角丸、値は Kaisei Decol。ラベルは11px gold-dim。
- 人体星図: 3×3、最大幅300px、中央寄せ。中心星は gold の枠と gold/12 地で強調し値は gold-light、十大主星は cream、十二大従星は小さめで gold-dim。空きのマスは何も描かない。
- 候補に分かれたセルは terracotta(タイルと同じ)。
- セルをタップすると、参照している早見表の項目の詳細(`FactDetailSheet`)。

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/fortune/__tests__/natal-chart.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NatalChartView } from "../natal-chart";
import { NatalSection } from "../natal-section";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" };
const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
const shichu = readings.find((r) => r.id === "shichu")!;
const sanmei = readings.find((r) => r.id === "sanmei")!;

describe("NatalChartView", () => {
  it("命式表を行と列の見出しつきの表で表示すること", () => {
    render(<NatalChartView chart={shichu.chart!} label="四柱推命の命式" />);
    const table = screen.getByRole("table", { name: "四柱推命の命式" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["年柱", "月柱", "日柱", "時柱"]);
    expect(within(table).getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["干支", "通変星", "蔵干", "十二運"]);
    expect(within(table).getByText("時刻不明")).toBeInTheDocument();
    expect(within(table).getByText("日主")).toBeInTheDocument();
  });

  it("人体星図を位置のラベルつきで表示し、中心星を強調すること", () => {
    render(<NatalChartView chart={sanmei.chart!} label="算命学の人体星図" />);
    const list = screen.getByRole("list", { name: "算命学の人体星図" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(8);
    const center = within(list).getByRole("button", { name: /中心星\s*鳳閣星/ });
    expect(within(center).getByText("鳳閣星")).toHaveAttribute("data-tone", "center");
  });
});

describe("NatalSection と図", () => {
  it("図のある占術は、図で表した事実を一覧に重ねて出さないこと", async () => {
    const user = userEvent.setup();
    render(<NatalSection readings={[shichu]} />);
    await user.click(screen.getByRole("button", { name: "四柱推命" }));
    const table = await screen.findByRole("table", { name: "四柱推命の命式" });
    expect(table).toBeInTheDocument();
    // 一覧(dl)には日干・五行バランス・大運だけ
    const terms = screen.getAllByRole("term").map((t) => t.textContent);
    expect(terms).toEqual(["日干", "五行バランス", "大運"]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/components/fortune/__tests__/natal-chart.test.tsx`
Expected: FAIL(モジュールがない)

- [ ] **Step 3: 実装する**

```tsx
// src/components/fortune/natal-chart.tsx
"use client";

import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import type { Fact, NatalChart } from "@/lib/fortune/types";

/** 候補に分かれたセルは「A / B」 */
const cellText = (f: Fact) => (f.candidates ? f.candidates.map((c) => c.value).join(" / ") : f.value);

function PillarTable({ chart, label }: { chart: Extract<NatalChart, { kind: "pillars" }>; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <caption className="sr-only">{label}</caption>
        <colgroup>
          <col className="w-11" />
          {chart.columns.map((c) => (
            <col key={c} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td />
            {chart.columns.map((c) => (
              <th key={c} scope="col" className="pb-0.5 text-[11px] font-normal text-gold-dim">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="text-left text-[11px] font-normal leading-tight text-gold-dim">
                {row.label}
              </th>
              {row.cells.map((f, i) => (
                <td key={f?.key ?? `${row.label}-${i}`} className="p-0">
                  {f && (
                    <FactDetailSheet
                      fact={f}
                      className={`flex min-h-10 w-full items-center justify-center rounded-lg bg-popover px-1 py-2 font-heading text-[15px] leading-tight break-keep hover:bg-popover/70 ${
                        f.candidates ? "text-[12px] text-terracotta" : "text-cream"
                      }`}
                    >
                      {cellText(f)}
                    </FactDetailSheet>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TONE_CLASS: Record<"center" | "main" | "sub", { box: string; value: string }> = {
  center: { box: "border border-gold bg-gold/12", value: "font-heading text-lg text-gold-light" },
  main: { box: "border border-gold/20 bg-popover", value: "font-heading text-[15px] text-cream" },
  sub: { box: "border border-gold/10 bg-popover/60", value: "text-[13px] text-gold-dim" },
};

function BodyStarChart({ chart, label }: { chart: Extract<NatalChart, { kind: "body-stars" }>; label: string }) {
  return (
    <ul aria-label={label} className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-1.5">
      {chart.cells.map((cell, i) => {
        if (!cell) return <li key={`empty-${i}`} aria-hidden="true" role="presentation" />;
        const tone = TONE_CLASS[cell.tone];
        return (
          <li key={cell.fact.key}>
            <FactDetailSheet
              fact={cell.fact}
              className={`grid h-full min-h-[72px] w-full content-center justify-items-center gap-1 rounded-xl px-1 py-2 text-center hover:brightness-110 ${tone.box}`}
            >
              <span className="text-[10px] leading-tight text-gold-dim">{cell.fact.label}</span>
              <span data-tone={cell.tone} className={`leading-tight break-keep ${cell.fact.candidates ? "text-[12px] text-terracotta" : tone.value}`}>
                {cellText(cell.fact)}
              </span>
            </FactDetailSheet>
          </li>
        );
      })}
    </ul>
  );
}

/** 人物像の専用の図(四柱推命の命式表・算命学の人体星図) */
export function NatalChartView({ chart, label }: { chart: NatalChart; label: string }) {
  return chart.kind === "pillars" ? <PillarTable chart={chart} label={label} /> : <BodyStarChart chart={chart} label={label} />;
}
```

空きのマスの `<li aria-hidden>` は listitem として数えられないので、テストの `toHaveLength(8)` はそのままでよい(`role="presentation"` を付けておく)。

`src/components/fortune/natal-section.tsx` の `readings.map` の中を次のように変える:

```tsx
        {readings.map((r) => {
          const charted = new Set(r.chart?.factKeys ?? []);
          const tiles = r.chart ? [] : r.natal.slice(0, 3);
          const rows = r.chart ? r.natal.filter((f) => !charted.has(f.key)) : r.natal.slice(3);
          const first = r.natal[0]?.refs[0];
          const summary = first ? getGuideEntry(first.system, first.id)?.summary : undefined;
          const chartLabel = r.chart ? `${r.name}の${r.chart.kind === "pillars" ? "命式" : "人体星図"}` : "";
```

タイルの `<ul>` の部分:

```tsx
                {r.chart ? (
                  <NatalChartView chart={r.chart} label={chartLabel} />
                ) : (
                  <ul className="grid grid-cols-3 gap-2">
                    {tiles.map((f) => (
                      <li key={f.key}>
                        <FactTile fact={f} />
                      </li>
                    ))}
                  </ul>
                )}
```

import に `import { NatalChartView } from "./natal-chart";` を足す。

四柱推命の `summary` は人物像の最初の事実(日干)の参照(十干)の説明、算命学は中心星の説明になる。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/components && npx eslint src/components/fortune`
Expected: PASS、lint エラーなし

- [ ] **Step 5: 画面で確かめる**

`npm run dev`(ポート3200)で `/fortune` を開き、プロフィール(1990/3/29・時刻不明・男性)で「あなたについて」の四柱推命・算命学を開く。スマホ幅(390px)と PC 幅(1280px、詳細パネルを開いた状態も)で、命式表が4列に収まること、人体星図が300px以内で中央に並ぶこと、セルのタップで詳細が開くことを確かめる。確かめたら dev サーバーを止める。

- [ ] **Step 6: コミット**

```bash
git add src/components/fortune/natal-chart.tsx src/components/fortune/natal-section.tsx src/components/fortune/__tests__/natal-chart.test.tsx
git commit -m "feat: 人物像に四柱推命の命式表と算命学の人体星図を表示"
```

---

### Task 14: プロフィールの説明文・E2E・設計書

**Files:**
- Modify: `src/components/profile/profile-form.tsx:234`
- Modify: `e2e/profile-fortune.spec.ts`
- Modify: `e2e/guide.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`

- [ ] **Step 1: プロフィールの説明文**

`profile-form.tsx` の「時刻が不明の場合、出生時刻で結果が変わる項目は「候補」として時刻範囲付きで表示されます。」を次にする:

```tsx
                時刻が不明の場合、出生時刻で結果が変わる項目は「候補」として時刻範囲付きで表示されます。四柱推命の時柱は、時刻を指定したときだけ表示されます。
```

このテキストを確かめているテスト(`grep -rn "時刻範囲付き" src`)があれば合わせて直す。

- [ ] **Step 2: E2E を更新する**

`e2e/profile-fortune.spec.ts` の最初のテスト名を「登録すると運勢ページに5占術の運勢が表示されること」にし、占術名の配列を `["数秘術", "九星気学", "マヤ暦", "四柱推命", "算命学"]` にする。さらにテストを追加する:

```ts
  test("人物像に命式表と人体星図が表示されること", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" }),
      ),
    );
    await page.goto("/fortune");
    await page.getByRole("button", { name: "四柱推命" }).click();
    await expect(page.getByRole("table", { name: "四柱推命の命式" })).toContainText("癸巳");
    await page.getByRole("button", { name: "算命学" }).click();
    await expect(page.getByRole("list", { name: "算命学の人体星図" })).toContainText("鳳閣星");
  });
```

注: 「四柱推命」という名前のボタンが運勢カード側にもある場合は、`page.getByRole("region", { name: "あなたについて" })` などで範囲を絞る(既存の E2E のセレクタの書き方に合わせる)。

`e2e/guide.spec.ts` に追加する:

```ts
  test("四柱推命・算命学のタブがあること", async ({ page }) => {
    await page.goto("/guide?tab=shichu");
    await expect(page.getByRole("tab", { name: "四柱推命" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("十干")).toBeVisible();
    await page.getByRole("tab", { name: "算命学" }).click();
    await expect(page).toHaveURL("/guide?tab=sanmei");
    await expect(page.getByText("十大主星")).toBeVisible();
  });
```

- [ ] **Step 3: 設計書を更新する**

`docs/superpowers/specs/2026-10-14-birth-fortune-design.md`:
- §3 の表の四柱推命: 「日柱は0時切替(23時台は時柱だけ翌日の子の刻)。時刻を指定したときだけ、都道府県の経度で地方平均時に補正して日柱・時柱を出す(未入力は明石基準で補正なし)。時刻が不明・午前午後のときは時柱を出さない。蔵干は月律分野蔵干(申の余気は戊)を、節入り日を1日目とする日数で全柱に当てる。表示: 命式表(干支・通変星・蔵干・十二運)、五行バランス、大運(性別を入力した場合のみ。節入り日までの日数÷3を四捨五入、1〜10歳)。神殺は扱わない」に書き換える。
- §3 の表の算命学: 「蔵干は二十八元(節入り日を1日目とする日数。高尾学館式)」「異常干支(通常6種+暗合7種)」に直し、人体星図の配置(本人と向かい合った向き。左手=東が図の右)を書き足す。
- §5 に「四柱推命の時柱は、時刻を指定したときだけ出す(不明・午前午後で候補を出すと6〜12個になるため)」を足す。
- §6.2 の `SystemReading` に `chart?: NatalChart` と `NatalChart` の型を足す。
- §7 の `GuideSystemId` に `"shichu" | "sanmei"` を足し、§7.1 の四柱推命・算命学のグループを実装に合わせる(四柱推命: 十干・十二支・通変星・十二運・五行、算命学: 十大主星・十二大従星・天中殺・宿命中殺・異常干支・位相法)。periodNote を持つのは四柱推命の通変星、算命学の十大主星・天中殺だけであることを書く。

- [ ] **Step 4: E2E を実行する**

Run: `npx playwright test`
Expected: すべて PASS(モバイルの意図的な skip を除く)

- [ ] **Step 5: コミット**

```bash
git add src/components/profile/profile-form.tsx e2e docs/superpowers/specs/2026-10-14-birth-fortune-design.md
git commit -m "test: 四柱推命・算命学の運勢ページと早見表のE2Eを追加し、設計書を実装に合わせる"
```

---

### Task 15: 最終確認

- [ ] **Step 1: 全体のテスト・lint・ビルド**

```bash
npx vitest run
npx eslint .
npm run build
```

Expected: すべて成功。ビルドの出力に `/guide/shichu/stem-1`・`/guide/sanmei/main-1` などの静的ページが含まれる(`ls out/guide/shichu | head`)。

- [ ] **Step 2: 計算エンジンが遅延読み込みのままか確かめる**

```bash
grep -l "二十八元\|月律分野" out/_next/static/chunks/*.js
```

Expected: ヒットするのは運勢ページが動的に読み込むチャンク(九星気学などと同じチャンク)だけで、ホームや早見表の最初に読むチャンクには含まれない。method の文字列で確かめる。

- [ ] **Step 3: 絵文字・記号の文字を使っていないか確かめる**

```bash
grep -rnP "[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}]" src/lib/fortune/shichu src/lib/fortune/sanmei src/components/fortune/natal-chart.tsx src/data/guide/shichu.ts src/data/guide/sanmei.ts
```

Expected: 出力なし
