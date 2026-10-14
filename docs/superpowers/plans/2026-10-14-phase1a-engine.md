# フェーズ1A: 計算の土台と3占術(数秘術・九星気学・マヤ暦) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生年月日プロフィールから、数秘術・九星気学・マヤ暦の「人物像」と「今日・今月・今年の運勢」を計算する、画面を持たない計算エンジンを作る。

**Architecture:** `src/lib/fortune/` 以下に、日付・タイムゾーン・天文計算(二十四節気)の共通層と、占術ごとのモジュールを置く。各占術は `FortuneSystemModule.read(profile, moment, today)` で `SystemReading`(表示用に整形済みの事実と期間ごとの結果)を返す。出生時刻が曖昧なときは `ambiguity.ts` が境界時刻で範囲を区切り、結果が分かれる場合は候補として返す。画面(1B)と早見表の辞書データ(1C)は、ここで定義する ID と型だけに依存する。

**Tech Stack:** TypeScript、astronomy-engine 2.1.19(MIT)、Intl(Asia/Tokyo のタイムゾーンデータ。1948〜1951年の日本のサマータイムを含む)、Vitest

**設計書:** `docs/superpowers/specs/2026-10-14-birth-fortune-design.md` の §3〜§8

---

## 前提知識(実装者向け)

- テスト: `npx vitest run <パス>`。型: `npx tsc --noEmit`。lint: `npx eslint <パス>`。
- この計画のコードはすべて純粋な計算で、React を使うのは Task 3 のフックだけ。新しいコードで `useEffect` 内の `setState` は禁止(lint の `react-hooks/set-state-in-effect`)。
- コメントは日本語。
- 「今日」は日本時間の日付(`LocalDate`)で扱う。瞬間は `Date`(UTC)で扱い、日本時間への変換は必ず `tokyoParts` / `tokyoToUtc` を通す(端末のタイムゾーンに依存させない)。
- 計算方式(設計書 §3 で決定済み):
  - 数秘術: 生年月日の全桁を一度に足し、11・22・33 は還元しない。パーソナルイヤー/マンス/デーは 1〜9 に還元する(マスターナンバーを残さない)。年の区切りは1月1日。
  - 九星気学: 年は立春、月は節入りで区切る。月命星は本命星のグループ(一白・四緑・七赤 / 二黒・五黄・八白 / 三碧・六白・九紫)で決まる。傾斜宮は月命星を中宮に置いた盤で本命星が入る宮。本命星=月命星のときは中宮傾斜の表(八雲院の表。五黄同士は男性=兌宮、女性=乾宮。性別未入力なら両方を候補)。日盤は冬至・夏至に最も近い甲子日で陽遁(一白から)・陰遁(九紫から)を切り替える。吉方位は五黄殺・暗剣殺・本命殺・本命的殺・破(歳破/月破/日破)を除いた方位のうち、本命星と相性のよい星が入る方位。
  - マヤ暦: 13の月の暦(ドリームスペル)。基準日 1987-07-26 = KIN 34。2月29日は数えない(2月28日と同じKIN)。年は7月26日始まりで28日×13の月+「時間をはずした日」(7月25日)。年回りKINは直近の誕生日のKIN。

## ファイル構成

| パス | 責務 |
|---|---|
| `src/lib/fortune/local-date.ts` | 日付(LocalDate)の計算: ユリウス日、加算、比較、表記 |
| `src/lib/fortune/tokyo-time.ts` | 日本時間と UTC の相互変換(サマータイム対応) |
| `src/lib/fortune/prefectures.ts` | 47都道府県の県庁所在地の緯度経度と明石 |
| `src/lib/fortune/types.ts` | 全占術に共通の型 |
| `src/lib/fortune/birth-moment.ts` | プロフィール → 生まれた瞬間の範囲 |
| `src/lib/fortune/profile-storage.ts` | プロフィールの検証・保存・購読フック |
| `src/lib/fortune/astro/solar-terms.ts` | 二十四節気の時刻、節月 |
| `src/lib/fortune/sexagenary.ts` | 干支(日・年・月の十二支) |
| `src/lib/fortune/ambiguity.ts` | 時刻の範囲を境界で区切って候補にまとめる |
| `src/lib/fortune/numerology/calc.ts`、`index.ts` | 数秘術の計算と SystemReading |
| `src/lib/fortune/kyusei/calc.ts`、`index.ts` | 九星気学の計算と SystemReading |
| `src/lib/fortune/maya/calc.ts`、`index.ts` | マヤ暦の計算と SystemReading |
| `src/lib/fortune/registry.ts` | 実装済みの占術の一覧と一括計算 |

テストは各ファイルと同じ階層の `__tests__/` に置く。

---

### Task 1: ブランチ確認・依存追加・日付とタイムゾーンの基礎

**Files:**
- Modify: `package.json`(astronomy-engine を追加)
- Create: `src/lib/fortune/local-date.ts`、`src/lib/fortune/tokyo-time.ts`
- Test: `src/lib/fortune/__tests__/local-date.test.ts`、`src/lib/fortune/__tests__/tokyo-time.test.ts`

- [ ] **Step 1: ブランチと依存を準備する**

Run: `git branch --show-current`
Expected: `feature/phase1a-engine`

Run: `npm install astronomy-engine@2.1.19`
Expected: `package.json` の dependencies に `"astronomy-engine": "^2.1.19"` が追加される

- [ ] **Step 2: 失敗するテストを書く**

```ts
// src/lib/fortune/__tests__/local-date.test.ts
import { describe, it, expect } from "vitest";
import {
  addDays,
  compareLocalDate,
  daysInMonth,
  formatSlash,
  fromJdn,
  isLeapYear,
  isValidLocalDate,
  toJdn,
} from "../local-date";

describe("local-date", () => {
  it("ユリウス日に変換できること", () => {
    expect(toJdn({ year: 2000, month: 1, day: 1 })).toBe(2451545);
    expect(toJdn({ year: 2025, month: 1, day: 1 })).toBe(2460677);
  });

  it("ユリウス日から戻せること", () => {
    expect(fromJdn(2451545)).toEqual({ year: 2000, month: 1, day: 1 });
    expect(fromJdn(toJdn({ year: 1948, month: 5, day: 2 }))).toEqual({ year: 1948, month: 5, day: 2 });
  });

  it("日数を加算できること(月・年をまたぐ)", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(addDays({ year: 2025, month: 12, day: 31 }, 1)).toEqual({ year: 2026, month: 1, day: 1 });
    expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it("比較できること", () => {
    expect(compareLocalDate({ year: 2026, month: 1, day: 1 }, { year: 2025, month: 12, day: 31 })).toBeGreaterThan(0);
    expect(compareLocalDate({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 1 })).toBe(0);
  });

  it("うるう年と月の日数", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("存在しない日付を判定できること", () => {
    expect(isValidLocalDate({ year: 2025, month: 2, day: 29 })).toBe(false);
    expect(isValidLocalDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isValidLocalDate({ year: 2024, month: 13, day: 1 })).toBe(false);
    expect(isValidLocalDate({ year: 2024, month: 1, day: 0 })).toBe(false);
    expect(isValidLocalDate({ year: 2024.5, month: 1, day: 1 })).toBe(false);
  });

  it("スラッシュ区切りで表記すること", () => {
    expect(formatSlash({ year: 2026, month: 2, day: 4 })).toBe("2026/2/4");
  });
});
```

```ts
// src/lib/fortune/__tests__/tokyo-time.test.ts
import { describe, it, expect } from "vitest";
import { tokyoParts, tokyoToUtc, jstLocalDate, formatTokyoHm } from "../tokyo-time";

describe("tokyo-time", () => {
  it("通常期間は UTC+9 で変換すること", () => {
    expect(tokyoToUtc(2026, 10, 14, 12, 0).toISOString()).toBe("2026-10-14T03:00:00.000Z");
  });

  it("1949年夏のサマータイム期間は UTC+10 で変換すること", () => {
    expect(tokyoToUtc(1949, 7, 1, 12, 0).toISOString()).toBe("1949-07-01T02:00:00.000Z");
    expect(tokyoToUtc(1949, 12, 1, 12, 0).toISOString()).toBe("1949-12-01T03:00:00.000Z");
  });

  it("24時は翌日0時として扱うこと", () => {
    expect(tokyoToUtc(2026, 10, 14, 24, 0).toISOString()).toBe("2026-10-14T15:00:00.000Z");
  });

  it("瞬間を日本時間の年月日時分とオフセットに分解すること", () => {
    expect(tokyoParts(new Date("1948-05-01T15:00:00Z"))).toEqual({
      year: 1948, month: 5, day: 2, hour: 1, minute: 0, offsetMinutes: 600,
    });
    expect(tokyoParts(new Date("2026-02-03T20:01:00Z"))).toEqual({
      year: 2026, month: 2, day: 4, hour: 5, minute: 1, offsetMinutes: 540,
    });
  });

  it("日本時間の日付と時刻の表記", () => {
    const at = new Date("2026-02-03T20:01:00Z");
    expect(jstLocalDate(at)).toEqual({ year: 2026, month: 2, day: 4 });
    expect(formatTokyoHm(at)).toBe("5:01");
  });
});
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/local-date.test.ts src/lib/fortune/__tests__/tokyo-time.test.ts`
Expected: FAIL(import 解決エラー)

- [ ] **Step 4: 実装する**

```ts
// src/lib/fortune/local-date.ts
/** タイムゾーンを持たない年月日(日本時間の暦日として扱う) */
export interface LocalDate {
  year: number;
  month: number;
  day: number;
}

/** 負の数でも 0〜n-1 を返す剰余 */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidLocalDate(d: LocalDate): boolean {
  if (![d.year, d.month, d.day].every(Number.isInteger)) return false;
  if (d.month < 1 || d.month > 12) return false;
  return d.day >= 1 && d.day <= daysInMonth(d.year, d.month);
}

/** グレゴリオ暦の年月日 → ユリウス日(正午基準の通日) */
export function toJdn({ year, month, day }: LocalDate): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

const JDN_1970_01_01 = 2440588;

export function fromJdn(jdn: number): LocalDate {
  const d = new Date((jdn - JDN_1970_01_01) * 86_400_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function addDays(d: LocalDate, days: number): LocalDate {
  return fromJdn(toJdn(d) + days);
}

/** a が後なら正、同じなら0、前なら負 */
export function compareLocalDate(a: LocalDate, b: LocalDate): number {
  return toJdn(a) - toJdn(b);
}

/** 例: 2026/2/4 */
export function formatSlash(d: LocalDate): string {
  return `${d.year}/${d.month}/${d.day}`;
}
```

```ts
// src/lib/fortune/tokyo-time.ts
import type { LocalDate } from "./local-date";

/**
 * 日本時間(Asia/Tokyo)と UTC の変換。
 * Intl のタイムゾーンデータを使うので、1948〜1951年のサマータイム(UTC+10)も正しく扱える。
 */
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
  timeZoneName: "shortOffset",
});

export interface TokyoParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** UTC からのずれ(分)。通常 540、サマータイム中は 600 */
  offsetMinutes: number;
}

export function tokyoParts(at: Date): TokyoParts {
  const parts = Object.fromEntries(formatter.formatToParts(at).map((p) => [p.type, p.value]));
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(parts.timeZoneName ?? "");
  const hours = match ? Number(match[1]) : 9;
  const minutes = match?.[2] ? Number(match[2]) : 0;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    offsetMinutes: hours * 60 + Math.sign(hours) * minutes,
  };
}

/** 日本時間の壁時計の時刻 → UTC の瞬間。hour は 24(翌日0時)まで受け付ける */
export function tokyoToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const guess = naive - 9 * 3_600_000;
  const offset = tokyoParts(new Date(guess)).offsetMinutes;
  return new Date(naive - offset * 60_000);
}

export function jstLocalDate(at: Date): LocalDate {
  const p = tokyoParts(at);
  return { year: p.year, month: p.month, day: p.day };
}

/** 例: 5:01 */
export function formatTokyoHm(at: Date): string {
  const p = tokyoParts(at);
  return `${p.hour}:${String(p.minute).padStart(2, "0")}`;
}

/** 日本時間の「今日」 */
export function todayInTokyo(now: Date = new Date()): LocalDate {
  return jstLocalDate(now);
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/local-date.test.ts src/lib/fortune/__tests__/tokyo-time.test.ts`
Expected: PASS

- [ ] **Step 6: コミットする**

```bash
git add package.json package-lock.json src/lib/fortune
git commit -m "feat: 占術エンジン用の日付・日本時間の変換を追加し、astronomy-engine を導入"
```

---

### Task 2: 都道府県・共通の型・生まれた瞬間の範囲

**Files:**
- Create: `src/lib/fortune/prefectures.ts`、`src/lib/fortune/types.ts`、`src/lib/fortune/birth-moment.ts`
- Test: `src/lib/fortune/__tests__/birth-moment.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/__tests__/birth-moment.test.ts
import { describe, it, expect } from "vitest";
import { hourRange, toBirthMoment } from "../birth-moment";
import { AKASHI, prefectures, findPrefecture } from "../prefectures";
import type { BirthProfile } from "../types";

const base: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };

describe("prefectures", () => {
  it("47都道府県を持ち、コードが一意であること", () => {
    expect(prefectures).toHaveLength(47);
    expect(new Set(prefectures.map((p) => p.code)).size).toBe(47);
  });

  it("コードから引けること", () => {
    expect(findPrefecture("13")?.name).toBe("東京都");
    expect(findPrefecture("99")).toBeUndefined();
  });
});

describe("hourRange", () => {
  it("時刻の入力方式ごとに時間の範囲を返すこと", () => {
    expect(hourRange({ kind: "unknown" })).toEqual([0, 24]);
    expect(hourRange({ kind: "half", half: "am" })).toEqual([0, 12]);
    expect(hourRange({ kind: "half", half: "pm" })).toEqual([12, 24]);
    expect(hourRange({ kind: "hour", hour: 14 })).toEqual([14, 15]);
  });
});

describe("toBirthMoment", () => {
  it("時刻不明なら日本時間の0時〜24時を範囲にすること", () => {
    const m = toBirthMoment(base);
    expect(m.range.start.toISOString()).toBe("1990-03-28T15:00:00.000Z");
    expect(m.range.end.toISOString()).toBe("1990-03-29T15:00:00.000Z");
    expect(m.localDate).toEqual({ year: 1990, month: 3, day: 29 });
  });

  it("時刻指定なら1時間の範囲にすること", () => {
    const m = toBirthMoment({ ...base, time: { kind: "hour", hour: 14 } });
    expect(m.range.start.toISOString()).toBe("1990-03-29T05:00:00.000Z");
    expect(m.range.end.toISOString()).toBe("1990-03-29T06:00:00.000Z");
  });

  it("サマータイム期間はその時差で変換すること", () => {
    const m = toBirthMoment({ ...base, date: { year: 1949, month: 7, day: 1 }, time: { kind: "hour", hour: 12 } });
    expect(m.range.start.toISOString()).toBe("1949-07-01T02:00:00.000Z");
  });

  it("出生地未入力なら明石を使い、その旨を持つこと", () => {
    const m = toBirthMoment(base);
    expect(m.location).toEqual({ ...AKASHI, isDefault: true });
  });

  it("出生地があれば県庁所在地の緯度経度を使うこと", () => {
    const m = toBirthMoment({ ...base, prefecture: "13" });
    expect(m.location.label).toBe("東京都");
    expect(m.location.isDefault).toBe(false);
    expect(m.location.lon).toBeCloseTo(139.69, 2);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/birth-moment.test.ts`
Expected: FAIL

- [ ] **Step 3: 都道府県データを実装する**

```ts
// src/lib/fortune/prefectures.ts
/** 都道府県(緯度経度は県庁所在地。小数第2位まで) */
export interface Prefecture {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export const prefectures = [
  { code: "01", name: "北海道", lat: 43.06, lon: 141.35 },
  { code: "02", name: "青森県", lat: 40.82, lon: 140.74 },
  { code: "03", name: "岩手県", lat: 39.7, lon: 141.15 },
  { code: "04", name: "宮城県", lat: 38.27, lon: 140.87 },
  { code: "05", name: "秋田県", lat: 39.72, lon: 140.1 },
  { code: "06", name: "山形県", lat: 38.24, lon: 140.36 },
  { code: "07", name: "福島県", lat: 37.75, lon: 140.47 },
  { code: "08", name: "茨城県", lat: 36.34, lon: 140.45 },
  { code: "09", name: "栃木県", lat: 36.57, lon: 139.88 },
  { code: "10", name: "群馬県", lat: 36.39, lon: 139.06 },
  { code: "11", name: "埼玉県", lat: 35.86, lon: 139.65 },
  { code: "12", name: "千葉県", lat: 35.61, lon: 140.12 },
  { code: "13", name: "東京都", lat: 35.69, lon: 139.69 },
  { code: "14", name: "神奈川県", lat: 35.45, lon: 139.64 },
  { code: "15", name: "新潟県", lat: 37.9, lon: 139.02 },
  { code: "16", name: "富山県", lat: 36.7, lon: 137.21 },
  { code: "17", name: "石川県", lat: 36.59, lon: 136.63 },
  { code: "18", name: "福井県", lat: 36.07, lon: 136.22 },
  { code: "19", name: "山梨県", lat: 35.66, lon: 138.57 },
  { code: "20", name: "長野県", lat: 36.65, lon: 138.18 },
  { code: "21", name: "岐阜県", lat: 35.39, lon: 136.72 },
  { code: "22", name: "静岡県", lat: 34.98, lon: 138.38 },
  { code: "23", name: "愛知県", lat: 35.18, lon: 136.91 },
  { code: "24", name: "三重県", lat: 34.73, lon: 136.51 },
  { code: "25", name: "滋賀県", lat: 35.0, lon: 135.87 },
  { code: "26", name: "京都府", lat: 35.02, lon: 135.76 },
  { code: "27", name: "大阪府", lat: 34.69, lon: 135.52 },
  { code: "28", name: "兵庫県", lat: 34.69, lon: 135.18 },
  { code: "29", name: "奈良県", lat: 34.69, lon: 135.83 },
  { code: "30", name: "和歌山県", lat: 34.23, lon: 135.17 },
  { code: "31", name: "鳥取県", lat: 35.5, lon: 134.24 },
  { code: "32", name: "島根県", lat: 35.47, lon: 133.05 },
  { code: "33", name: "岡山県", lat: 34.66, lon: 133.93 },
  { code: "34", name: "広島県", lat: 34.4, lon: 132.46 },
  { code: "35", name: "山口県", lat: 34.19, lon: 131.47 },
  { code: "36", name: "徳島県", lat: 34.07, lon: 134.56 },
  { code: "37", name: "香川県", lat: 34.34, lon: 134.04 },
  { code: "38", name: "愛媛県", lat: 33.84, lon: 132.77 },
  { code: "39", name: "高知県", lat: 33.56, lon: 133.53 },
  { code: "40", name: "福岡県", lat: 33.61, lon: 130.42 },
  { code: "41", name: "佐賀県", lat: 33.25, lon: 130.3 },
  { code: "42", name: "長崎県", lat: 32.74, lon: 129.87 },
  { code: "43", name: "熊本県", lat: 32.79, lon: 130.74 },
  { code: "44", name: "大分県", lat: 33.24, lon: 131.61 },
  { code: "45", name: "宮崎県", lat: 31.91, lon: 131.42 },
  { code: "46", name: "鹿児島県", lat: 31.56, lon: 130.56 },
  { code: "47", name: "沖縄県", lat: 26.21, lon: 127.68 },
] as const satisfies readonly Prefecture[];

export type PrefectureCode = (typeof prefectures)[number]["code"];

/** 出生地未入力のときの基準(日本標準時子午線の明石) */
export const AKASHI = { lat: 34.65, lon: 135.0, label: "明石(出生地未入力)" } as const;

export function findPrefecture(code: string): Prefecture | undefined {
  return prefectures.find((p) => p.code === code);
}

export function isPrefectureCode(code: unknown): code is PrefectureCode {
  return typeof code === "string" && prefectures.some((p) => p.code === code);
}
```

- [ ] **Step 4: 共通の型を実装する**

```ts
// src/lib/fortune/types.ts
import type { LocalDate } from "./local-date";
import type { PrefectureCode } from "./prefectures";

export type SystemId = "numerology" | "kyusei" | "maya" | "shichu" | "sanmei" | "sukuyo" | "horoscope";
export type Period = "day" | "month" | "year";

export type BirthTime =
  | { kind: "unknown" }
  | { kind: "half"; half: "am" | "pm" }
  | { kind: "hour"; hour: number };

/** 端末に保存する入力(設計書 §4) */
export interface BirthProfile {
  version: 1;
  date: LocalDate;
  time: BirthTime;
  prefecture?: PrefectureCode;
  /** 大運の向きと五黄同士の中宮傾斜の判定にだけ使う */
  gender?: "male" | "female";
}

/** 瞬間の範囲。end は含まない */
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  label: string;
  /** 出生地未入力で明石を使っているとき true */
  isDefault: boolean;
}

export interface BirthMoment {
  range: TimeRange;
  location: GeoLocation;
  localDate: LocalDate;
}

export type Resolved<T> =
  | { kind: "fixed"; value: T }
  | { kind: "ambiguous"; options: { value: T; range: TimeRange }[] };

/** 早見表の項目への参照(1C の辞書データの id と一致させる) */
export interface ElementRef {
  system: SystemId | "tarot";
  id: string;
}

/** 表示用の事実。value は候補があれば「A(〜5:01) / B(5:01〜)」のように整形済み */
export interface Fact {
  label: string;
  value: string;
  refs: ElementRef[];
}

export interface PeriodResult {
  period: Period;
  /** その占術での期間。例: 2026/2/4〜2027/2/3 */
  rangeLabel: string;
  /** 一文のまとめの材料。画面側で `${text}。${ref の項目の periodNote}` の形に組み立てる */
  headline: { text: string; ref: ElementRef };
  chips: Fact[];
}

export interface SystemReading {
  id: SystemId;
  name: string;
  nameEn: string;
  /** 総合鑑定プロンプトに書く採用方式 */
  method: string;
  natal: Fact[];
  periods: Record<Period, PeriodResult>;
  /** 出生時刻の曖昧さで人物像の結果が分かれたか */
  ambiguous: boolean;
}

export interface FortuneSystemModule {
  id: SystemId;
  name: string;
  nameEn: string;
  read(profile: BirthProfile, moment: BirthMoment, today: LocalDate): SystemReading;
}
```

- [ ] **Step 5: 生まれた瞬間の範囲を実装する**

```ts
// src/lib/fortune/birth-moment.ts
import { AKASHI, findPrefecture } from "./prefectures";
import { tokyoToUtc } from "./tokyo-time";
import type { BirthMoment, BirthProfile, BirthTime } from "./types";

/** 入力方式ごとの時の範囲 [開始, 終了)。終了の 24 は翌日0時 */
export function hourRange(time: BirthTime): [number, number] {
  switch (time.kind) {
    case "unknown":
      return [0, 24];
    case "half":
      return time.half === "am" ? [0, 12] : [12, 24];
    case "hour":
      return [time.hour, time.hour + 1];
  }
}

export function toBirthMoment(profile: BirthProfile): BirthMoment {
  const { year, month, day } = profile.date;
  const [h0, h1] = hourRange(profile.time);
  const pref = profile.prefecture ? findPrefecture(profile.prefecture) : undefined;
  return {
    range: { start: tokyoToUtc(year, month, day, h0, 0), end: tokyoToUtc(year, month, day, h1, 0) },
    location: pref
      ? { lat: pref.lat, lon: pref.lon, label: pref.name, isDefault: false }
      : { ...AKASHI, isDefault: true },
    localDate: { year, month, day },
  };
}
```

- [ ] **Step 6: テストと型チェック**

Run: `npx vitest run src/lib/fortune/__tests__/birth-moment.test.ts && npx tsc --noEmit`
Expected: PASS、型エラーなし

- [ ] **Step 7: コミットする**

```bash
git add src/lib/fortune
git commit -m "feat: 占術の共通型・都道府県データ・生まれた瞬間の範囲を追加"
```

---

### Task 3: プロフィールの検証・保存・購読フック

**Files:**
- Create: `src/lib/fortune/profile-storage.ts`
- Test: `src/lib/fortune/__tests__/profile-storage.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/lib/fortune/__tests__/profile-storage.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  BIRTH_PROFILE_STORAGE_KEY,
  clearBirthProfile,
  parseBirthProfile,
  saveBirthProfile,
  useBirthProfile,
} from "../profile-storage";
import type { BirthProfile } from "../types";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((k: string) => store[k] ?? null),
  setItem: vi.fn((k: string, v: string) => {
    store[k] = v;
  }),
  removeItem: vi.fn((k: string) => {
    delete store[k];
  }),
};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  localStorageMock.getItem.mockImplementation((k: string) => store[k] ?? null);
  localStorageMock.setItem.mockImplementation((k: string, v: string) => {
    store[k] = v;
  });
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

const valid: BirthProfile = {
  version: 1,
  date: { year: 1990, month: 3, day: 29 },
  time: { kind: "hour", hour: 14 },
  prefecture: "13",
  gender: "female",
};

describe("parseBirthProfile", () => {
  it("正しいデータを読み込めること", () => {
    expect(parseBirthProfile(JSON.stringify(valid))).toEqual(valid);
    expect(parseBirthProfile(JSON.stringify({ ...valid, prefecture: undefined, gender: undefined }))).toEqual({
      version: 1,
      date: valid.date,
      time: valid.time,
    });
  });

  it("不正なデータは null にすること", () => {
    expect(parseBirthProfile(null)).toBeNull();
    expect(parseBirthProfile("not json")).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, version: 2 }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, date: { year: 2025, month: 2, day: 29 } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, date: { year: 1899, month: 1, day: 1 } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, time: { kind: "hour", hour: 24 } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, time: { kind: "half", half: "noon" } }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, prefecture: "48" }))).toBeNull();
    expect(parseBirthProfile(JSON.stringify({ ...valid, gender: "other" }))).toBeNull();
  });

  it("未来の日付は null にすること", () => {
    const y = new Date().getFullYear() + 1;
    expect(parseBirthProfile(JSON.stringify({ ...valid, date: { year: y, month: 1, day: 1 } }))).toBeNull();
  });
});

function Probe() {
  const { ready, profile } = useBirthProfile();
  return <p>{ready ? (profile ? `${profile.date.year}` : "none") : "loading"}</p>;
}

describe("useBirthProfile", () => {
  it("保存・削除に追従すること", () => {
    render(<Probe />);
    expect(screen.getByText("none")).toBeInTheDocument();
    act(() => {
      expect(saveBirthProfile(valid)).toBe(true);
    });
    expect(screen.getByText("1990")).toBeInTheDocument();
    expect(store[BIRTH_PROFILE_STORAGE_KEY]).toBeDefined();
    act(() => clearBirthProfile());
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("localStorage が使えなくても落ちないこと", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    render(<Probe />);
    expect(screen.getByText("none")).toBeInTheDocument();
    act(() => {
      expect(saveBirthProfile(valid)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/profile-storage.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/profile-storage.ts
"use client";

import { useSyncExternalStore } from "react";
import { isValidLocalDate, type LocalDate } from "./local-date";
import { isPrefectureCode } from "./prefectures";
import { todayInTokyo } from "./tokyo-time";
import type { BirthProfile, BirthTime } from "./types";

export const BIRTH_PROFILE_STORAGE_KEY = "tarot-birth-profile";
const MIN_YEAR = 1900;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseDate(v: unknown): LocalDate | null {
  if (!isRecord(v)) return null;
  const d = { year: v.year, month: v.month, day: v.day } as LocalDate;
  if (!isValidLocalDate(d) || d.year < MIN_YEAR) return null;
  const today = todayInTokyo();
  const isFuture =
    d.year > today.year ||
    (d.year === today.year && (d.month > today.month || (d.month === today.month && d.day > today.day)));
  return isFuture ? null : d;
}

function parseTime(v: unknown): BirthTime | null {
  if (!isRecord(v)) return null;
  if (v.kind === "unknown") return { kind: "unknown" };
  if (v.kind === "half" && (v.half === "am" || v.half === "pm")) return { kind: "half", half: v.half };
  if (v.kind === "hour" && Number.isInteger(v.hour) && (v.hour as number) >= 0 && (v.hour as number) <= 23) {
    return { kind: "hour", hour: v.hour as number };
  }
  return null;
}

/** 保存された文字列を検証してプロフィールにする。不正なら null */
export function parseBirthProfile(raw: string | null): BirthProfile | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1) return null;
  const date = parseDate(data.date);
  const time = parseTime(data.time);
  if (!date || !time) return null;
  if (data.prefecture !== undefined && !isPrefectureCode(data.prefecture)) return null;
  if (data.gender !== undefined && data.gender !== "male" && data.gender !== "female") return null;

  const profile: BirthProfile = { version: 1, date, time };
  if (data.prefecture !== undefined) profile.prefecture = data.prefecture as BirthProfile["prefecture"];
  if (data.gender !== undefined) profile.gender = data.gender;
  return profile;
}

const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheValue: BirthProfile | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(BIRTH_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 文字列が変わらない限り同じ参照を返す(useSyncExternalStore の要件) */
function getSnapshot(): BirthProfile | null {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheValue = parseBirthProfile(raw);
  }
  return cacheValue;
}

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 保存できたら true。localStorage が使えない環境では false */
export function saveBirthProfile(profile: BirthProfile): boolean {
  try {
    localStorage.setItem(BIRTH_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    notify();
    return true;
  } catch {
    return false;
  }
}

export function clearBirthProfile(): void {
  try {
    localStorage.removeItem(BIRTH_PROFILE_STORAGE_KEY);
  } catch {
    // 保存できない環境では何もしない
  }
  notify();
}

const subscribeNoop = () => () => {};

/** 登録済みプロフィール。ready はクライアントで読み込み終えたか */
export function useBirthProfile(): { ready: boolean; profile: BirthProfile | null } {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const profile = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return { ready, profile };
}
```

- [ ] **Step 4: テスト・lint**

Run: `npx vitest run src/lib/fortune/__tests__/profile-storage.test.tsx && npx eslint src/lib/fortune/profile-storage.ts`
Expected: PASS、lint エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune
git commit -m "feat: 生年月日プロフィールの検証・保存・購読フックを追加"
```

---

### Task 4: 二十四節気と節月

**Files:**
- Create: `src/lib/fortune/astro/solar-terms.ts`
- Test: `src/lib/fortune/astro/__tests__/solar-terms.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

参照値は国立天文台の暦要項(分単位)。astronomy-engine との差は1分以内であることを事前に確認済み。

```ts
// src/lib/fortune/astro/__tests__/solar-terms.test.ts
import { describe, it, expect } from "vitest";
import { solarLongitudeTime, solarMonthAt, jieBoundariesWithin, SOLAR_MONTH_BRANCH_NAMES } from "../solar-terms";
import { tokyoToUtc } from "../../tokyo-time";

const minutesBetween = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000;

describe("solarLongitudeTime", () => {
  it("立春・冬至の時刻が国立天文台の値と1分以内で一致すること", () => {
    expect(minutesBetween(solarLongitudeTime(2025, 315), tokyoToUtc(2025, 2, 3, 23, 10))).toBeLessThanOrEqual(1);
    expect(minutesBetween(solarLongitudeTime(2021, 315), tokyoToUtc(2021, 2, 3, 23, 59))).toBeLessThanOrEqual(1);
    expect(minutesBetween(solarLongitudeTime(2026, 315), tokyoToUtc(2026, 2, 4, 5, 2))).toBeLessThanOrEqual(1);
    expect(minutesBetween(solarLongitudeTime(2026, 270), tokyoToUtc(2026, 12, 22, 5, 50))).toBeLessThanOrEqual(1);
  });
});

describe("solarMonthAt", () => {
  it("1990年3月29日は1990年の卯月(index 1)", () => {
    const m = solarMonthAt(tokyoToUtc(1990, 3, 29, 12, 0));
    expect(m.kyuseiYear).toBe(1990);
    expect(m.index).toBe(1);
    expect(SOLAR_MONTH_BRANCH_NAMES[m.index]).toBe("卯月");
  });

  it("立春前の1月は前年の子月・丑月", () => {
    const beforeShokan = solarMonthAt(tokyoToUtc(2026, 1, 3, 12, 0));
    expect(beforeShokan.kyuseiYear).toBe(2025);
    expect(beforeShokan.index).toBe(10);
    const afterShokan = solarMonthAt(tokyoToUtc(2026, 1, 20, 12, 0));
    expect(afterShokan.kyuseiYear).toBe(2025);
    expect(afterShokan.index).toBe(11);
  });

  it("立春の時刻の前後で年が切り替わること", () => {
    const risshun = solarLongitudeTime(1990, 315);
    expect(solarMonthAt(new Date(risshun.getTime() - 60_000)).kyuseiYear).toBe(1989);
    expect(solarMonthAt(new Date(risshun.getTime() + 60_000)).kyuseiYear).toBe(1990);
  });

  it("start と end が節入りの時刻であること", () => {
    const m = solarMonthAt(tokyoToUtc(2026, 10, 14, 12, 0));
    expect(m.index).toBe(8); // 戌月(寒露〜立冬)
    expect(m.start.getTime()).toBe(solarLongitudeTime(2026, 195).getTime());
    expect(m.end.getTime()).toBe(solarLongitudeTime(2026, 225).getTime());
  });
});

describe("jieBoundariesWithin", () => {
  it("範囲内の節入り時刻だけを返すこと", () => {
    const day = { start: tokyoToUtc(1990, 2, 4, 0, 0), end: tokyoToUtc(1990, 2, 4, 24, 0) };
    const result = jieBoundariesWithin(day);
    expect(result).toHaveLength(1);
    expect(result[0].getTime()).toBe(solarLongitudeTime(1990, 315).getTime());
    expect(jieBoundariesWithin({ start: tokyoToUtc(1990, 3, 29, 0, 0), end: tokyoToUtc(1990, 3, 29, 24, 0) })).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/astro`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/astro/solar-terms.ts
import { SearchSunLongitude } from "astronomy-engine";
import { tokyoParts } from "../tokyo-time";
import type { TimeRange } from "../types";

const cache = new Map<string, number>();

/** その年(UTC の1月1日から1年以内)に太陽黄経が longitude 度になる瞬間 */
export function solarLongitudeTime(year: number, longitude: number): Date {
  const key = `${year}:${longitude}`;
  const cached = cache.get(key);
  if (cached !== undefined) return new Date(cached);
  const found = SearchSunLongitude(longitude, new Date(Date.UTC(year, 0, 1)), 366);
  if (!found) throw new Error(`太陽黄経 ${longitude}° の時刻が ${year} 年に見つかりません`);
  cache.set(key, found.date.getTime());
  return found.date;
}

/** 節月の始まり(節入り)の太陽黄経。index 0 = 寅月(立春) … 11 = 丑月(小寒) */
export const JIE_LONGITUDES = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285] as const;

export const SOLAR_MONTH_BRANCH_NAMES = [
  "寅月", "卯月", "辰月", "巳月", "午月", "未月", "申月", "酉月", "戌月", "亥月", "子月", "丑月",
] as const;

/** 九星の年(立春始まり)Y の、index 番目の節月の開始時刻 */
function monthStart(kyuseiYear: number, index: number): Date {
  return index < 11
    ? solarLongitudeTime(kyuseiYear, JIE_LONGITUDES[index])
    : solarLongitudeTime(kyuseiYear + 1, JIE_LONGITUDES[11]);
}

export interface SolarMonth {
  /** 立春で区切った年 */
  kyuseiYear: number;
  /** 0 = 寅月 … 11 = 丑月 */
  index: number;
  start: Date;
  end: Date;
}

export function solarMonthAt(at: Date): SolarMonth {
  const t = at.getTime();
  const year = tokyoParts(at).year;
  for (const ky of [year, year - 1]) {
    for (let i = 11; i >= 0; i--) {
      const start = monthStart(ky, i);
      if (start.getTime() <= t) {
        const end = i === 11 ? monthStart(ky + 1, 0) : monthStart(ky, i + 1);
        return { kyuseiYear: ky, index: i, start, end };
      }
    }
  }
  throw new Error("節月を特定できません");
}

/** 範囲の内側(両端を含まない)にある節入り時刻 */
export function jieBoundariesWithin(range: TimeRange): Date[] {
  const year = tokyoParts(range.start).year;
  const result: Date[] = [];
  for (const ky of [year - 1, year]) {
    for (let i = 0; i < 12; i++) {
      const t = monthStart(ky, i);
      if (t > range.start && t < range.end) result.push(t);
    }
  }
  return result.sort((a, b) => a.getTime() - b.getTime());
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/fortune/astro`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune/astro
git commit -m "feat: 二十四節気の時刻と節月の計算を追加"
```

---

### Task 5: 干支と、時刻の曖昧さの処理

**Files:**
- Create: `src/lib/fortune/sexagenary.ts`、`src/lib/fortune/ambiguity.ts`
- Test: `src/lib/fortune/__tests__/sexagenary.test.ts`、`src/lib/fortune/__tests__/ambiguity.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/__tests__/sexagenary.test.ts
import { describe, it, expect } from "vitest";
import { cycleName, dayCycleIndex, monthBranchIndex, yearBranchIndex, BRANCHES } from "../sexagenary";

describe("sexagenary", () => {
  it("日の干支", () => {
    expect(cycleName(dayCycleIndex({ year: 2000, month: 1, day: 1 }))).toBe("戊午");
    expect(cycleName(dayCycleIndex({ year: 2025, month: 1, day: 1 }))).toBe("庚午");
    expect(cycleName(dayCycleIndex({ year: 2024, month: 12, day: 26 }))).toBe("甲子");
  });

  it("年の十二支(立春で区切った年)", () => {
    expect(BRANCHES[yearBranchIndex(2026)]).toBe("午");
    expect(BRANCHES[yearBranchIndex(1984)]).toBe("子");
  });

  it("節月の十二支(0 = 寅月)", () => {
    expect(BRANCHES[monthBranchIndex(0)]).toBe("寅");
    expect(BRANCHES[monthBranchIndex(10)]).toBe("子");
    expect(BRANCHES[monthBranchIndex(11)]).toBe("丑");
  });
});
```

```ts
// src/lib/fortune/__tests__/ambiguity.test.ts
import { describe, it, expect } from "vitest";
import { describeResolved, isAmbiguous, representative, resolveOverRange } from "../ambiguity";
import { tokyoToUtc } from "../tokyo-time";

const range = { start: tokyoToUtc(2026, 2, 4, 0, 0), end: tokyoToUtc(2026, 2, 4, 24, 0) };
const boundary = tokyoToUtc(2026, 2, 4, 5, 2);

describe("resolveOverRange", () => {
  it("境界がなければ確定値を返すこと", () => {
    const r = resolveOverRange(range, [], () => "A", (a, b) => a === b);
    expect(r).toEqual({ kind: "fixed", value: "A" });
  });

  it("境界の前後で値が変われば候補にすること", () => {
    const r = resolveOverRange(range, [boundary], (at) => (at < boundary ? "前" : "後"), (a, b) => a === b);
    expect(r.kind).toBe("ambiguous");
    if (r.kind !== "ambiguous") return;
    expect(r.options.map((o) => o.value)).toEqual(["前", "後"]);
    expect(r.options[0].range.end.getTime()).toBe(boundary.getTime());
    expect(isAmbiguous(r)).toBe(true);
    expect(representative(r)).toBe("前");
  });

  it("境界があっても値が同じなら確定値にまとめること", () => {
    const r = resolveOverRange(range, [boundary], () => "同じ", (a, b) => a === b);
    expect(r).toEqual({ kind: "fixed", value: "同じ" });
  });
});

describe("describeResolved", () => {
  it("候補を時刻範囲付きで表記すること", () => {
    const r = resolveOverRange(range, [boundary], (at) => (at < boundary ? "二黒土星" : "一白水星"), (a, b) => a === b);
    expect(describeResolved(r, (v) => v)).toBe("二黒土星(〜5:02) / 一白水星(5:02〜)");
  });

  it("表記が同じ候補は1つにまとめること", () => {
    const r = resolveOverRange(range, [boundary], (at) => ({ a: 1, b: at < boundary ? 1 : 2 }), (x, y) => x.a === y.a && x.b === y.b);
    expect(describeResolved(r, (v) => String(v.a))).toBe("1");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/sexagenary.test.ts src/lib/fortune/__tests__/ambiguity.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/sexagenary.ts
import { mod, toJdn, type LocalDate } from "./local-date";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** 六十干支の番号(0 = 甲子) */
export function cycleName(index: number): string {
  return `${STEMS[mod(index, 10)]}${BRANCHES[mod(index, 12)]}`;
}

/** その日の干支の番号(日柱は0時切替) */
export function dayCycleIndex(d: LocalDate): number {
  return mod(toJdn(d) + 49, 60);
}

/** 立春で区切った年の十二支の番号(1984 = 子) */
export function yearBranchIndex(kyuseiYear: number): number {
  return mod(kyuseiYear - 4, 12);
}

/** 節月(0 = 寅月)の十二支の番号 */
export function monthBranchIndex(solarMonthIndex: number): number {
  return mod(solarMonthIndex + 2, 12);
}
```

```ts
// src/lib/fortune/ambiguity.ts
import { formatTokyoHm } from "./tokyo-time";
import type { Resolved, TimeRange } from "./types";

/**
 * 範囲を境界時刻で区切り、各区間の中央で compute した結果をまとめる。
 * 結果が1つなら確定、複数なら区間付きの候補にする(設計書 §5)。
 */
export function resolveOverRange<T>(
  range: TimeRange,
  boundaries: Date[],
  compute: (at: Date) => T,
  equals: (a: T, b: T) => boolean,
): Resolved<T> {
  const cuts = boundaries
    .filter((b) => b > range.start && b < range.end)
    .sort((a, b) => a.getTime() - b.getTime());
  const edges = [range.start, ...cuts, range.end];

  const options: { value: T; range: TimeRange }[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const segment = { start: edges[i], end: edges[i + 1] };
    const mid = new Date((segment.start.getTime() + segment.end.getTime()) / 2);
    const value = compute(mid);
    const last = options[options.length - 1];
    if (last && equals(last.value, value)) {
      last.range = { start: last.range.start, end: segment.end };
    } else {
      options.push({ value, range: segment });
    }
  }
  return options.length === 1 ? { kind: "fixed", value: options[0].value } : { kind: "ambiguous", options };
}

export function isAmbiguous<T>(r: Resolved<T>): boolean {
  return r.kind === "ambiguous";
}

/** 運勢の計算に使う代表値(候補があれば最初の候補) */
export function representative<T>(r: Resolved<T>): T {
  return r.kind === "fixed" ? r.value : r.options[0].value;
}

export function resolvedValues<T>(r: Resolved<T>): T[] {
  return r.kind === "fixed" ? [r.value] : r.options.map((o) => o.value);
}

function rangeLabel(range: TimeRange, index: number, count: number): string {
  if (index === 0) return `〜${formatTokyoHm(range.end)}`;
  if (index === count - 1) return `${formatTokyoHm(range.start)}〜`;
  return `${formatTokyoHm(range.start)}〜${formatTokyoHm(range.end)}`;
}

/** 表示用の文字列。候補は「A(〜5:02) / B(5:02〜)」。表記が同じ候補は1つにまとめる */
export function describeResolved<T>(r: Resolved<T>, format: (v: T) => string): string {
  if (r.kind === "fixed") return format(r.value);
  const labels = r.options.map((o) => format(o.value));
  if (labels.every((l) => l === labels[0])) return labels[0];
  return r.options.map((o, i) => `${labels[i]}(${rangeLabel(o.range, i, r.options.length)})`).join(" / ");
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/sexagenary.test.ts src/lib/fortune/__tests__/ambiguity.test.ts`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune
git commit -m "feat: 干支の計算と、出生時刻の曖昧さを候補にまとめる処理を追加"
```

---

### Task 6: 数秘術

**Files:**
- Create: `src/lib/fortune/numerology/calc.ts`、`src/lib/fortune/numerology/index.ts`
- Test: `src/lib/fortune/numerology/__tests__/numerology.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/numerology/__tests__/numerology.test.ts
import { describe, it, expect } from "vitest";
import { birthdayNumber, lifePath, numberId, personalDay, personalMonth, personalYear, reduceNumber } from "../calc";
import { numerology } from "../index";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";

describe("reduceNumber", () => {
  it("マスターナンバーを残す/残さない", () => {
    expect(reduceNumber(29, true)).toBe(11);
    expect(reduceNumber(29, false)).toBe(2);
    expect(reduceNumber(33, true)).toBe(33);
    expect(reduceNumber(30, true)).toBe(3);
    expect(reduceNumber(9, true)).toBe(9);
  });
});

describe("lifePath(全桁を一度に足す)", () => {
  it.each([
    [{ year: 1990, month: 3, day: 29 }, 33],
    [{ year: 2000, month: 1, day: 1 }, 4],
    [{ year: 1985, month: 11, day: 23 }, 3],
    [{ year: 1992, month: 9, day: 2 }, 5],
    [{ year: 1991, month: 2, day: 7 }, 11],
    [{ year: 2002, month: 9, day: 9 }, 22],
  ])("%o → %i", (date, expected) => {
    expect(lifePath(date)).toBe(expected);
  });
});

describe("バースデー・パーソナルナンバー", () => {
  it("バースデーはマスターナンバーを残す", () => {
    expect(birthdayNumber(29)).toBe(11);
    expect(birthdayNumber(22)).toBe(22);
    expect(birthdayNumber(14)).toBe(5);
    expect(birthdayNumber(31)).toBe(4);
  });

  it("パーソナルイヤー/マンス/デーは1〜9", () => {
    const py = personalYear({ month: 3, day: 29 }, 2026);
    expect(py).toBe(6);
    const pm = personalMonth(py, 10);
    expect(pm).toBe(7);
    expect(personalDay(pm, 14)).toBe(3);
  });

  it("早見表の id", () => {
    expect(numberId(33)).toBe("number-33");
  });
});

describe("numerology.read", () => {
  const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
  const reading = numerology.read(profile, toBirthMoment(profile), { year: 2026, month: 10, day: 14 });

  it("人物像にライフパスとバースデーを返すこと", () => {
    expect(reading.natal).toEqual([
      { label: "ライフパス", value: "33", refs: [{ system: "numerology", id: "number-33" }] },
      { label: "バースデー", value: "11", refs: [{ system: "numerology", id: "number-11" }] },
    ]);
    expect(reading.ambiguous).toBe(false);
  });

  it("期間ごとの範囲と見出し", () => {
    expect(reading.periods.day.rangeLabel).toBe("2026/10/14");
    expect(reading.periods.day.headline).toEqual({ text: "パーソナルデー3", ref: { system: "numerology", id: "number-3" } });
    expect(reading.periods.month.rangeLabel).toBe("2026/10/1〜2026/10/31");
    expect(reading.periods.month.headline.text).toBe("パーソナルマンス7");
    expect(reading.periods.year.rangeLabel).toBe("2026/1/1〜2026/12/31");
    expect(reading.periods.year.headline.text).toBe("パーソナルイヤー6");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/numerology`
Expected: FAIL

- [ ] **Step 3: 計算を実装する**

```ts
// src/lib/fortune/numerology/calc.ts
import type { LocalDate } from "../local-date";

const MASTER_NUMBERS = new Set([11, 22, 33]);

function digitSum(n: number): number {
  return String(Math.abs(n))
    .split("")
    .reduce((sum, c) => sum + Number(c), 0);
}

/** 1桁になるまで各桁を足す。keepMaster なら 11・22・33 で止める */
export function reduceNumber(n: number, keepMaster: boolean): number {
  let v = n;
  while (v > 9 && !(keepMaster && MASTER_NUMBERS.has(v))) v = digitSum(v);
  return v;
}

/** ライフパスナンバー(生年月日の全桁を一度に足す) */
export function lifePath(d: LocalDate): number {
  const digits = `${d.year}${String(d.month).padStart(2, "0")}${String(d.day).padStart(2, "0")}`;
  return reduceNumber(digitSum(Number(digits)), true);
}

/** バースデーナンバー(生まれた日) */
export function birthdayNumber(day: number): number {
  return reduceNumber(day, true);
}

/** パーソナルイヤー(誕生月日 + 対象年の各桁) */
export function personalYear(birth: { month: number; day: number }, year: number): number {
  return reduceNumber(digitSum(birth.month) + digitSum(birth.day) + digitSum(year), false);
}

export function personalMonth(personalYearNumber: number, month: number): number {
  return reduceNumber(personalYearNumber + month, false);
}

export function personalDay(personalMonthNumber: number, day: number): number {
  return reduceNumber(personalMonthNumber + day, false);
}

/** 早見表の項目 id(1C の辞書データと一致させる) */
export function numberId(n: number): string {
  return `number-${n}`;
}
```

- [ ] **Step 4: SystemReading を実装する**

```ts
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
```

- [ ] **Step 5: テスト・型**

Run: `npx vitest run src/lib/fortune/numerology && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: コミットする**

```bash
git add src/lib/fortune/numerology
git commit -m "feat: 数秘術の計算(ライフパス・バースデー・パーソナルナンバー)を追加"
```

---

### Task 7: 九星気学の計算(本命星・月命星・傾斜宮・盤・日家九星・吉方位)

**Files:**
- Create: `src/lib/fortune/kyusei/calc.ts`
- Test: `src/lib/fortune/kyusei/__tests__/calc.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/kyusei/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import {
  dayStar,
  keisha,
  kyuseiNatalAt,
  luckyDirections,
  monthStar,
  positionInBoard,
  yearStar,
} from "../calc";
import { tokyoToUtc } from "../../tokyo-time";

describe("yearStar(本命星・年盤の中宮)", () => {
  it.each([
    [1990, 1],
    [2000, 9],
    [1998, 2],
    [2024, 3],
    [2025, 2],
    [2026, 1],
  ])("%i年 → %i", (y, star) => {
    expect(yearStar(y)).toBe(star);
  });
});

describe("monthStar(月命星・月盤の中宮)", () => {
  it("グループごとの寅月の星から1つずつ減ること", () => {
    expect(monthStar(1, 0)).toBe(8);
    expect(monthStar(1, 1)).toBe(7);
    expect(monthStar(1, 10)).toBe(7);
    expect(monthStar(2, 0)).toBe(2);
    expect(monthStar(2, 11)).toBe(9);
    expect(monthStar(3, 0)).toBe(5);
  });
});

describe("positionInBoard", () => {
  it("定位盤(中宮が五黄)の配置", () => {
    expect(positionInBoard(5, 1)).toBe("n");
    expect(positionInBoard(5, 9)).toBe("s");
    expect(positionInBoard(5, 6)).toBe("nw");
    expect(positionInBoard(5, 5)).toBe("center");
  });
});

describe("keisha(傾斜宮)", () => {
  it("月命星を中宮に置いた盤で本命星が入る宮", () => {
    expect(keisha(1, 7)).toEqual(["ne"]);
  });

  it("中宮傾斜の表", () => {
    expect(keisha(1, 1)).toEqual(["s"]);
    expect(keisha(2, 2)).toEqual(["nw"]);
    expect(keisha(3, 3)).toEqual(["se"]);
    expect(keisha(4, 4)).toEqual(["e"]);
    expect(keisha(6, 6)).toEqual(["sw"]);
    expect(keisha(7, 7)).toEqual(["ne"]);
    expect(keisha(8, 8)).toEqual(["w"]);
    expect(keisha(9, 9)).toEqual(["n"]);
  });

  it("五黄同士は性別で分かれ、未入力なら両方", () => {
    expect(keisha(5, 5, "male")).toEqual(["w"]);
    expect(keisha(5, 5, "female")).toEqual(["nw"]);
    expect(keisha(5, 5)).toEqual(["w", "nw"]);
  });
});

describe("kyuseiNatalAt", () => {
  it("1990年3月29日は一白水星・七赤金星・艮宮傾斜", () => {
    expect(kyuseiNatalAt(tokyoToUtc(1990, 3, 29, 12, 0))).toEqual({ honmei: 1, getsumei: 7, keisha: ["ne"] });
  });

  it("立春前は前年の星", () => {
    expect(kyuseiNatalAt(tokyoToUtc(1990, 2, 3, 12, 0)).honmei).toBe(2);
    expect(kyuseiNatalAt(tokyoToUtc(1990, 2, 3, 12, 0)).getsumei).toBe(9);
  });
});

describe("dayStar(日家九星)", () => {
  it.each([
    [{ year: 2024, month: 12, day: 26 }, 1],
    [{ year: 2025, month: 1, day: 1 }, 7],
    [{ year: 2025, month: 6, day: 24 }, 9],
    [{ year: 2025, month: 6, day: 25 }, 8],
    [{ year: 2025, month: 12, day: 21 }, 1],
  ])("%o → %i", (d, star) => {
    expect(dayStar(d)).toBe(star);
  });
});

describe("luckyDirections", () => {
  it("定位盤・本命一白・子の破のとき", () => {
    // 本命殺=北、本命的殺=南、破=南(子の反対)。一白と相性のよい 3・4・6・7 が入る方位が吉
    expect(luckyDirections(5, 1, 0)).toEqual(["e", "se", "w", "nw"]);
  });

  it("五黄殺・暗剣殺・本命殺・本命的殺・破を除くこと", () => {
    // 中宮が一白の盤: 乾=二黒 兌=三碧 艮=四緑 離=五黄 坎=六白 坤=七赤 震=八白 巽=九紫
    // 五黄殺=南、暗剣殺=北、本命(九紫)殺=南東、本命的殺=北西、午の破=北
    // 残る 西(三碧)・北東(四緑)・南西(七赤)・東(八白) のうち、九紫と相性のよい 2・3・4・8 は 西・北東・東
    expect(luckyDirections(1, 9, 6)).toEqual(["ne", "e", "w"]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/kyusei`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/kyusei/calc.ts
import { solarLongitudeTime, solarMonthAt } from "../astro/solar-terms";
import { mod, toJdn, type LocalDate } from "../local-date";
import { dayCycleIndex } from "../sexagenary";
import { jstLocalDate } from "../tokyo-time";
import type { BirthProfile } from "../types";

export type Direction = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type Palace = Direction | "center";

export const STAR_NAMES = [
  "一白水星", "二黒土星", "三碧木星", "四緑木星", "五黄土星", "六白金星", "七赤金星", "八白土星", "九紫火星",
] as const;

export const DIRECTIONS: readonly Direction[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

export const DIRECTION_LABELS: Record<Direction, string> = {
  n: "北", ne: "北東", e: "東", se: "南東", s: "南", sw: "南西", w: "西", nw: "北西",
};

export const PALACE_NAMES: Record<Palace, string> = {
  center: "中宮", n: "坎宮", ne: "艮宮", e: "震宮", se: "巽宮", s: "離宮", sw: "坤宮", w: "兌宮", nw: "乾宮",
};

const OPPOSITE: Record<Direction, Direction> = { n: "s", ne: "sw", e: "w", se: "nw", s: "n", sw: "ne", w: "e", nw: "se" };

/** 洛書の飛泊順(中宮→乾→兌→艮→離→坎→坤→震→巽) */
const FLIGHT: readonly Palace[] = ["center", "nw", "w", "ne", "s", "n", "sw", "e", "se"];

/** 十二支(0 = 子)の方位 */
const BRANCH_DIRECTION: readonly Direction[] = ["n", "ne", "ne", "e", "se", "se", "s", "sw", "sw", "w", "nw", "nw"];

/** 本命星と相性のよい星(相生・比和) */
const LUCKY_STARS: Record<number, readonly number[]> = {
  1: [3, 4, 6, 7],
  2: [6, 7, 8, 9],
  3: [1, 4, 9],
  4: [1, 3, 9],
  5: [2, 6, 7, 8, 9],
  6: [1, 2, 7, 8],
  7: [1, 2, 6, 8],
  8: [2, 6, 7, 9],
  9: [2, 3, 4, 8],
};

/** 本命星=月命星のときの中宮傾斜(八雲院の表)。5 は性別で分かれる */
const CENTER_KEISHA: Record<number, Direction> = { 1: "s", 2: "nw", 3: "se", 4: "e", 6: "sw", 7: "ne", 8: "w", 9: "n" };

/** 立春で区切った年の中宮の星(=その年生まれの本命星) */
export function yearStar(kyuseiYear: number): number {
  return mod(11 - mod(kyuseiYear, 9), 9) || 9;
}

/** 年の星と節月(0 = 寅月)から月の中宮の星(=月命星) */
export function monthStar(yearStarNumber: number, solarMonthIndex: number): number {
  const group = (yearStarNumber - 1) % 3; // 0: 一白・四緑・七赤 / 1: 二黒・五黄・八白 / 2: 三碧・六白・九紫
  const firstMonth = [8, 2, 5][group];
  return mod(firstMonth - solarMonthIndex - 1, 9) + 1;
}

/** 中宮の星が center の盤で、star が入る宮 */
export function positionInBoard(center: number, star: number): Palace {
  return FLIGHT[mod(star - center, 9)];
}

/** 傾斜宮。五黄同士で性別未入力なら男性・女性の2候補 */
export function keisha(honmei: number, getsumei: number, gender?: BirthProfile["gender"]): Direction[] {
  if (honmei !== getsumei) return [positionInBoard(getsumei, honmei) as Direction];
  if (honmei !== 5) return [CENTER_KEISHA[honmei]];
  if (gender === "male") return ["w"];
  if (gender === "female") return ["nw"];
  return ["w", "nw"];
}

export interface KyuseiNatal {
  honmei: number;
  getsumei: number;
  keisha: Direction[];
}

export function kyuseiNatalAt(at: Date, gender?: BirthProfile["gender"]): KyuseiNatal {
  const m = solarMonthAt(at);
  const honmei = yearStar(m.kyuseiYear);
  const getsumei = monthStar(honmei, m.index);
  return { honmei, getsumei, keisha: keisha(honmei, getsumei, gender) };
}

export function sameKyuseiNatal(a: KyuseiNatal, b: KyuseiNatal): boolean {
  return a.honmei === b.honmei && a.getsumei === b.getsumei && a.keisha.join() === b.keisha.join();
}

/** jdn に最も近い甲子日のユリウス日 */
function nearestKasshi(jdn: number): number {
  const index = mod(jdn + 49, 60);
  const previous = jdn - index;
  return index <= 30 ? previous : previous + 60;
}

const switchCache = new Map<number, { jdn: number; ascending: boolean }[]>();

/** year 前後の陽遁(冬至)・陰遁(夏至)の切り替え日 */
function switchesAround(year: number) {
  const cached = switchCache.get(year);
  if (cached) return cached;
  const list: { jdn: number; ascending: boolean }[] = [];
  for (const y of [year - 1, year, year + 1]) {
    list.push({ jdn: nearestKasshi(toJdn(jstLocalDate(solarLongitudeTime(y, 270)))), ascending: true });
    list.push({ jdn: nearestKasshi(toJdn(jstLocalDate(solarLongitudeTime(y, 90)))), ascending: false });
  }
  list.sort((a, b) => a.jdn - b.jdn);
  switchCache.set(year, list);
  return list;
}

/** 日家九星(日盤の中宮の星) */
export function dayStar(d: LocalDate): number {
  const jdn = toJdn(d);
  const switches = switchesAround(d.year).filter((s) => s.jdn <= jdn);
  const last = switches[switches.length - 1];
  const diff = jdn - last.jdn;
  return last.ascending ? mod(diff, 9) + 1 : 9 - mod(diff, 9);
}

/** 日の破に使う十二支の番号 */
export function dayBranchIndex(d: LocalDate): number {
  return mod(dayCycleIndex(d), 12);
}

/**
 * 吉方位。五黄殺・暗剣殺・本命殺・本命的殺・破を除き、本命星と相性のよい星が入る方位。
 * breakBranch はその盤の十二支(歳破・月破・日破はその反対の方位)。
 */
export function luckyDirections(center: number, honmei: number, breakBranch: number): Direction[] {
  const starAt = (dir: Direction) => mod(center - 1 + FLIGHT.indexOf(dir), 9) + 1;
  const bad = new Set<Direction>();
  const gohoPos = positionInBoard(center, 5);
  if (gohoPos !== "center") {
    bad.add(gohoPos);
    bad.add(OPPOSITE[gohoPos]);
  }
  const honmeiPos = positionInBoard(center, honmei);
  if (honmeiPos !== "center") {
    bad.add(honmeiPos);
    bad.add(OPPOSITE[honmeiPos]);
  }
  bad.add(OPPOSITE[BRANCH_DIRECTION[mod(breakBranch, 12)]]);
  return DIRECTIONS.filter((dir) => !bad.has(dir) && LUCKY_STARS[honmei].includes(starAt(dir)));
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/fortune/kyusei`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune/kyusei
git commit -m "feat: 九星気学の計算(本命星・月命星・傾斜宮・日家九星・吉方位)を追加"
```

---

### Task 8: 九星気学の SystemReading

**Files:**
- Create: `src/lib/fortune/kyusei/index.ts`
- Test: `src/lib/fortune/kyusei/__tests__/kyusei.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/kyusei/__tests__/kyusei.test.ts
import { describe, it, expect } from "vitest";
import { kyusei, palaceId, starId, directionId } from "../index";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";

const today = { year: 2026, month: 10, day: 14 };

describe("kyusei.read", () => {
  it("人物像に本命星・月命星・傾斜宮を返すこと", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.natal).toEqual([
      { label: "本命星", value: "一白水星", refs: [{ system: "kyusei", id: starId(1) }] },
      { label: "月命星", value: "七赤金星", refs: [{ system: "kyusei", id: starId(7) }] },
      { label: "傾斜宮", value: "艮宮", refs: [{ system: "kyusei", id: palaceId("ne") }] },
    ]);
    expect(r.ambiguous).toBe(false);
  });

  it("立春当日で時刻不明なら本命星を候補にすること", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.ambiguous).toBe(true);
    expect(r.natal[0].value).toMatch(/^二黒土星\(〜11:1\d\) \/ 一白水星\(11:1\d〜\)$/);
    expect(r.natal[0].refs).toEqual([
      { system: "kyusei", id: starId(2) },
      { system: "kyusei", id: starId(1) },
    ]);
  });

  it("五黄同士で性別未入力なら傾斜宮を両方示すこと", () => {
    // 1995年(五黄の年)の申月(8/8〜9/7)は 2・5・8 グループで月命も五黄
    const p: BirthProfile = { version: 1, date: { year: 1995, month: 8, day: 20 }, time: { kind: "hour", hour: 12 } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.natal[0].value).toBe("五黄土星");
    expect(r.natal[1].value).toBe("五黄土星");
    expect(r.natal[2].value).toBe("兌宮(男性)または乾宮(女性)");
  });

  it("期間の範囲は立春・節入りで区切ること", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    expect(r.periods.year.rangeLabel).toBe("2026/2/4〜2027/2/3");
    expect(r.periods.month.rangeLabel).toMatch(/^2026\/10\/8〜2026\/11\/6$/);
    expect(r.periods.day.rangeLabel).toBe("2026/10/14");
  });

  it("期間の結果に本命星の位置と吉方位のチップを持つこと", () => {
    const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };
    const r = kyusei.read(p, toBirthMoment(p), today);
    // 2026年は一白が中宮 → 本命一白は中宮に回る
    expect(r.periods.year.headline).toEqual({ text: "今年は本命星が中宮に回る", ref: { system: "kyusei", id: palaceId("center") } });
    const labels = r.periods.year.chips.map((c) => c.label);
    expect(labels).toEqual(["本命星の位置", "吉方位", "年盤の中宮"]);
    expect(r.periods.year.chips[2].value).toBe("一白水星");
    for (const chip of r.periods.year.chips[1].refs) expect(chip.id).toMatch(/^direction-/);
  });

  it("id の形式", () => {
    expect(starId(9)).toBe("star-9");
    expect(palaceId("nw")).toBe("palace-nw");
    expect(directionId("se")).toBe("direction-se");
  });
});
```

※ 2026年の寒露は 10/8、立冬は 11/7 の予定(国立天文台)。月の範囲は「寒露の日〜立冬の前日」になる。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/kyusei/__tests__/kyusei.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/kyusei/index.ts
import { describeResolved, isAmbiguous, representative, resolvedValues, resolveOverRange } from "../ambiguity";
import { jieBoundariesWithin, solarLongitudeTime, solarMonthAt } from "../astro/solar-terms";
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
  type Direction,
  type KyuseiNatal,
  type Palace,
} from "./calc";

/** 早見表の項目 id(1C の辞書データと一致させる) */
export const starId = (n: number) => `star-${n}`;
export const palaceId = (p: Palace) => `palace-${p}`;
export const directionId = (d: Direction) => `direction-${d}`;

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
  const noon = tokyoToUtc(today.year, today.month, today.day, 12, 0);
  const month = solarMonthAt(noon);
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
```

- [ ] **Step 4: テスト・型・lint**

Run: `npx vitest run src/lib/fortune/kyusei && npx tsc --noEmit && npx eslint src/lib/fortune/kyusei`
Expected: PASS、エラーなし

テストの月の範囲(2026/10/8〜2026/11/6)が失敗した場合は、`solarLongitudeTime(2026, 195)` と `(2026, 225)` の日本時間の日付を出力して確認する。寒露・立冬の日付がずれている場合はテストの期待値ではなく実装(節月の境界)を疑うこと。

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune/kyusei
git commit -m "feat: 九星気学の人物像と今日・今月・今年の運勢を返す処理を追加"
```

---

### Task 9: マヤ暦(13の月の暦)の計算

**Files:**
- Create: `src/lib/fortune/maya/calc.ts`
- Test: `src/lib/fortune/maya/__tests__/calc.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/maya/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import {
  SEAL_NAMES,
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
} from "../calc";

describe("kinOf", () => {
  it.each([
    [{ year: 1987, month: 7, day: 26 }, 34],
    [{ year: 2013, month: 7, day: 26 }, 164],
    [{ year: 2012, month: 12, day: 21 }, 207],
  ])("%o → KIN %i", (d, kin) => {
    expect(kinOf(d)).toBe(kin);
  });

  it("2月29日は2月28日と同じKINで、3月1日は2月28日の翌KIN", () => {
    const feb28 = kinOf({ year: 2024, month: 2, day: 28 });
    expect(kinOf({ year: 2024, month: 2, day: 29 })).toBe(feb28);
    expect(kinOf({ year: 2024, month: 3, day: 1 })).toBe((feb28 % 260) + 1);
  });

  it("基準日より前の日付も計算できること", () => {
    expect(kinOf({ year: 1987, month: 7, day: 25 })).toBe(33);
  });
});

describe("紋章・音・関係のKIN", () => {
  it("KIN 34 は白い魔法使い・音8", () => {
    expect(SEAL_NAMES[sealOf(34) - 1]).toBe("白い魔法使い");
    expect(toneOf(34)).toBe(8);
  });

  it("ウェイブスペルはKIN 27(青い手)から始まる", () => {
    expect(SEAL_NAMES[wavespellSeal(34) - 1]).toBe("青い手");
  });

  it("ガイド・類似・反対・神秘", () => {
    expect(guideKin(34)).toBe(138);
    expect(SEAL_NAMES[sealOf(guideKin(34)) - 1]).toBe("白い鏡");
    expect(SEAL_NAMES[sealOf(analogKin(34)) - 1]).toBe("赤い蛇");
    expect(toneOf(analogKin(34))).toBe(8);
    expect(SEAL_NAMES[sealOf(antipodeKin(34)) - 1]).toBe("黄色い種");
    expect(occultKin(34)).toBe(227);
    expect(occultKin(1)).toBe(260);
    expect(guideKin(1)).toBe(1);
  });
});

describe("thirteenMoon", () => {
  it("7月26日が第1の月1日", () => {
    expect(thirteenMoon({ year: 2026, month: 7, day: 26 })).toEqual({ moon: 1, day: 1 });
  });

  it("2026年10月14日は第3の月", () => {
    expect(thirteenMoon({ year: 2026, month: 10, day: 14 }).moon).toBe(3);
  });

  it("7月25日は時間をはずした日", () => {
    expect(thirteenMoon({ year: 2026, month: 7, day: 25 })).toEqual({ moon: null, day: null });
  });
});

describe("lastBirthday", () => {
  it("今年の誕生日を過ぎていれば今年、まだなら去年", () => {
    expect(lastBirthday({ month: 3, day: 29 }, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2026, month: 3, day: 29 });
    expect(lastBirthday({ month: 12, day: 1 }, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2025, month: 12, day: 1 });
  });

  it("2月29日生まれはうるう年以外は2月28日", () => {
    expect(lastBirthday({ month: 2, day: 29 }, { year: 2026, month: 10, day: 14 })).toEqual({ year: 2026, month: 2, day: 28 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/maya`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/maya/calc.ts
import { compareLocalDate, isLeapYear, mod, toJdn, type LocalDate } from "../local-date";

/** 13の月の暦(ドリームスペル)の紋章。1 = 赤い竜 … 20 = 黄色い太陽 */
export const SEAL_NAMES = [
  "赤い竜", "白い風", "青い夜", "黄色い種", "赤い蛇", "白い世界の橋渡し", "青い手", "黄色い星", "赤い月", "白い犬",
  "青い猿", "黄色い人", "赤い空歩く人", "白い魔法使い", "青い鷲", "黄色い戦士", "赤い地球", "白い鏡", "青い嵐", "黄色い太陽",
] as const;

/** 銀河の音 1〜13 */
export const TONE_NAMES = [
  "磁気", "月", "電気", "自己存在", "倍音", "律動", "共振", "銀河", "太陽", "惑星", "スペクトル", "水晶", "宇宙",
] as const;

/** 13の月の名前(第1の月 … 第13の月) */
export const MOON_NAMES = [
  "磁気の月", "月の月", "電気の月", "自己存在の月", "倍音の月", "律動の月", "共振の月",
  "銀河の月", "太陽の月", "惑星の月", "スペクトルの月", "水晶の月", "宇宙の月",
] as const;

const REFERENCE: LocalDate = { year: 1987, month: 7, day: 26 };
const REFERENCE_KIN = 34;

const isFeb29 = (d: LocalDate) => d.month === 2 && d.day === 29;
const withoutFeb29 = (d: LocalDate): LocalDate => (isFeb29(d) ? { ...d, day: 28 } : d);

/** ユリウス日 lo より後、hi 以下にある2月29日の数 */
function feb29Between(lo: number, hi: number, fromYear: number, toYear: number): number {
  let count = 0;
  for (let y = fromYear; y <= toYear; y++) {
    if (!isLeapYear(y)) continue;
    const j = toJdn({ year: y, month: 2, day: 29 });
    if (j > lo && j <= hi) count++;
  }
  return count;
}

/** 2月29日を数えない日数差(to − from) */
export function daysWithoutLeapDay(from: LocalDate, to: LocalDate): number {
  const a = toJdn(from);
  const b = toJdn(to);
  if (b >= a) return b - a - feb29Between(a, b, from.year, to.year);
  return -(a - b - feb29Between(b, a, to.year, from.year));
}

export function kinOf(d: LocalDate): number {
  return mod(REFERENCE_KIN - 1 + daysWithoutLeapDay(REFERENCE, withoutFeb29(d)), 260) + 1;
}

export function sealOf(kin: number): number {
  return mod(kin - 1, 20) + 1;
}

export function toneOf(kin: number): number {
  return mod(kin - 1, 13) + 1;
}

/** 紋章と音から KIN を求める(中国剰余定理を総当たりで) */
export function kinFrom(seal: number, tone: number): number {
  for (let kin = 1; kin <= 260; kin++) {
    if (sealOf(kin) === seal && toneOf(kin) === tone) return kin;
  }
  throw new Error(`KIN が見つかりません: seal=${seal}, tone=${tone}`);
}

/** ウェイブスペル(音1の KIN)の紋章 */
export function wavespellSeal(kin: number): number {
  return sealOf(mod(kin - toneOf(kin), 260) + 1);
}

/** ガイドKIN: 音ごとに紋章をずらす(音1・6・11は同じ紋章) */
export function guideKin(kin: number): number {
  const offsets = [8, 0, 12, 4, 16]; // tone % 5 = 0,1,2,3,4
  const seal = mod(sealOf(kin) - 1 + offsets[toneOf(kin) % 5], 20) + 1;
  return kinFrom(seal, toneOf(kin));
}

/** 類似KIN: 紋章番号の和が19(または39)になる紋章・同じ音 */
export function analogKin(kin: number): number {
  return kinFrom(mod(19 - sealOf(kin), 20) || 20, toneOf(kin));
}

/** 反対KIN: 紋章を10ずらす・同じ音 */
export function antipodeKin(kin: number): number {
  return kinFrom(mod(sealOf(kin) - 1 + 10, 20) + 1, toneOf(kin));
}

/** 神秘KIN: 261 − KIN */
export function occultKin(kin: number): number {
  return 261 - kin;
}

/** 13の月の暦での位置。7月25日(時間をはずした日)は moon/day が null */
export function thirteenMoon(d: LocalDate): { moon: number | null; day: number | null } {
  const afterStart = d.month > 7 || (d.month === 7 && d.day >= 26);
  const start: LocalDate = { year: afterStart ? d.year : d.year - 1, month: 7, day: 26 };
  const dayOfYear = daysWithoutLeapDay(start, withoutFeb29(d));
  if (dayOfYear >= 364) return { moon: null, day: null };
  return { moon: Math.floor(dayOfYear / 28) + 1, day: (dayOfYear % 28) + 1 };
}

/** today 以前で直近の誕生日(2月29日生まれは平年は2月28日) */
export function lastBirthday(birth: { month: number; day: number }, today: LocalDate): LocalDate {
  const on = (year: number): LocalDate =>
    birth.month === 2 && birth.day === 29 && !isLeapYear(year) ? { year, month: 2, day: 28 } : { year, ...birth };
  const thisYear = on(today.year);
  return compareLocalDate(thisYear, today) <= 0 ? thisYear : on(today.year - 1);
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/fortune/maya`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune/maya
git commit -m "feat: マヤ暦(13の月の暦)のKIN・紋章・音・関係KINの計算を追加"
```

---

### Task 10: マヤ暦の SystemReading

**Files:**
- Create: `src/lib/fortune/maya/index.ts`
- Test: `src/lib/fortune/maya/__tests__/maya.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/maya/__tests__/maya.test.ts
import { describe, it, expect } from "vitest";
import { maya, moonId, sealId, toneId } from "../index";
import { kinOf } from "../calc";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";

const profile: BirthProfile = { version: 1, date: { year: 1987, month: 7, day: 26 }, time: { kind: "unknown" } };
const today = { year: 2026, month: 10, day: 14 };
const reading = maya.read(profile, toBirthMoment(profile), today);

describe("maya.read", () => {
  it("人物像にKIN・紋章・音・ウェイブスペル・関係KINを返すこと", () => {
    const byLabel = Object.fromEntries(reading.natal.map((f) => [f.label, f]));
    expect(byLabel["KIN"].value).toBe("34");
    expect(byLabel["太陽の紋章"]).toEqual({ label: "太陽の紋章", value: "白い魔法使い", refs: [{ system: "maya", id: sealId(14) }] });
    expect(byLabel["銀河の音"]).toEqual({ label: "銀河の音", value: "8(銀河)", refs: [{ system: "maya", id: toneId(8) }] });
    expect(byLabel["ウェイブスペル"].value).toBe("青い手");
    expect(byLabel["ガイドKIN"].value).toBe("138 白い鏡");
    expect(byLabel["類似KIN"].value).toMatch(/赤い蛇$/);
    expect(byLabel["反対KIN"].value).toMatch(/黄色い種$/);
    expect(byLabel["神秘KIN"].value).toMatch(/^227 /);
    expect(reading.ambiguous).toBe(false);
  });

  it("今日は今日のKIN", () => {
    const kin = kinOf(today);
    expect(reading.periods.day.rangeLabel).toBe("2026/10/14");
    expect(reading.periods.day.chips[0].label).toBe("今日のKIN");
    expect(reading.periods.day.chips[0].value.startsWith(`${kin} `)).toBe(true);
  });

  it("今月は13の月の暦の月", () => {
    expect(reading.periods.month.rangeLabel).toBe("13の月の暦 第3の月");
    expect(reading.periods.month.headline).toEqual({ text: "13の月の暦 第3の月(電気の月)", ref: { system: "maya", id: moonId(3) } });
  });

  it("今年は年回りKIN(直近の誕生日から次の誕生日の前日まで)", () => {
    expect(reading.periods.year.rangeLabel).toBe("2026/7/26〜2027/7/25");
    expect(reading.periods.year.chips[0].label).toBe("年回りKIN");
    expect(reading.periods.year.chips[0].value.startsWith(`${kinOf({ year: 2026, month: 7, day: 26 })} `)).toBe(true);
  });

  it("時間をはずした日の今月", () => {
    const r = maya.read(profile, toBirthMoment(profile), { year: 2026, month: 7, day: 25 });
    expect(r.periods.month.headline).toEqual({ text: "時間をはずした日", ref: { system: "maya", id: moonId(0) } });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/maya/__tests__/maya.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
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
    const nextBirthday = lastBirthday(profile.date, { year: birthday.year + 1, month: birthday.month, day: birthday.day });
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
```

- [ ] **Step 4: テスト・型・lint**

Run: `npx vitest run src/lib/fortune/maya && npx tsc --noEmit && npx eslint src/lib/fortune/maya`
Expected: PASS、エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune/maya
git commit -m "feat: マヤ暦の人物像と今日・今月・今年の運勢を返す処理を追加"
```

---

### Task 11: 占術の一覧と一括計算

**Files:**
- Create: `src/lib/fortune/registry.ts`
- Test: `src/lib/fortune/__tests__/registry.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/__tests__/registry.test.ts
import { describe, it, expect } from "vitest";
import { fortuneSystems, readAll } from "../registry";
import type { BirthProfile } from "../types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("registry", () => {
  it("実装済みの占術を設計書の順(数秘術・九星気学・マヤ暦)で持つこと", () => {
    expect(fortuneSystems.map((s) => s.id)).toEqual(["numerology", "kyusei", "maya"]);
  });

  it("readAll で全占術の結果を返すこと", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    expect(readings.map((r) => r.id)).toEqual(["numerology", "kyusei", "maya"]);
    for (const r of readings) {
      expect(r.natal.length).toBeGreaterThan(0);
      for (const period of ["day", "month", "year"] as const) {
        expect(r.periods[period].period).toBe(period);
        expect(r.periods[period].rangeLabel).not.toBe("");
        expect(r.periods[period].chips.length).toBeGreaterThan(0);
      }
    }
  });

  it("すべての参照 id が占術ごとの命名規則に従うこと", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    const patterns: Record<string, RegExp> = {
      numerology: /^number-(\d|11|22|33)$/,
      kyusei: /^(star-[1-9]|palace-(center|n|ne|e|se|s|sw|w|nw)|direction-(n|ne|e|se|s|sw|w|nw))$/,
      maya: /^(seal-([1-9]|1\d|20)|tone-([1-9]|1[0-3])|moon-([0-9]|1[0-3]))$/,
    };
    for (const r of readings) {
      const refs = [
        ...r.natal.flatMap((f) => f.refs),
        ...Object.values(r.periods).flatMap((p) => [p.headline.ref, ...p.chips.flatMap((c) => c.refs)]),
      ];
      for (const ref of refs) {
        expect(ref.system).toBe(r.id);
        expect(ref.id).toMatch(patterns[r.id]);
      }
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/registry.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/registry.ts
import { toBirthMoment } from "./birth-moment";
import type { LocalDate } from "./local-date";
import { kyusei } from "./kyusei";
import { maya } from "./maya";
import { numerology } from "./numerology";
import type { BirthProfile, FortuneSystemModule, SystemReading } from "./types";

/** 実装済みの占術(設計書 §11.2 の表示順)。未実装の占術はここに登録しない */
export const fortuneSystems: readonly FortuneSystemModule[] = [numerology, kyusei, maya];

/** プロフィールと今日の日付から、全占術の結果を計算する */
export function readAll(profile: BirthProfile, today: LocalDate): SystemReading[] {
  const moment = toBirthMoment(profile);
  return fortuneSystems.map((system) => system.read(profile, moment, today));
}
```

- [ ] **Step 4: 全体の検証**

Run: `npx vitest run && npx tsc --noEmit && npx eslint src/lib/fortune`
Expected: すべて PASS。lint エラーなし

Run: `npm run build`
Expected: 成功(astronomy-engine がクライアントバンドルに入っても静的エクスポートが通ること)

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune
git commit -m "feat: 実装済みの占術の一覧と、プロフィールからの一括計算を追加"
```
