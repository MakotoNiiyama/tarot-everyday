# フェーズ4 西洋占星術 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 運勢ページと早見表に西洋占星術(トロピカル)を追加する。人物像はチャート円(SVG)+天体の表+アスペクトの一覧+ハウスシステムの切り替え、運勢は月・新月満月・木星土星のトランジット。

**Architecture:** 天体の位置は astronomy-engine(視位置・黄道座標 of date)、真のドラゴンヘッドは月の位置・速度ベクトルから、平均リリスは Meeus の式、キロンは JPL Horizons から作った表(1900〜2100年・10日刻み)を補間する。ハウスは Placidus / Koch / ホールサインを計算し、画面で切り替える。記号は `src/components/icons/astro-glyph.tsx`(作成済み)の SVG を使う。

**Tech Stack:** Next.js 16.2.1(静的エクスポート)/ React 19.2 / TypeScript / Tailwind CSS v4 / astronomy-engine 2.1.19 / Vitest / Playwright

設計書: `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`(§3・§3.1・§4・§5・§6.2・§7・§11.2)

---

## 決定事項

| 項目 | 決定 |
|---|---|
| 黄経 | トロピカル。地心の視位置(光差・光行差込み)を、その日の真の黄道座標(ECT)で表す |
| 天体 | 太陽・月・水星・金星・火星・木星・土星・天王星・海王星・冥王星・ドラゴンヘッド(真)・キロン・リリス(平均) |
| キロン | JPL Horizons の地心黄経(of date)を 1900-01-01〜2100-01-01 の10日刻みで取得した表を、スクリプトで生成してリポジトリに含める。4点ラグランジュ補間。範囲外は表示しない。出典「JPL Horizons (NASA/JPL-Caltech)」を表のファイルに書く |
| ハウス | 既定は Placidus。Koch・ホールサインに画面で切り替えられる。運勢で使うハウスは Placidus |
| 出生時刻(ユーザー確認済み) | 不明は正午(12:00)、午前は 6:00、午後は 18:00 で ASC・ハウス・チャート円を仮計算して出し、「出生時刻不明のため正午で仮計算」などと注記する。時刻を指定したときはその時の中央(xx:30)で計算し、その1時間で ASC の星座が変わるときは ASC を候補にする |
| 星座の候補 | 各天体の星座は出生時刻の範囲(§5)で判定し、範囲内で星座が変わる天体(主に月)は候補にする |
| 出生地 | 都道府県の県庁所在地の緯度経度。未入力は明石(北緯34.65・東経135.0)で、「出生地未入力のため明石基準」と注記する |
| アスペクト | 主要5種(0・60・90・120・180)とクインカンクス(150)を既定で表示。マイナー(30・45・72・135・144)は切り替えで表示 |
| オーブ | 太陽・月を含む / 含まない: 0・180 = 10 / 8、90・120 = 8 / 6、60 = 6 / 4、150 = 3、マイナー = 2。ドラゴンヘッド・キロン・リリス・ASC・MC を含む組は主要5種のみ・オーブ3 |
| 期間(§3.1) | 今日: その日の正午の月の星座と、本命の Placidus のどのハウスにあるか。今月: 暦の月(1日〜末日)の新月・満月の日付・星座・ハウスと、月の中日(15日正午)の火星の星座・ハウス。今年: 暦の年(1/1〜12/31)の木星・土星の今日の星座・ハウス。年の途中で星座が変わるときは「双子座→蟹座(6/30〜)」 |

## 検証用の固定値(astro.com の swetest = Swiss Ephemeris 2.10 の出力)

出生 1990-03-29 14:00 JST(05:00 UT)、北緯 35.69・東経 139.69(東京都の県庁所在地と同じ値)。

| 天体 | 黄経 | | 天体 | 黄経 |
|---|---|---|---|---|
| 太陽 | 8.24777(牡羊座) | | 土星 | 294.25338(山羊座) |
| 月 | 41.61299(牡牛座) | | 天王星 | 279.48349(山羊座) |
| 水星 | 18.52027(牡羊座) | | 海王星 | 284.48210(山羊座) |
| 金星 | 321.79518(水瓶座) | | 冥王星 | 227.38624(蠍座・逆行) |
| 火星 | 313.03284(水瓶座) | | ドラゴンヘッド(真) | 315.05188(水瓶座) |
| 木星 | 92.47263(蟹座) | | リリス(平均) | 226.17984(蠍座) |
| キロン | 100.71488(蟹座) | | | |

ASC 139.65546(獅子座)、MC 43.48916(牡牛座)。
Placidus の2・3・11・12室: 162.92729、190.87885、77.96720、110.53274(5・6・8・9室はその反対)。
Koch の2・3・11・12室: 167.51863、195.68153、81.81378、111.91252。
本命の Placidus のハウス: 太陽は第8ハウス(8室 342.93〜9室 10.88)、月は第9ハウス(9室 10.88〜10室 43.49)。

2000-01-01 12:00 UT: 太陽 280.36892、月 223.32375、火星 327.96330、木星 25.25309、キロン 251.61750(251°37′03″)。

許容誤差(astronomy-engine との差): 惑星 0.02°、月 0.03°、冥王星 0.05°、ドラゴンヘッド 0.05°、リリス 0.05°、キロン 0.02°、ASC・MC・カスプ 0.05°。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `scripts/fetch-chiron.mjs`(新規) | JPL Horizons からキロンの表を取得して `chiron-table.ts` を書き出す |
| `src/lib/fortune/horoscope/chiron-table.ts`(生成) | キロンの黄経の表 |
| `src/lib/fortune/horoscope/zodiac.ts`(新規) | 星座・天体の名前、度数の表記 |
| `src/lib/fortune/horoscope/ephemeris.ts`(新規) | 天体の黄経・逆行、真のドラゴンヘッド、平均リリス、キロン |
| `src/lib/fortune/horoscope/houses.ts`(新規) | ASC・MC・Placidus・Koch・ホールサイン、ハウスの判定 |
| `src/lib/fortune/horoscope/aspects.ts`(新規) | アスペクトとオーブ |
| `src/lib/fortune/horoscope/index.ts`(新規) | 読み取り(人物像・チャート・運勢) |
| `src/lib/fortune/element-ids.ts`・`types.ts`(変更) | 早見表の項目 id、チャートの型 |
| `src/data/guide/types.ts`・`horoscope.ts`・`index.ts`(変更・新規) | 早見表(52項目)と記号の画像 |
| `src/components/guide/guide-image.tsx`(変更) | 記号の画像を表示 |
| `src/components/fortune/horoscope-chart.tsx`(新規) | チャート円・天体の表・アスペクト・切り替え |
| `src/components/fortune/natal-chart.tsx`・`natal-section.tsx`(変更) | 西洋占星術の図を出す |

テスト: `npx vitest run <path>`。lint: `npx eslint <path>`。E2E: `npx playwright test`(ポート3100。3200の dev サーバーは止めてから)。

---

### Task 1: キロンの表(取得スクリプトと生成ファイル)

**Files:**
- Create: `scripts/fetch-chiron.mjs`
- Create(生成): `src/lib/fortune/horoscope/chiron-table.ts`

- [ ] **Step 1: スクリプトを書く**

```js
// scripts/fetch-chiron.mjs
// JPL Horizons API からキロン(2060 Chiron)の地心黄経(ecliptic of date、視位置)を
// 1900-01-01〜2100-01-01 の10日刻みで取得し、src/lib/fortune/horoscope/chiron-table.ts を書き出す。
// 実行: node scripts/fetch-chiron.mjs(ビルドでは実行しない。生成したファイルをコミットする)
import { writeFileSync } from "node:fs";

const SPANS = [
  ["1900-01-01", "1950-01-01"],
  ["1950-01-11", "2000-01-01"],
  ["2000-01-11", "2050-01-01"],
  ["2050-01-11", "2100-01-01"],
];

async function fetchSpan(start, stop) {
  const params = new URLSearchParams({
    format: "text",
    COMMAND: "'DES=2060;'",
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: "'10 d'",
    QUANTITIES: "'31'",
    CSV_FORMAT: "'YES'",
  });
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`, {
    headers: { "User-Agent": "tarot-everyday chiron-table generator (static build data)" },
  });
  if (!res.ok) throw new Error(`Horizons ${res.status}`);
  const text = await res.text();
  const body = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!body) throw new Error("Horizons の出力に $$SOE がありません");
  return body
    .trim()
    .split("\n")
    .map((line) => Number(line.split(",")[3]));
}

const lons = [];
for (const [start, stop] of SPANS) {
  const part = await fetchSpan(start, stop);
  if (part.some((v) => !Number.isFinite(v))) throw new Error(`数値でない行があります: ${start}`);
  lons.push(...part);
}

const millideg = lons.map((v) => Math.round(v * 1000));
const out = `// 生成ファイル(scripts/fetch-chiron.mjs)。手で編集しない。
// Source: JPL Horizons (NASA/JPL-Caltech). 2060 Chiron, geocentric apparent ecliptic longitude of date.
/** 表の最初の日(1900-01-01 0時 UT)のユリウス日 */
export const CHIRON_START_JD = 2415020.5;
export const CHIRON_STEP_DAYS = 10;
/** 黄経(1/1000度) */
export const CHIRON_MILLIDEG: readonly number[] = [${millideg.join(",")}];
`;
writeFileSync(new URL("../src/lib/fortune/horoscope/chiron-table.ts", import.meta.url), out);
console.log(`${millideg.length} rows`);
```

CSV の列の位置(`split(",")[3]`)は Horizons の出力の見出し(`Date__(UT)__HR:MN, , , ObsEcLon, ObsEcLat,`)で確かめ、違えば合わせる。

- [ ] **Step 2: 実行して表を作る**

Run: `node scripts/fetch-chiron.mjs`
Expected: `7306 rows` 前後。`src/lib/fortune/horoscope/chiron-table.ts` ができる。2000-01-01 の行(1900-01-01 から 3652 番目 × 10日 = 36520日後)が 251560 前後(251.5604°)であることを確かめる。

- [ ] **Step 3: コミット**

```bash
git add scripts/fetch-chiron.mjs src/lib/fortune/horoscope/chiron-table.ts
git commit -m "feat: JPL Horizons からキロンの黄経の表(1900〜2100年・10日刻み)を作るスクリプトと表を追加"
```

---

### Task 2: 天体の位置

**Files:**
- Create: `src/lib/fortune/horoscope/zodiac.ts`
- Create: `src/lib/fortune/horoscope/ephemeris.ts`
- Test: `src/lib/fortune/horoscope/__tests__/ephemeris.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/horoscope/__tests__/ephemeris.test.ts
import { describe, it, expect } from "vitest";
import { bodyPosition, chironLongitude } from "../ephemeris";
import { BODIES } from "../zodiac";
import { formatDegree, signOf } from "../zodiac";

const birth = new Date(Date.UTC(1990, 2, 29, 5, 0));
const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0));

/** 360度の折り返しを考えた差 */
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("bodyPosition(Swiss Ephemeris との比較)", () => {
  it.each([
    ["sun", 8.24777, 0.02],
    ["moon", 41.61299, 0.03],
    ["mercury", 18.52027, 0.02],
    ["venus", 321.79518, 0.02],
    ["mars", 313.03284, 0.02],
    ["jupiter", 92.47263, 0.02],
    ["saturn", 294.25338, 0.02],
    ["uranus", 279.48349, 0.02],
    ["neptune", 284.4821, 0.02],
    ["pluto", 227.38624, 0.05],
    ["node", 315.05188, 0.05],
    ["lilith", 226.17984, 0.05],
    ["chiron", 100.71488, 0.02],
  ] as const)("1990-03-29 05:00 UT の %s は %f 度", (body, expected, tolerance) => {
    expect(diff(bodyPosition(body, birth)!.lon, expected)).toBeLessThan(tolerance);
  });

  it("冥王星とドラゴンヘッドは逆行、太陽は順行", () => {
    expect(bodyPosition("pluto", birth)!.retrograde).toBe(true);
    expect(bodyPosition("node", birth)!.retrograde).toBe(true);
    expect(bodyPosition("sun", birth)!.retrograde).toBe(false);
  });

  it.each([
    ["sun", 280.36892],
    ["moon", 223.32375],
    ["mars", 327.9633],
    ["jupiter", 25.25309],
    ["chiron", 251.6175],
  ] as const)("2000-01-01 12:00 UT の %s は %f 度", (body, expected) => {
    expect(diff(bodyPosition(body, j2000)!.lon, expected)).toBeLessThan(0.03);
  });

  it("キロンは表の範囲外なら null", () => {
    expect(chironLongitude(new Date(Date.UTC(1899, 0, 1)))).toBeNull();
    expect(chironLongitude(new Date(Date.UTC(2101, 0, 1)))).toBeNull();
    expect(bodyPosition("chiron", new Date(Date.UTC(2101, 0, 1)))).toBeNull();
  });

  it("BODIES は13天体", () => {
    expect(BODIES.map((b) => b.key)).toEqual([
      "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron", "lilith",
    ]);
  });
});

describe("zodiac", () => {
  it("星座と度数の表記", () => {
    expect(signOf(8.24777)).toBe(0);
    expect(signOf(359.99)).toBe(11);
    expect(formatDegree(8.24777)).toBe("8°14′");
    expect(formatDegree(41.61299)).toBe("11°36′");
    expect(formatDegree(29.9999)).toBe("29°59′");
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/horoscope`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/horoscope/zodiac.ts
import { mod } from "../local-date";

/** 十二星座(0 = 牡羊座 … 11 = 魚座)。key は早見表の id と記号の名前に使う */
export const SIGNS = [
  { key: "aries", name: "牡羊座" },
  { key: "taurus", name: "牡牛座" },
  { key: "gemini", name: "双子座" },
  { key: "cancer", name: "蟹座" },
  { key: "leo", name: "獅子座" },
  { key: "virgo", name: "乙女座" },
  { key: "libra", name: "天秤座" },
  { key: "scorpio", name: "蠍座" },
  { key: "sagittarius", name: "射手座" },
  { key: "capricorn", name: "山羊座" },
  { key: "aquarius", name: "水瓶座" },
  { key: "pisces", name: "魚座" },
] as const;

export type SignKey = (typeof SIGNS)[number]["key"];

/** 天体(表示の順)。key は早見表の id と記号の名前に使う */
export const BODIES = [
  { key: "sun", name: "太陽" },
  { key: "moon", name: "月" },
  { key: "mercury", name: "水星" },
  { key: "venus", name: "金星" },
  { key: "mars", name: "火星" },
  { key: "jupiter", name: "木星" },
  { key: "saturn", name: "土星" },
  { key: "uranus", name: "天王星" },
  { key: "neptune", name: "海王星" },
  { key: "pluto", name: "冥王星" },
  { key: "node", name: "ドラゴンヘッド" },
  { key: "chiron", name: "キロン" },
  { key: "lilith", name: "リリス" },
] as const;

export type BodyKey = (typeof BODIES)[number]["key"];

export const signOf = (lon: number) => Math.floor(mod(lon, 360) / 30);

/** 星座の中の度数。例: 8°14′(分は切り捨て) */
export function formatDegree(lon: number): string {
  const inSign = mod(lon, 30);
  const deg = Math.floor(inSign);
  const min = Math.floor((inSign - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′`;
}
```

```ts
// src/lib/fortune/horoscope/ephemeris.ts
import {
  Body,
  GeoMoon,
  GeoMoonState,
  GeoVector,
  MakeTime,
  Rotation_EQJ_ECT,
  RotateVector,
  SphereFromVector,
  type Vector,
} from "astronomy-engine";
import { mod } from "../local-date";
import { CHIRON_MILLIDEG, CHIRON_START_JD, CHIRON_STEP_DAYS } from "./chiron-table";
import type { BodyKey } from "./zodiac";

const PLANETS: Partial<Record<BodyKey, Body>> = {
  sun: Body.Sun,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

/** J2000 赤道座標のベクトルを、その日の真の黄道座標の黄経(度)にする */
function eclipticLongitudeOfDate(vec: Vector, at: Date): number {
  const ect = RotateVector(Rotation_EQJ_ECT(MakeTime(at)), vec);
  return SphereFromVector(ect).lon;
}

/** 真のドラゴンヘッド: 月の位置と速度から求めた接触軌道の昇交点 */
function trueNode(at: Date): number {
  const state = GeoMoonState(at);
  const rot = Rotation_EQJ_ECT(MakeTime(at));
  const r = RotateVector(rot, { x: state.x, y: state.y, z: state.z, t: state.t } as Vector);
  const v = RotateVector(rot, { x: state.vx, y: state.vy, z: state.vz, t: state.t } as Vector);
  // 角運動量 h = r × v。昇交点の方向は (hx, hy) に直交する
  const hx = r.y * v.z - r.z * v.y;
  const hy = r.z * v.x - r.x * v.z;
  return mod((Math.atan2(hx, -hy) * 180) / Math.PI, 360);
}

/** 平均リリス(月の平均遠地点)。Meeus『Astronomical Algorithms』47章の月の平均近地点 + 180度 */
function meanLilith(at: Date): number {
  const T = MakeTime(at).tt / 36525;
  return mod(263.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T ** 4) / 18999000, 360);
}

/** キロンの黄経(表の4点ラグランジュ補間)。表の範囲外は null */
export function chironLongitude(at: Date): number | null {
  const jd = at.getTime() / 86_400_000 + 2440587.5;
  const x = (jd - CHIRON_START_JD) / CHIRON_STEP_DAYS;
  const i = Math.floor(x) - 1;
  if (i < 0 || i + 3 >= CHIRON_MILLIDEG.length) return null;
  // 360度の折り返しをまたがないように、最初の点の近くへそろえる
  const base = CHIRON_MILLIDEG[i] / 1000;
  const ys = [0, 1, 2, 3].map((k) => base + (((CHIRON_MILLIDEG[i + k] / 1000 - base + 540) % 360) - 180));
  const t = x - i;
  let sum = 0;
  for (let k = 0; k < 4; k++) {
    let w = 1;
    for (let m = 0; m < 4; m++) if (m !== k) w *= (t - m) / (k - m);
    sum += w * ys[k];
  }
  return mod(sum, 360);
}

function longitudeAt(body: BodyKey, at: Date): number | null {
  if (body === "moon") return eclipticLongitudeOfDate(GeoMoon(at), at);
  if (body === "node") return trueNode(at);
  if (body === "lilith") return meanLilith(at);
  if (body === "chiron") return chironLongitude(at);
  return eclipticLongitudeOfDate(GeoVector(PLANETS[body]!, at, true), at);
}

export interface BodyPosition {
  /** 黄経(度) */
  lon: number;
  /** 1日あたりの黄経の変化がマイナス */
  retrograde: boolean;
}

/** 天体の視黄経(その日の真の黄道)と逆行。キロンが表の範囲外なら null */
export function bodyPosition(body: BodyKey, at: Date): BodyPosition | null {
  const lon = longitudeAt(body, at);
  if (lon === null) return null;
  const before = longitudeAt(body, new Date(at.getTime() - 43_200_000));
  const after = longitudeAt(body, new Date(at.getTime() + 43_200_000));
  if (before === null || after === null) return null;
  const speed = ((after - before + 540) % 360) - 180;
  return { lon, retrograde: speed < 0 };
}
```

実装の注意:
- `Rotation_EQJ_ECT`・`GeoMoonState` などの名前と引数は `node_modules/astronomy-engine/astronomy.d.ts` で確かめる。`GeoMoonState` の戻り値の形(`x, y, z, vx, vy, vz, t`)も確かめる。
- 真のドラゴンヘッドの式の符号は、テスト(315.05度)で確かめる。合わなければ `Math.atan2(hx, -hy)` を `Math.atan2(-hx, hy)` にする(昇交点と降交点の取り違えは 180度ずれる)。
- 月の黄経がテストの許容(0.03度)に入らない場合、`GeoMoon` が光差を含まないことによる(約0.0002度で問題にならない)以外の原因を調べて報告する。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/horoscope && npx eslint src/lib/fortune/horoscope && npx tsc --noEmit -p .`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/horoscope
git commit -m "feat: 天体の黄経・逆行と、真のドラゴンヘッド・平均リリス・キロンの位置の計算を追加"
```

---

### Task 3: ハウスとアスペクト

**Files:**
- Create: `src/lib/fortune/horoscope/houses.ts`
- Create: `src/lib/fortune/horoscope/aspects.ts`
- Test: `src/lib/fortune/horoscope/__tests__/houses.test.ts`
- Test: `src/lib/fortune/horoscope/__tests__/aspects.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/horoscope/__tests__/houses.test.ts
import { describe, it, expect } from "vitest";
import { angles, cusps, houseOf } from "../houses";

const birth = new Date(Date.UTC(1990, 2, 29, 5, 0));
const tokyo = { lat: 35.69, lon: 139.69 };
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("angles", () => {
  it("ASC と MC(Swiss Ephemeris との比較)", () => {
    const a = angles(birth, tokyo);
    expect(diff(a.asc, 139.65546)).toBeLessThan(0.05);
    expect(diff(a.mc, 43.48916)).toBeLessThan(0.05);
  });
});

describe("cusps", () => {
  it.each([
    ["placidus", [162.92729, 190.87885, 77.9672, 110.53274]],
    ["koch", [167.51863, 195.68153, 81.81378, 111.91252]],
  ] as const)("%s の2・3・11・12室", (system, [c2, c3, c11, c12]) => {
    const c = cusps(system, birth, tokyo);
    expect(c).toHaveLength(12);
    expect(diff(c[0], 139.65546)).toBeLessThan(0.05);
    expect(diff(c[9], 43.48916)).toBeLessThan(0.05);
    expect(diff(c[1], c2)).toBeLessThan(0.05);
    expect(diff(c[2], c3)).toBeLessThan(0.05);
    expect(diff(c[10], c11)).toBeLessThan(0.05);
    expect(diff(c[11], c12)).toBeLessThan(0.05);
    for (let i = 0; i < 6; i++) expect(diff(c[i + 6], c[i] + 180)).toBeLessThan(1e-9);
  });

  it("ホールサインは ASC の星座の0度から30度ずつ", () => {
    expect(cusps("whole", birth, tokyo)).toEqual([120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90]);
  });
});

describe("houseOf", () => {
  it("カスプの間にある天体のハウス(1始まり)", () => {
    const c = cusps("placidus", birth, tokyo);
    expect(houseOf(8.24777, c)).toBe(8); // 太陽
    expect(houseOf(41.61299, c)).toBe(9); // 月
    expect(houseOf(139.7, c)).toBe(1);
    expect(houseOf(139.6, c)).toBe(12);
  });
});
```

```ts
// src/lib/fortune/horoscope/__tests__/aspects.test.ts
import { describe, it, expect } from "vitest";
import { ASPECTS, findAspects } from "../aspects";

describe("findAspects", () => {
  it("オーブの中にある角度だけを、近い順ではなく点の順に返すこと", () => {
    const points = [
      { key: "sun", lon: 0 },
      { key: "moon", lon: 125 }, // 太陽とトライン(オーブ5、太陽・月を含むので8まで)
      { key: "mars", lon: 186 }, // 太陽とオポジション(6、10まで)、月と 61 度でセクスタイル(1、6まで)
      { key: "venus", lon: 46 }, // 太陽とセミスクエア(1、マイナー2まで)
    ];
    const result = findAspects(points);
    expect(result.map((a) => [a.a, a.b, a.kind, Math.round(a.orb * 10) / 10])).toEqual([
      ["sun", "moon", "trine", 5],
      ["sun", "mars", "opposition", 6],
      ["sun", "venus", "semisquare", 1],
      ["moon", "mars", "sextile", 1],
    ]);
    expect(result.find((a) => a.kind === "semisquare")?.minor).toBe(true);
  });

  it("太陽・月を含まない組はオーブを狭くすること", () => {
    expect(findAspects([{ key: "mars", lon: 0 }, { key: "jupiter", lon: 127 }])).toEqual([]); // トライン 7 > 6
    expect(findAspects([{ key: "sun", lon: 0 }, { key: "jupiter", lon: 127 }])).toHaveLength(1); // 7 <= 8
  });

  it("感受点を含む組は主要5種・オーブ3だけ", () => {
    expect(findAspects([{ key: "node", lon: 0 }, { key: "sun", lon: 4 }])).toEqual([]);
    expect(findAspects([{ key: "asc", lon: 0 }, { key: "sun", lon: 92 }]).map((a) => a.kind)).toEqual(["square"]);
    expect(findAspects([{ key: "mc", lon: 0 }, { key: "sun", lon: 150 }])).toEqual([]);
  });

  it("アスペクトは11種", () => {
    expect(ASPECTS.map((a) => [a.kind, a.angle])).toEqual([
      ["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180], ["quincunx", 150],
      ["semisextile", 30], ["semisquare", 45], ["quintile", 72], ["sesquiquadrate", 135], ["biquintile", 144],
    ]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/horoscope`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/horoscope/houses.ts
import { MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import { mod } from "../local-date";

export type HouseSystem = "placidus" | "koch" | "whole";
export const HOUSE_SYSTEMS: readonly HouseSystem[] = ["placidus", "koch", "whole"];
export const HOUSE_SYSTEM_NAMES: Record<HouseSystem, string> = { placidus: "プラシーダス", koch: "コッホ", whole: "ホールサイン" };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

interface Sky {
  /** 地方恒星時(度) */
  ramc: number;
  /** 真の黄道傾斜角(度) */
  eps: number;
  /** 緯度(度) */
  lat: number;
}

function skyAt(at: Date, place: { lat: number; lon: number }): Sky {
  return { ramc: mod(SiderealTime(at) * 15 + place.lon, 360), eps: e_tilt(MakeTime(at)).tobl, lat: place.lat };
}

/** 東の地平線の赤経が x 度のときに昇る黄経(x = RAMC + 90 で ASC) */
function ascendantFor(x: number, sky: Sky): number {
  return mod(deg(Math.atan2(Math.sin(rad(x)), Math.cos(rad(x)) * Math.cos(rad(sky.eps)) - Math.tan(rad(sky.lat)) * Math.sin(rad(sky.eps)))), 360);
}

/** 赤経 ra(度)の黄道上の点の黄経 */
const eclipticOfRa = (ra: number, sky: Sky) =>
  mod(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(sky.eps)) * Math.cos(rad(ra)))), 360);

export function angles(at: Date, place: { lat: number; lon: number }): { asc: number; mc: number } {
  const sky = skyAt(at, place);
  return { asc: ascendantFor(sky.ramc + 90, sky), mc: eclipticOfRa(sky.ramc, sky) };
}

/** Placidus の中間カスプ。fraction は半昼弧(または半夜弧)を何分割した位置か */
function placidusCusp(sky: Sky, above: boolean, fraction: number): number {
  const tanEps = Math.tan(rad(sky.eps));
  const tanLat = Math.tan(rad(sky.lat));
  // 初期値: 11室 RAMC + 30、12室 RAMC + 60、2室 RAMC + 120、3室 RAMC + 150(反復で収束する)
  let ra = sky.ramc + (above ? (fraction < 0.5 ? 30 : 60) : fraction < 0.5 ? 150 : 120);
  for (let i = 0; i < 50; i++) {
    const tanDec = tanEps * Math.sin(rad(ra));
    const next = above
      ? sky.ramc + deg(Math.acos(-tanLat * tanDec)) * fraction
      : sky.ramc + 180 - deg(Math.acos(tanLat * tanDec)) * fraction;
    if (Math.abs(next - ra) < 1e-9) break;
    ra = next;
  }
  return eclipticOfRa(ra, sky);
}

/** 12室のカスプ(黄経、1室から順に)。4〜9室は反対側 */
export function cusps(system: HouseSystem, at: Date, place: { lat: number; lon: number }): number[] {
  const sky = skyAt(at, place);
  const asc = ascendantFor(sky.ramc + 90, sky);
  const mc = eclipticOfRa(sky.ramc, sky);
  let c11: number, c12: number, c2: number, c3: number;
  if (system === "whole") {
    const first = Math.floor(asc / 30) * 30;
    return Array.from({ length: 12 }, (_, i) => mod(first + i * 30, 360));
  }
  if (system === "placidus") {
    c11 = placidusCusp(sky, true, 1 / 3);
    c12 = placidusCusp(sky, true, 2 / 3);
    c2 = placidusCusp(sky, false, 2 / 3);
    c3 = placidusCusp(sky, false, 1 / 3);
  } else {
    // Koch(Swiss Ephemeris の swehouse.c と同じ式)
    const sinA = Math.min(1, Math.sin(rad(mc)) * Math.sin(rad(sky.eps)) / Math.cos(rad(sky.lat)));
    const cosA = Math.sqrt(1 - sinA * sinA);
    const c = deg(Math.atan(Math.tan(rad(sky.lat)) / cosA));
    const ad3 = deg(Math.asin(Math.sin(rad(c)) * sinA)) / 3;
    c11 = ascendantFor(sky.ramc + 30 - 2 * ad3, sky);
    c12 = ascendantFor(sky.ramc + 60 - ad3, sky);
    c2 = ascendantFor(sky.ramc + 120 + ad3, sky);
    c3 = ascendantFor(sky.ramc + 150 + 2 * ad3, sky);
  }
  const first = [asc, c2, c3, mod(mc + 180, 360), mod(c11 + 180, 360), mod(c12 + 180, 360)];
  return [...first, ...first.map((v) => mod(v + 180, 360))];
}

/** 黄経 lon が入るハウス(1〜12) */
export function houseOf(lon: number, cuspList: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cuspList[i];
    const width = mod(cuspList[(i + 1) % 12] - start, 360);
    if (mod(lon - start, 360) < width) return i + 1;
  }
  return 12;
}
```

実装の注意:
- Koch の `ascendantFor(x)` は「東の地平線の赤経が x のときに昇る黄経」。swehouse.c の `Asc1(th + 30 - 2 * ad3, …)` は `th`(= RAMC)から 90 度ずらした値を渡している可能性があるので、テスト(11室 81.81°)が通る向きを確かめる。合わなければ `ascendantFor(sky.ramc + 90 + 30 - 2 * ad3 - 90 …)` のように 90 度の扱いを見直す。

```ts
// src/lib/fortune/horoscope/aspects.ts
export type AspectKind =
  | "conjunction" | "sextile" | "square" | "trine" | "opposition" | "quincunx"
  | "semisextile" | "semisquare" | "quintile" | "sesquiquadrate" | "biquintile";

/** アスペクト。minor はマイナーアスペクト(画面の切り替えで表示)。orb は [太陽・月を含む, 含まない] */
export const ASPECTS: readonly { kind: AspectKind; name: string; angle: number; minor: boolean; orb: [number, number] }[] = [
  { kind: "conjunction", name: "コンジャンクション", angle: 0, minor: false, orb: [10, 8] },
  { kind: "sextile", name: "セクスタイル", angle: 60, minor: false, orb: [6, 4] },
  { kind: "square", name: "スクエア", angle: 90, minor: false, orb: [8, 6] },
  { kind: "trine", name: "トライン", angle: 120, minor: false, orb: [8, 6] },
  { kind: "opposition", name: "オポジション", angle: 180, minor: false, orb: [10, 8] },
  { kind: "quincunx", name: "クインカンクス", angle: 150, minor: false, orb: [3, 3] },
  { kind: "semisextile", name: "セミセクスタイル", angle: 30, minor: true, orb: [2, 2] },
  { kind: "semisquare", name: "セミスクエア", angle: 45, minor: true, orb: [2, 2] },
  { kind: "quintile", name: "クインタイル", angle: 72, minor: true, orb: [2, 2] },
  { kind: "sesquiquadrate", name: "セスキコードレート", angle: 135, minor: true, orb: [2, 2] },
  { kind: "biquintile", name: "バイクインタイル", angle: 144, minor: true, orb: [2, 2] },
];

const MAJOR5 = new Set<AspectKind>(["conjunction", "sextile", "square", "trine", "opposition"]);
const LUMINARIES = new Set(["sun", "moon"]);
/** 感受点(主要5種・オーブ3だけ) */
const SENSITIVE = new Set(["node", "chiron", "lilith", "asc", "mc"]);

export interface Aspect {
  a: string;
  b: string;
  kind: AspectKind;
  /** 正確な角度からのずれ(度) */
  orb: number;
  minor: boolean;
}

/** 点の組ごとに、オーブの中で最も近いアスペクトを1つ返す(点の並びの順) */
export function findAspects(points: { key: string; lon: number }[]): Aspect[] {
  const result: Aspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i];
      const q = points[j];
      const sep = Math.abs(((q.lon - p.lon + 540) % 360) - 180);
      const sensitive = SENSITIVE.has(p.key) || SENSITIVE.has(q.key);
      const luminary = LUMINARIES.has(p.key) || LUMINARIES.has(q.key);
      let best: Aspect | null = null;
      for (const asp of ASPECTS) {
        if (sensitive && !MAJOR5.has(asp.kind)) continue;
        const limit = sensitive ? 3 : asp.orb[luminary ? 0 : 1];
        const orb = Math.abs(sep - asp.angle);
        if (orb <= limit && (!best || orb < best.orb)) best = { a: p.key, b: q.key, kind: asp.kind, orb, minor: asp.minor };
      }
      if (best) result.push(best);
    }
  }
  return result;
}
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/horoscope && npx eslint src/lib/fortune/horoscope && npx tsc --noEmit -p .`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/fortune/horoscope
git commit -m "feat: ASC・MC と Placidus・Koch・ホールサインのハウス、アスペクトとオーブの計算を追加"
```

---

### Task 4: 早見表の項目 id・チャートの型・記号の画像

**Files:**
- Modify: `src/lib/fortune/element-ids.ts`、`src/lib/fortune/__tests__/element-ids.test.ts`
- Modify: `src/lib/fortune/types.ts`
- Modify: `src/data/guide/types.ts`、`src/components/guide/guide-image.tsx`
- Test: `src/components/guide/__tests__/guide-components.test.tsx`(追記)

- [ ] **Step 1: id と型**

`element-ids.ts`(`const range` の前):

```ts
/** 西洋占星術の十二星座・天体・ハウス(1〜12)・アスペクト・エレメント */
export const signId = (key: string) => `sign-${key}`;
export const bodyId = (key: string) => `body-${key}`;
export const houseId = (n: number) => `house-${n}`;
export const aspectId = (kind: string) => `aspect-${kind}`;
export type AstroElement = "fire" | "earth" | "air" | "water";
export const ASTRO_ELEMENTS: readonly AstroElement[] = ["fire", "earth", "air", "water"];
export const astroElementId = (e: AstroElement) => `element-${e}`;
```

`ElementSystemId` に `"horoscope"`、`ELEMENT_IDS` に(星座・天体・アスペクトの key は `horoscope/zodiac.ts`・`aspects.ts` の順と同じ):

```ts
  horoscope: [
    ...["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"].map(signId),
    ...["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron", "lilith"].map(bodyId),
    ...range(1, 12).map(houseId),
    ...["conjunction", "sextile", "square", "trine", "opposition", "quincunx", "semisextile", "semisquare", "quintile", "sesquiquadrate", "biquintile"].map(aspectId),
    ...ASTRO_ELEMENTS.map(astroElementId),
  ],
```

`element-ids.test.ts` に `expect(ELEMENT_IDS.horoscope).toHaveLength(12 + 13 + 12 + 11 + 4);` と `toContain("sign-aries")`・`toContain("body-lilith")`・`toContain("house-12")`・`toContain("aspect-biquintile")`・`toContain("element-water")`。

`types.ts` の `NatalChart` に3つ目を足す:

```ts
  | {
      /** 西洋占星術のホロスコープ。houses と cusps はハウスシステムごと */
      kind: "horoscope";
      bodies: {
        key: string;
        name: string;
        lon: number;
        retrograde: boolean;
        houses: Record<"placidus" | "koch" | "whole", number>;
        fact: Fact;
      }[];
      asc: number;
      mc: number;
      cusps: Record<"placidus" | "koch" | "whole", number[]>;
      aspects: { a: string; b: string; kind: string; name: string; orb: number; minor: boolean }[];
      /** 例: 出生時刻不明のため正午で仮計算 / 出生地未入力のため明石基準 */
      notes: string[];
      factKeys: string[];
    };
```

- [ ] **Step 2: 記号の画像**

`src/data/guide/types.ts`:

```ts
import type { AstroGlyphName } from "@/components/icons/astro-glyph";
```

`GuideImage` に `| { kind: "astro"; name: AstroGlyphName; color?: string }` を足し、`GuideSystemId` に `"horoscope"` を足す。

`guide-image.tsx` の `GuideImageView` の先頭に:

```tsx
  if (image.kind === "astro") {
    const px = { tile: 34, sheet: 64, detail: 140 }[size];
    return <AstroGlyph name={image.name} size={px} strokeWidth={size === "tile" ? 1.6 : 1.3} className="text-gold-light" />;
  }
```

(色は `image.color` があれば `style={{ color }}`。`AstroGlyph` が `className`/`style` を受け取れるか確かめ、受け取れなければ外側の `<span style>` で色を付ける)。

テスト(`guide-components.test.tsx` などの既存の GuideImageView のテストに合わせて):

```tsx
  it("記号の画像は SVG で描くこと", () => {
    const { container } = render(<GuideImageView image={{ kind: "astro", name: "aries" }} size="tile" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toBe("");
  });
```

既存の辞書のテスト `entries.test.ts` の `expect(e.image.kind).toBe("glyph")` は、`horoscope` だけ `"astro"` も許すように、`expect(["glyph", ...(system === "horoscope" ? ["astro"] : [])]).toContain(e.image.kind)` にする(Task 7 で horoscope を cases に足すとき)。

- [ ] **Step 3: テスト・型チェック**

Run: `npx vitest run src/lib/fortune src/components/guide && npx tsc --noEmit -p . && npx eslint src`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/lib/fortune/element-ids.ts src/lib/fortune/__tests__/element-ids.test.ts src/lib/fortune/types.ts src/data/guide/types.ts src/components/guide
git commit -m "feat: 西洋占星術の早見表の項目 id とホロスコープの型、記号の画像を追加"
```

---

### Task 5: 西洋占星術の読み取り

**Files:**
- Create: `src/lib/fortune/horoscope/index.ts`
- Test: `src/lib/fortune/horoscope/__tests__/horoscope.test.ts`

仕様:

- **計算に使う瞬間(代表の時刻):** 時刻を指定したときはその時の xx:30、午前 6:00、午後 18:00、不明 12:00(日本時間。`tokyoToUtc` で UTC にする。サマータイムも `tokyoToUtc` が扱う)。ASC・MC・カスプ・ハウス・アスペクトはこの瞬間で計算する。
- **星座の候補:** 各天体の星座を出生時刻の範囲(`moment.range`)で判定する。境界は「範囲を30分ごとに区切って星座が変わる区間を見つけ、二分法で1分まで詰めた時刻」。`resolveOverRange(moment.range, boundaries, (at) => signOf(lon), (a, b) => a === b)` の形で天体ごとに解く(月以外はふつう確定)。
- **ASC の候補:** 時刻を指定したときだけ、その1時間の範囲で ASC の星座を同じ方法で解く(候補は最大2つ)。不明・午前午後のときは代表の時刻で確定し、注記を付ける。
- **人物像(`natal`)の順と key:** `sun`(太陽星座)、`moon`(月星座)、`asc`(ASC)、`mc`(MC)、`mercury`〜`pluto`・`node`・`chiron`・`lilith`(値は星座名。キロンが表の範囲外なら事実ごと出さない)、`positions`(天体の位置。プロンプト用の要約「太陽 牡羊座8°14′(第8ハウス)、月 …、ASC 獅子座19°39′、MC 牡牛座13°29′」。Placidus。参照なし。candidates なし)、`aspects`(主なアスペクト。主要5種+クインカンクスを「太陽-月 トライン(2.1°)、…」。参照なし)。最初の3つ(太陽・月・ASC)はタイルになり、残りは図(`factKeys`)に入れて一覧に重ねない。
  - 値の例: `{ key: "sun", label: "太陽星座", value: "牡羊座", refs: [sign-aries, body-sun] }`。ASC のラベルは「ASC」、参照は星座のみ。
- **チャート(`chart.kind = "horoscope"`):** bodies(13天体。`fact` は人物像の事実と同じもの)、asc、mc、cusps(3方式)、aspects(全11種。`minor` 付き。点は13天体+ASC+MC)、notes(時刻の仮計算・明石基準の注記。該当するものだけ)、factKeys(`mc`・`mercury`〜`lilith`・`positions`・`aspects`)。
- **運勢:**
  - 今日: その日の正午(日本時間)の月の黄経。見出し「今日の月は{星座}。あなたの第{n}ハウスを通過」、参照は `house-n`。チップ `moon-sign`(今日の月。参照は星座)、`moon-house`(月のハウス「第n ハウス」。参照はハウス)。その日のうちに月の星座が変わるときは、`moon-sign` の値を「蟹座→獅子座(15:20〜)」にする。期間は今日。
  - 今月: 暦の月の1日0時〜翌月1日0時(日本時間)の新月・満月(`SearchMoonPhase(0 / 180, …)`)。見出しは最初の新月で「今月の新月は10/11、天秤座。あなたの第{n}ハウスで迎える」、参照は `house-n`。チップ `new-moon`(新月「10/11 天秤座・第5ハウス」)、`full-moon`(満月、同じ形)、`mars`(火星「{星座}・第nハウス」。15日正午)。期間は「2026/10/1〜2026/10/31」。新月・満月が月に2回あるときは日付を「・」でつなぐ。
  - 今年: 暦の年(1/1〜12/31)。今日の正午の木星・土星の星座とハウス。見出し「今年の木星はあなたの第{n}ハウスを運行」、参照は `house-n`。チップ `jupiter`・`saturn`(「{星座}・第nハウス」。その年のうちに星座が変わるときは「双子座→蟹座(6/30〜)・第nハウス」。変わる日は1日ごとに調べて最初に変わった日。逆行で戻る場合は最初の変化だけ書く)。期間は「2026/1/1〜2026/12/31」。
  - 運勢のハウスは本命の Placidus のカスプ。
- **method:** 「トロピカル。地心の視黄経(その日の真の黄道)。天体は10天体+ドラゴンヘッド(真)・キロン(JPL Horizons の表)・リリス(平均)。ハウスは Placidus(Koch・ホールサインに切り替え可)。出生時刻が不明・午前午後のときは正午・6時・18時で仮計算。アスペクトは主要5種+150度(マイナーは30・45・72・135・144度)。オーブは太陽・月を含む組で 0・180度 10、90・120度 8、60度 6、150度 3、マイナー 2、含まない組は 2 ずつ狭い(150度とマイナーは同じ)。感受点は主要5種・オーブ3」

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/horoscope/__tests__/horoscope.test.ts
import { describe, it, expect } from "vitest";
import { EclipticGeoMoon } from "astronomy-engine";
import { toBirthMoment } from "../../birth-moment";
import { tokyoToUtc } from "../../tokyo-time";
import type { BirthProfile } from "../../types";
import { horoscope } from "../index";
import { SIGNS, signOf } from "../zodiac";

const today = { year: 2026, month: 10, day: 14 };
const tokyo14: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };
const read = (p: BirthProfile, t = today) => horoscope.read(p, toBirthMoment(p), t);
const fact = (r: ReturnType<typeof read>, key: string) => r.natal.find((f) => f.key === key);

describe("horoscope.read 人物像", () => {
  it("太陽・月・ASC を最初の3つにすること", () => {
    const r = read(tokyo14);
    expect(r.id).toBe("horoscope");
    expect(r.natal.slice(0, 3).map((f) => [f.key, f.label, f.value])).toEqual([
      ["sun", "太陽星座", "牡羊座"],
      ["moon", "月星座", "牡牛座"],
      ["asc", "ASC", "獅子座"],
    ]);
    expect(fact(r, "sun")?.refs).toEqual([
      { system: "horoscope", id: "sign-aries" },
      { system: "horoscope", id: "body-sun" },
    ]);
    expect(fact(r, "pluto")?.value).toBe("蠍座");
  });

  it("天体の位置の要約(Placidus のハウス)", () => {
    // 代表の時刻は 14:30 なので、太陽・月の度数は 14:00 の値より少し進む
    expect(fact(read(tokyo14), "positions")?.value).toMatch(/^太陽 牡羊座8°\d\d′\(第8ハウス\)、月 牡牛座1\d°\d\d′\(第9ハウス\)、/);
  });

  it("チャートを返すこと", () => {
    const r = read(tokyo14);
    if (r.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(r.chart.bodies.map((b) => b.key)).toHaveLength(13);
    expect(Object.keys(r.chart.cusps)).toEqual(["placidus", "koch", "whole"]);
    expect(r.chart.cusps.whole[0]).toBe(120);
    expect(r.chart.notes).toEqual([]);
    expect(r.chart.factKeys).toContain("positions");
    expect(r.chart.factKeys).not.toContain("sun");
    expect(r.chart.aspects.length).toBeGreaterThan(0);
  });

  it("時刻不明は正午で仮計算し、出生地未入力は明石基準と注記すること", () => {
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } });
    if (r.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(r.chart.notes).toEqual(["出生時刻不明のため正午で仮計算", "出生地未入力のため明石基準"]);
    expect(fact(r, "asc")?.candidates).toBeUndefined();
  });

  it("午前・午後は 6時・18時で仮計算すること", () => {
    const r = read({ ...tokyo14, time: { kind: "half", half: "pm" } });
    if (r.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    expect(r.chart.notes).toEqual(["出生時刻が午後のため18時で仮計算"]);
  });

  it("その日のうちに月の星座が変わるなら、時刻不明では月星座を候補にすること", () => {
    // 1990/3/30 は月が牡牛座から双子座へ移る日(下の検算で確かめる)
    const at = (h: number) => signOf(EclipticGeoMoon(tokyoToUtc(1990, 3, 30, h, 0)).lon);
    expect(at(0)).not.toBe(at(23));
    const r = read({ version: 1, date: { year: 1990, month: 3, day: 30 }, time: { kind: "unknown" } });
    expect(fact(r, "moon")?.candidates?.map((c) => c.value)).toEqual([SIGNS[at(0)].name, SIGNS[at(23)].name]);
  });
});

describe("horoscope.read 運勢", () => {
  it("今日は正午の月の星座とハウス", () => {
    const day = read(tokyo14).periods.day;
    const sign = SIGNS[signOf(EclipticGeoMoon(tokyoToUtc(2026, 10, 14, 12, 0)).lon)].name;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline.text).toMatch(new RegExp(`^今日の月は${sign}。あなたの第\\d+ハウスを通過$`));
    expect(day.chips.map((c) => c.key)).toEqual(["moon-sign", "moon-house"]);
  });

  it("今月は新月・満月と火星", () => {
    const month = read(tokyo14).periods.month;
    expect(month.rangeLabel).toBe("2026/10/1〜2026/10/31");
    expect(month.headline.text).toMatch(/^今月の新月は10\/1[01]、.+座。あなたの第\d+ハウスで迎える$/);
    expect(month.chips.map((c) => c.key)).toEqual(["new-moon", "full-moon", "mars"]);
  });

  it("今年は木星と土星", () => {
    const year = read(tokyo14).periods.year;
    expect(year.rangeLabel).toBe("2026/1/1〜2026/12/31");
    expect(year.headline.text).toMatch(/^今年の木星はあなたの第\d+ハウスを運行$/);
    expect(year.chips.map((c) => c.key)).toEqual(["jupiter", "saturn"]);
    // 2026年は木星が蟹座から獅子座へ移る年
    expect(year.chips[0].value).toMatch(/^蟹座→獅子座\(\d+\/\d+〜\)・第\d+ハウス$/);
  });
});
```

注: 「1990/3/30 は月が星座を移る日」は、テストの最初の `expect(at(0)).not.toBe(at(23))` で確かめる。成り立たなければ、`EclipticGeoMoon` で月が星座を移る日を探してその日に替え、報告する。「2026年に木星が蟹座→獅子座」も同様に、実際の値(2026年6月ごろ)で確かめ、違えば合わせて報告する。2026年10月の新月は 10/11(日本時間)前後。

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npx vitest run src/lib/fortune/horoscope/__tests__/horoscope.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

`src/lib/fortune/horoscope/index.ts` に `export const horoscope: FortuneSystemModule = { id: "horoscope", name: "西洋占星術", nameEn: "Horoscope", read(...) }` を、上の仕様どおりに書く。既存の `src/lib/fortune/sanmei/index.ts`・`shichu/index.ts` の書き方(`resolveOverRange`・`resolvedFact`・`PERIOD_WORD`)に合わせる。星座が変わる時刻を探す処理は `signChangesWithin(range, lonAt)`(30分刻み+二分法で1分まで)として同じファイルに置き、テストを足す:

```ts
describe("signChangesWithin", () => {
  it("星座が変わる時刻を1分の精度で返すこと", () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const end = new Date(Date.UTC(2026, 0, 2));
    // 1日に 30 度ずつ進む仮の天体は、0時から 24時間で 30度を1回またぐ
    const lonAt = (at: Date) => 15 + ((at.getTime() - start.getTime()) / 86_400_000) * 30;
    const [b] = signChangesWithin({ start, end }, lonAt);
    expect(Math.abs(b.getTime() - Date.UTC(2026, 0, 1, 12))).toBeLessThanOrEqual(60_000);
  });
});
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx vitest run src/lib/fortune/horoscope && npx eslint src/lib/fortune/horoscope && npx tsc --noEmit -p .`
Expected: PASS

- [ ] **Step 5: 計算時間を確かめる**

`readAll` 相当(`horoscope.read` 1回)が 50ms 以内か、テストで `performance.now()` を測って確かめる(超えるなら、星座の候補の判定を「範囲の両端で星座が同じ天体は飛ばす」にして減らす)。

- [ ] **Step 6: コミット**

```bash
git add src/lib/fortune/horoscope
git commit -m "feat: 西洋占星術の人物像(天体・ASC・ハウス・アスペクト)と今日・今月・今年の運勢を追加"
```

---

### Task 6: 早見表の辞書(西洋占星術 52項目)

**Files:**
- Create: `src/data/guide/horoscope.ts`

形は `src/data/guide/sanmei.ts` に合わせる(`export const horoscopeEntries: GuideEntry[]`)。文章はすべてオリジナル。決まりは既存の辞書と同じ(keywords 3〜5語・各8文字以内、summary 全角換算80〜160、reading ひらがな、絵文字・記号の文字なし、related は実在 id)。

| グループ | id | 名前 | 読み | 画像 |
|---|---|---|---|---|
| 十二星座 | sign-aries … sign-pisces | 牡羊座 … 魚座 | おひつじざ おうしざ ふたござ かにざ ししざ おとめざ てんびんざ さそりざ いてざ やぎざ みずがめざ うおざ | `{ kind: "astro", name: "aries" }` … |
| 天体 | body-sun … body-lilith | 太陽 月 水星 金星 火星 木星 土星 天王星 海王星 冥王星 ドラゴンヘッド キロン リリス | たいよう つき すいせい きんせい かせい もくせい どせい てんのうせい かいおうせい めいおうせい どらごんへっど きろん りりす | `{ kind: "astro", name: "sun" }` … |
| ハウス | house-1 … house-12 | 第1ハウス … 第12ハウス | だいいちはうす … だいじゅうにはうす | `{ kind: "glyph", text: "第1\nハウス" }` |
| アスペクト | aspect-conjunction … aspect-biquintile(順は aspects.ts の ASPECTS) | コンジャンクション セクスタイル スクエア トライン オポジション クインカンクス セミセクスタイル セミスクエア クインタイル セスキコードレート バイクインタイル | こんじゃんくしょん … | `{ kind: "glyph", text: "0°" }`(角度) |
| エレメント | element-fire element-earth element-air element-water | 火 地 風 水 | ひ ち かぜ みず | `{ kind: "glyph", text: "火", color: "#C75B39" }`(地 `#B89A5A`、風 `#8FB8A0`、水 `#6F9AB8`) |

- `nameEn`: 星座(Aries …)、天体(Sun … North Node / Chiron / Black Moon Lilith)、アスペクト(Conjunction …)、エレメント(Fire …)。ハウスは "1st House" など。
- `periodNote` は **ハウスのグループだけ**(運勢の見出し「あなたの第5ハウスを通過」の後に続く一文)。全角換算30〜80字、期間の語(今日・今月・今年・本日・この日・この月・この年)を含めない。
- 星座の summary はその星座の性質(太陽星座としての人柄)。天体の summary はその天体が表すテーマ。ハウスはその部屋が表す生活の領域。アスペクトは角度の意味(調和・緊張など)と角度。エレメントは性質と属する3星座。
- related: 星座は同じエレメントの2星座とエレメント、天体は支配星座(太陽-獅子座、月-蟹座、水星-双子座・乙女座、金星-牡牛座・天秤座、火星-牡羊座、木星-射手座、土星-山羊座、天王星-水瓶座、海王星-魚座、冥王星-蠍座。ドラゴンヘッド・キロン・リリスは月など関連の天体)、ハウスは対向のハウス、アスペクトは近い種類、エレメントは3星座。

- [ ] **Step 1: `src/data/guide/horoscope.ts` を書く**(`GuideSystemId` と `astro` の画像は Task 4 で追加済み)
- [ ] **Step 2: `npx tsc --noEmit -p .`**
- [ ] **Step 3: コミット**

```bash
git add src/data/guide/horoscope.ts
git commit -m "feat: 早見表に西洋占星術の辞書(十二星座・天体・ハウス・アスペクト・エレメント)を追加"
```

---

### Task 7: チャート円・天体の表・アスペクトの表示

**Files:**
- Create: `src/components/fortune/horoscope-chart.tsx`
- Modify: `src/components/fortune/natal-chart.tsx`、`src/components/fortune/natal-section.tsx`
- Test: `src/components/fortune/__tests__/horoscope-chart.test.tsx`

デザイン(設計書 §10.1・§11.2):
- チャート円(SVG、`viewBox="0 0 300 300"`、表示は最大幅 300px で中央)。外周の輪に十二星座の記号(`AstroGlyphPaths` を `<g transform>` で埋め込む、各30度の中央)。ASC を左(9時の位置)に置き、黄経が反時計回りに増える向き(一般的なホロスコープと同じ)。ハウスのカスプの線(ASC・MC は太め)と、ハウス番号(小さく gold-dim)。内側の輪に天体の記号(重なるときは半径をずらす。最小の間隔 8度)。中心にアスペクトの線(調和 = gold、緊張 = terracotta、クインカンクスとマイナーは破線、マイナーは切り替えで表示)。枠線は gold 20〜30%、背景は popover。
- SVG には `role="img"` と `aria-label`(例「西洋占星術のホロスコープ。ASC 獅子座、MC 牡牛座」)。中身の詳しい情報は下の表で読めるようにする。
- ハウスシステムの切り替え: 3つのセグメント(プラシーダス / コッホ / ホールサイン)の radiogroup。既存の `src/lib/use-roving-selection.ts` を使って矢印キーで移れるようにする。選んだ方式はチャート円と表のハウスに反映する。
- 天体の表: `<table>`。列は「天体・星座・度数・ハウス」。天体の列に記号(16px)+名前、逆行は「逆行」と小さく表示(記号の文字 R は使わない)。行の天体名はボタン(`FactDetailSheet`)で、タップで詳細。
- アスペクトの一覧: 「太陽 - 月 トライン 2.1°」の形のリスト。既定は主要5種+クインカンクス。「マイナーアスペクトを表示」のスイッチ(`<button aria-pressed>`)で切り替え、チャート円の線も連動する。
- 注記(`chart.notes`)は表の上に小さく(terracotta の丸+文字。既存の CandidateNote と同じ見た目)。
- 選んだハウスシステムとマイナーの表示は、画面の中だけの状態(useState)でよい。

`natal-section.tsx`: 西洋占星術(`chart.kind === "horoscope"`)はタイル(太陽・月・ASC)も出し、その下に図を出す。図がある占術の一覧(dl)からは `factKeys` の事実を除く(既存どおり)。

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/fortune/__tests__/horoscope-chart.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoroscopeChart } from "../horoscope-chart";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };
const horoscope = readAll(profile, { year: 2026, month: 10, day: 14 }).find((r) => r.id === "horoscope")!;
if (horoscope.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
const chart = horoscope.chart;

describe("HoroscopeChart", () => {
  it("チャート円を名前つきの画像として描くこと", () => {
    render(<HoroscopeChart chart={chart} />);
    expect(screen.getByRole("img", { name: /ホロスコープ.*ASC 獅子座.*MC 牡牛座/ })).toBeInTheDocument();
  });

  it("天体の表に13天体とハウスを出し、ハウスシステムを切り替えられること", async () => {
    const user = userEvent.setup();
    render(<HoroscopeChart chart={chart} />);
    const table = screen.getByRole("table", { name: "天体の位置" });
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 13);
    const sunRow = within(table).getByRole("row", { name: /太陽/ });
    expect(sunRow).toHaveTextContent("牡羊座");
    expect(sunRow).toHaveTextContent("8");
    const group = screen.getByRole("radiogroup", { name: "ハウスシステム" });
    expect(within(group).getByRole("radio", { name: "プラシーダス" })).toHaveAttribute("aria-checked", "true");
    await user.click(within(group).getByRole("radio", { name: "ホールサイン" }));
    expect(within(group).getByRole("radio", { name: "ホールサイン" })).toHaveAttribute("aria-checked", "true");
    // ホールサインでは太陽(牡羊座)は獅子座始まりの第9ハウス
    expect(within(table).getByRole("row", { name: /太陽/ })).toHaveTextContent("9");
  });

  it("マイナーアスペクトは切り替えで出すこと", async () => {
    const user = userEvent.setup();
    render(<HoroscopeChart chart={chart} />);
    const list = screen.getByRole("list", { name: "アスペクト" });
    const majorCount = within(list).getAllByRole("listitem").length;
    const toggle = screen.getByRole("button", { name: "マイナーアスペクトを表示" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThanOrEqual(majorCount);
  });

  it("注記を出すこと", () => {
    const unknown = readAll({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }, { year: 2026, month: 10, day: 14 }).find(
      (r) => r.id === "horoscope",
    )!;
    if (unknown.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    render(<HoroscopeChart chart={unknown.chart} />);
    expect(screen.getByText("出生時刻不明のため正午で仮計算")).toBeInTheDocument();
  });
});
```

(このテストは Task 8 で registry に登録した後に通る。Task 7 を先にやる場合は `readAll` の代わりに `horoscope.read(profile, toBirthMoment(profile), today)` を使う)

- [ ] **Step 2: テストが失敗することを確かめる**
- [ ] **Step 3: 実装する**(`horoscope-chart.tsx`。`NatalChartView` の `chart.kind === "horoscope"` で `HoroscopeChart` を出す)
- [ ] **Step 4: テスト・lint・型チェック**

Run: `npx vitest run src/components && npx eslint src/components && npx tsc --noEmit -p .`

- [ ] **Step 5: 画面で確かめる**

`npx next dev -p 3200` を起動し、Playwright のスクリプトで localStorage に `{"version":1,"date":{"year":1990,"month":3,"day":29},"time":{"kind":"hour","hour":14},"prefecture":"13"}` を入れて `/fortune` を開き、「あなたについて」の西洋占星術を開いて、390×844 と 1280×800 でスクリーンショットを撮って確かめる(記号が重ならない、円が 300px に収まる、表が横にはみ出さない)。終わったら dev サーバーを止め、スクリーンショットとスクリプトを消す。

- [ ] **Step 6: コミット**

```bash
git add src/components/fortune
git commit -m "feat: 西洋占星術のチャート円・天体の表・アスペクトとハウスシステムの切り替えを表示"
```

---

### Task 8: 登録・E2E・設計書

**Files:**
- Modify: `src/data/guide/index.ts`、`src/data/guide/__tests__/entries.test.ts`、`src/data/guide/__tests__/index.test.ts`
- Modify: `src/components/guide/__tests__/guide-detail.test.tsx`、`src/components/guide/__tests__/guide-browser.test.tsx`
- Modify: `src/lib/fortune/registry.ts`、`src/lib/fortune/system-names.ts`、`src/lib/fortune/__tests__/registry.test.ts`
- Modify: `e2e/profile-fortune.spec.ts`、`e2e/guide.spec.ts`
- Modify: `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`

- [ ] **Step 1: 登録**
  - 早見表のタブの最後に `{ id: "horoscope", label: "西洋占星術", groups: groupEntries(horoscopeEntries) }`。
  - `fortuneSystems` の最後に `horoscope`(設計書 §11.2 の順: 数秘術・九星気学・マヤ暦・四柱推命・算命学・宿曜・西洋占星術)、`FORTUNE_SYSTEM_NAMES` の最後に `{ id: "horoscope", name: "西洋占星術" }`。
- [ ] **Step 2: テストを更新する**
  - `entries.test.ts`: cases に `["horoscope", horoscopeEntries]`、`PERIOD_GROUPS` に `horoscope: ["ハウス"]`、画像の種類は horoscope だけ `"astro"` も許す。
  - `index.test.ts`: タブの最後に `["horoscope", "西洋占星術"]`。グループ `[["十二星座", 12], ["天体", 13], ["ハウス", 12], ["アスペクト", 11], ["エレメント", 4]]`。検索 `searchGuide("おひつじざ")` に `horoscope:sign-aries`。
  - `guide-detail.test.tsx`: 静的パスの数に `ELEMENT_IDS.horoscope.length`。
  - `guide-browser.test.tsx`: タブの最後に「西洋占星術」、End・ArrowLeft の先を「西洋占星術」。
  - `registry.test.ts`: 7占術の順。
- [ ] **Step 3: E2E**
  - `profile-fortune.spec.ts`: 最初のテストを「7占術」にし、占術名の配列の最後に `"西洋占星術"`。人物像のテストに「あなたについて」の西洋占星術を開くと `getByRole("img", { name: /ホロスコープ/ })` と `getByRole("table", { name: "天体の位置" })` が見えることを足す。
  - `guide.spec.ts`: `/guide?tab=horoscope` で「十二星座」「天体」の見出しが見えること。
- [ ] **Step 4: 設計書**
  - §3 の西洋占星術の行に、ドラゴンヘッド(真)・リリス(平均)・キロン(JPL Horizons の表、1900〜2100年)、アスペクトとオーブ、出生時刻が不明・午前午後のときの仮計算(正午・6時・18時、注記)を書く。
  - §3.1 の西洋占星術の行の「今月」「今年」を実装に合わせる(暦の月の新月・満月+火星、暦の年の木星・土星)。
  - §5 に「西洋占星術の ASC・ハウスは、不明・午前午後では代表の時刻で仮計算する(ユーザーの判断)」。
  - §6.2 の `NatalChart` に `horoscope` を足す。§7 の `GuideImage` に `{ kind: "astro"; name }`、`GuideSystemId` に `"horoscope"`、periodNote の説明に「西洋占星術はハウス」。
- [ ] **Step 5: 実行**

Run: `npx vitest run && npx eslint src e2e && npm run build && npx playwright test`
Expected: すべて成功。`ls out/guide/horoscope | head` に `sign-aries.html` など。`grep -l "Horizons" out/_next/static/chunks/*.js` が1つのチャンクだけで、そのチャンク名が `out/index.html`・`out/fortune.html`・`out/guide.html` に直接含まれない。

- [ ] **Step 6: コミット**

```bash
git add src e2e docs
git commit -m "feat: 運勢ページと早見表に西洋占星術を登録し、E2Eと設計書を更新"
```
