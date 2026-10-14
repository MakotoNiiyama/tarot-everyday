# フェーズ1B: 早見表(辞書データと画面) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 数秘術・九星気学・マヤ暦の早見表の辞書データ(約85項目のオリジナルの文章)を作り、早見表をタイル型の一覧・検索・詳細ページの新デザインに作り直す(タロットを含む)。あわせて、1C の運勢ページが使う「要素の詳細シート」と「一文のまとめの組み立て」を用意する。

**Architecture:** 辞書データは `src/data/guide/` に占術ごとのファイルで置き、`GuideEntry` 型で統一する。項目の id は 1A の `src/lib/fortune/element-ids.ts` の `ELEMENT_IDS` と完全に一致させ、テストで過不足・文字数・絵文字の有無を検証する。タロットは既存のカードデータを `GuideEntry` に変換して同じ一覧・検索に載せる。画面は `/guide`(占術タブは `?tab=`、`useSearchParams` を `Suspense` で囲む)、`/guide/[system]/[id]`(静的生成)、`/guide/tarot/[id]`(既存ルートを新レイアウトに)。

**Tech Stack:** Next.js 16(静的エクスポート)、React 19、Tailwind CSS v4、Vitest、Playwright

**設計書:** `docs/superpowers/specs/2026-10-14-birth-fortune-design.md` §7、§11.5、§13(フェーズ1)。デザインは Claude Design の `Guide.dc.html`(設計書 §11.5 に寸法を記載済み)

---

## 前提知識(実装者向け)

- テスト: `npx vitest run <パス>`、型: `npx tsc --noEmit`、lint: `npx eslint <パス>`、E2E: `npx playwright test <パス>`(ポート3100で dev サーバーを自動起動。別の `next dev` が同じディレクトリで動いていると起動できないので止めておく)。
- **絵文字・記号文字は使わない**(文章にも)。アイコンは `src/components/icons/icon.tsx` の `Icon`。
- 新しいコードで `useEffect` 内の `setState` は禁止(lint の `react-hooks/set-state-in-effect`)。
- Next.js の API を使う前に `node_modules/next/dist/docs/` を確認する。`useSearchParams` を使うクライアント部品は `<Suspense>` で囲む(囲んだ内側は事前描画されずクライアントで描画される。fallback に初期表示を出す)。
- 既存の部品: `PageContainer`、`PageHeader`、`DetailSheet`(`heading` / `body` / `guideHref` / `triggerLabel`)、`DetailPanelLayout`、`OrientationBadge`、`TarotCardMeaningTabs`、`CardDetailSheet`、`button-styles.ts`。
- 1A の計算エンジン: `src/lib/fortune/element-ids.ts`(id 関数と `ELEMENT_IDS`)、`types.ts`(`ElementRef`、`PeriodResult`)、名前の定数 `STAR_NAMES` / `PALACE_NAMES` / `DIRECTION_LABELS`(`kyusei/calc.ts`)、`SEAL_NAMES` / `TONE_NAMES` / `MOON_NAMES`(`maya/calc.ts`)。

## 文章の決まり(Task 2〜4 の辞書データ)

- **オリジナルの文章**で書く。書籍やWebサイトの文章をそのまま写したり、言い換えただけの文にしない。
- 文体は「です・ます」調。断定しすぎず、練習用の読み物として前向きに。
- `keywords`: 3〜5語。1語は8文字以内。名詞か短い名詞句。
- `summary`(人物像・意味の説明): 2〜3文、全角換算で80〜160文字。
- `periodNote`(運勢として出たときの一文): 1〜2文、30〜80文字。**「今日・今月・今年」のどれに当てはめても読める**ように、期間を表す語(今日・今月・今年・日・月・年)を入れない。テーマ→行動のヒントの順に書く。
- `related`: 同じ占術の関連する項目の id を2〜4個(例: 九星なら同じ五行の星、マヤ暦なら類似・反対の紋章)。存在する id だけを使う。
- 絵文字・記号文字(☀ ☆ ♪ など)は使わない。かぎかっこ「」は使ってよい。

## ファイル構成

| 種別 | パス | 責務 |
|---|---|---|
| 新規 | `src/data/guide/types.ts` | 辞書データの型 |
| 新規 | `src/data/guide/numerology.ts`、`kyusei.ts`、`maya.ts` | 占術ごとの辞書データ |
| 新規 | `src/data/guide/tarot.ts` | タロットのカードデータを `GuideEntry` に変換 |
| 新規 | `src/data/guide/index.ts` | 占術の一覧、項目の取得、検索、リンク先、一文のまとめの組み立て |
| 新規 | `src/components/guide/guide-image.tsx` | 共通の画像枠(漢字・数字のタイポグラフィ/カード画像) |
| 新規 | `src/components/guide/guide-tile.tsx` | 一覧のタイル |
| 新規 | `src/components/guide/guide-entry-body.tsx` | 詳細シート・パネルの本文 |
| 新規 | `src/components/guide/element-detail-sheet.tsx` | `ElementRef` から詳細シートを開くトリガー(1C の運勢ページで使う) |
| 新規 | `src/components/guide/guide-browser.tsx` | 早見表の一覧(占術タブ・グループ・検索) |
| 新規 | `src/components/guide/guide-detail-layout.tsx` | 詳細ページの共通レイアウト |
| 新規 | `src/app/guide/[system]/[id]/page.tsx` | 占術の項目の詳細ページ |
| 変更 | `src/app/guide/page.tsx` | 新しい一覧にする |
| 変更 | `src/components/card-detail.tsx` | タロットの詳細を新レイアウトにする |
| 削除 | `src/components/card-browser.tsx`、`card-grid.tsx`、`card-list.tsx`、`card-tile.tsx` と各テスト | 新しい一覧に置き換えるため |
| 変更 | `e2e/cards-grid.spec.ts`(→ `e2e/guide.spec.ts`)、`e2e/card-detail.spec.ts` | 新しい画面に合わせる |

---

### Task 1: 辞書データの型と検証テスト

**Files:**
- Create: `src/data/guide/types.ts`
- Create: `src/data/guide/numerology.ts`、`kyusei.ts`、`maya.ts`(空の配列で作る)
- Test: `src/data/guide/__tests__/entries.test.ts`

- [ ] **Step 1: 型を作る**

```ts
// src/data/guide/types.ts
/** 早見表の占術(タロットを含む) */
export type GuideSystemId = "tarot" | "numerology" | "kyusei" | "maya";

/** 画像枠の中身。glyph は漢字・数字のタイポグラフィ、photo はカード画像など */
export type GuideImage =
  | { kind: "glyph"; text: string; color?: string }
  | { kind: "photo"; path: string; alt: string };

/** 早見表の1項目(設計書 §7) */
export interface GuideEntry {
  system: GuideSystemId;
  /** ElementRef.id と同じ。URL にも使う */
  id: string;
  /** グループ名(一覧の見出し。例「九星」) */
  group: string;
  name: string;
  /** 読み(ひらがな)。タロットは空文字 */
  reading: string;
  nameEn?: string;
  keywords: string[];
  /** 人物像・意味の説明(2〜3文) */
  summary: string;
  /** 運勢として出たときの一文(期間を表す語を含めない)。タロットは持たない */
  periodNote?: string;
  image: GuideImage;
  /** 同じ占術の関連項目の id */
  related?: string[];
}
```

```ts
// src/data/guide/numerology.ts
import type { GuideEntry } from "./types";

/** 数秘術の早見表(Task 2 で項目を入れる) */
export const numerologyEntries: GuideEntry[] = [];
```

`kyusei.ts`(`kyuseiEntries`)、`maya.ts`(`mayaEntries`)も同じ形で空の配列を作る。

- [ ] **Step 2: 検証テストを書く**

```ts
// src/data/guide/__tests__/entries.test.ts
import { describe, it, expect } from "vitest";
import { ELEMENT_IDS } from "@/lib/fortune/element-ids";
import { numerologyEntries } from "../numerology";
import { kyuseiEntries } from "../kyusei";
import { mayaEntries } from "../maya";
import type { GuideEntry } from "../types";

const EMOJI_OR_SYMBOL = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}]/u;
const PERIOD_WORDS = /今日|今月|今年|本日|この日|この月|この年/;
/** 全角換算の文字数(半角は0.5) */
const width = (s: string) => [...s].reduce((n, c) => n + (/[\x20-\x7E]/.test(c) ? 0.5 : 1), 0);

const cases: [keyof typeof ELEMENT_IDS, GuideEntry[]][] = [
  ["numerology", numerologyEntries],
  ["kyusei", kyuseiEntries],
  ["maya", mayaEntries],
];

describe.each(cases)("%s の辞書データ", (system, entries) => {
  it("ELEMENT_IDS と過不足なく一致すること", () => {
    expect(entries.map((e) => e.id).sort()).toEqual([...ELEMENT_IDS[system]].sort());
  });

  it("system と id が重複しないこと", () => {
    expect(entries.every((e) => e.system === system)).toBe(true);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it.each(entries.map((e) => [e.id, e] as const))("%s の文章が決まりを満たすこと", (_id, e) => {
    expect(e.name).not.toBe("");
    expect(e.reading).toMatch(/^[ぁ-んー\s]+$/);
    expect(e.group).not.toBe("");
    expect(e.keywords.length).toBeGreaterThanOrEqual(3);
    expect(e.keywords.length).toBeLessThanOrEqual(5);
    for (const k of e.keywords) expect([...k].length).toBeLessThanOrEqual(8);
    expect(width(e.summary)).toBeGreaterThanOrEqual(80);
    expect(width(e.summary)).toBeLessThanOrEqual(160);
    expect(e.periodNote).toBeDefined();
    expect(width(e.periodNote ?? "")).toBeGreaterThanOrEqual(30);
    expect(width(e.periodNote ?? "")).toBeLessThanOrEqual(80);
    expect(e.periodNote).not.toMatch(PERIOD_WORDS);
    const text = [e.name, e.reading, e.summary, e.periodNote, ...e.keywords].join("");
    expect(text).not.toMatch(EMOJI_OR_SYMBOL);
    expect(e.image.kind).toBe("glyph");
  });

  it("related が同じ占術に実在する id だけを指すこと", () => {
    const ids = new Set(entries.map((e) => e.id));
    for (const e of entries) {
      for (const r of e.related ?? []) {
        expect(ids.has(r)).toBe(true);
        expect(r).not.toBe(e.id);
      }
    }
  });
});
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npx vitest run src/data/guide`
Expected: FAIL(「ELEMENT_IDS と過不足なく一致すること」が3占術とも失敗。Task 2〜4 で埋まっていく)

- [ ] **Step 4: コミットする**

型と空のデータ、検証テストをコミットする(テストは Task 4 完了までは失敗のまま)。

```bash
git add src/data/guide
git commit -m "test: 早見表の辞書データの型と、過不足・文章の決まりを検証するテストを追加"
```

---

### Task 2: 数秘術の辞書データ(12項目)

**Files:**
- Modify: `src/data/guide/numerology.ts`

- [ ] **Step 1: 項目を書く**

「文章の決まり」に従い、次の12項目を書く。`name` と `reading` と `group` と `image` は表のとおりにする。`keywords` / `summary` / `periodNote` / `related` はオリジナルで書く。

| id | name | reading | group | image.text |
|---|---|---|---|---|
| number-1 | 1 | いち | ルートナンバー | 1 |
| number-2 | 2 | に | ルートナンバー | 2 |
| number-3 | 3 | さん | ルートナンバー | 3 |
| number-4 | 4 | よん | ルートナンバー | 4 |
| number-5 | 5 | ご | ルートナンバー | 5 |
| number-6 | 6 | ろく | ルートナンバー | 6 |
| number-7 | 7 | なな | ルートナンバー | 7 |
| number-8 | 8 | はち | ルートナンバー | 8 |
| number-9 | 9 | きゅう | ルートナンバー | 9 |
| number-11 | 11 | じゅういち | マスターナンバー | 11 |
| number-22 | 22 | にじゅうに | マスターナンバー | 22 |
| number-33 | 33 | さんじゅうさん | マスターナンバー | 33 |

`image` は `{ kind: "glyph", text: "7" }`(色は指定しない=金色)。`summary` はライフパスとして出たときの人物像、`periodNote` はパーソナルナンバーとして出たときのテーマとして書く。マスターナンバーの `related` には、還元した数(11→2、22→4、33→6)を含める。

見本(この2項目はこのまま使ってよい):

```ts
  {
    system: "numerology",
    id: "number-7",
    group: "ルートナンバー",
    name: "7",
    reading: "なな",
    keywords: ["探求", "内省", "直感", "専門性"],
    summary:
      "物事の奥にある理由を知りたくなる、探求者の数です。ひとりで考える時間から確かな答えを見つけ、専門的な分野で力を発揮します。",
    periodNote: "内省と探求がテーマ。急いで結論を出さず、調べて考える時間を確保すると気づきが深まります。",
    image: { kind: "glyph", text: "7" },
    related: ["number-2", "number-9"],
  },
  {
    system: "numerology",
    id: "number-33",
    group: "マスターナンバー",
    name: "33",
    reading: "さんじゅうさん",
    keywords: ["奉仕", "癒し", "無償の愛", "理想"],
    summary:
      "人を癒し、支えることに喜びを見いだすマスターナンバーです。理想が高く、自分のことより周りを優先しがちなので、自分を労わることも大切にしましょう。",
    periodNote: "誰かの力になる場面が増えそうです。抱え込みすぎず、受け取ることも許すと循環が生まれます。",
    image: { kind: "glyph", text: "33" },
    related: ["number-6", "number-11", "number-22"],
  },
```

- [ ] **Step 2: テストを確認する**

Run: `npx vitest run src/data/guide`
Expected: numerology の describe はすべて PASS(kyusei・maya は失敗のまま)

- [ ] **Step 3: コミットする**

```bash
git add src/data/guide/numerology.ts
git commit -m "feat: 数秘術の早見表の辞書データを追加"
```

---

### Task 3: 九星気学の辞書データ(26項目)

**Files:**
- Modify: `src/data/guide/kyusei.ts`

- [ ] **Step 1: 項目を書く**

九星(9)・宮(9)・方位(8)の26項目。`name` / `reading` / `group` / `image` は表のとおり。`name` は `STAR_NAMES` / `PALACE_NAMES` / `DIRECTION_LABELS`(`@/lib/fortune/kyusei/calc`)から取ってよい。

| id | name | reading | group | image.text | image.color |
|---|---|---|---|---|---|
| star-1 | 一白水星 | いっぱくすいせい | 九星 | 一白 | #F5E6C8 |
| star-2 | 二黒土星 | じこくどせい | 九星 | 二黒 | #B89A5A |
| star-3 | 三碧木星 | さんぺきもくせい | 九星 | 三碧 | #8FB8A0 |
| star-4 | 四緑木星 | しろくもくせい | 九星 | 四緑 | #6F9A5A |
| star-5 | 五黄土星 | ごおうどせい | 九星 | 五黄 | #E5B85A |
| star-6 | 六白金星 | ろっぱくきんせい | 九星 | 六白 | #F5E6C8 |
| star-7 | 七赤金星 | しちせききんせい | 九星 | 七赤 | #C75B39 |
| star-8 | 八白土星 | はっぱくどせい | 九星 | 八白 | #F5E6C8 |
| star-9 | 九紫火星 | きゅうしかせい | 九星 | 九紫 | #B98AC9 |
| palace-center | 中宮 | ちゅうぐう | 宮 | 中 | (なし) |
| palace-nw | 乾宮 | けんきゅう | 宮 | 乾 | (なし) |
| palace-w | 兌宮 | だきゅう | 宮 | 兌 | (なし) |
| palace-ne | 艮宮 | ごんきゅう | 宮 | 艮 | (なし) |
| palace-s | 離宮 | りきゅう | 宮 | 離 | (なし) |
| palace-n | 坎宮 | かんきゅう | 宮 | 坎 | (なし) |
| palace-sw | 坤宮 | こんきゅう | 宮 | 坤 | (なし) |
| palace-e | 震宮 | しんきゅう | 宮 | 震 | (なし) |
| palace-se | 巽宮 | そんきゅう | 宮 | 巽 | (なし) |
| direction-n | 北 | きた | 方位 | 北 | (なし) |
| direction-ne | 北東 | ほくとう | 方位 | 北東 | (なし) |
| direction-e | 東 | ひがし | 方位 | 東 | (なし) |
| direction-se | 南東 | なんとう | 方位 | 南東 | (なし) |
| direction-s | 南 | みなみ | 方位 | 南 | (なし) |
| direction-sw | 南西 | なんせい | 方位 | 南西 | (なし) |
| direction-w | 西 | にし | 方位 | 西 | (なし) |
| direction-nw | 北西 | ほくせい | 方位 | 北西 | (なし) |

書き分け:
- 九星: `summary` は本命星としての人物像、`periodNote` は盤の中宮の星として出たときの雰囲気。`related` は同じ五行の星や相性のよい星。
- 宮: `summary` は傾斜宮としての隠れた性質、`periodNote` は本命星がその宮に回ったときの運気(中宮は「八方塞がり」と呼ばれる時期であることに触れつつ前向きに)。`related` は向かい合う宮と対応する方位(例: palace-nw → palace-se, direction-nw)。
- 方位: `summary` はその方位の象意(吉方位として出かけたときに得られるとされる作用)、`periodNote` はその方位が吉方位のときの過ごし方。`related` は対応する宮と向かいの方位。

見本:

```ts
  {
    system: "kyusei",
    id: "star-1",
    group: "九星",
    name: "一白水星",
    reading: "いっぱくすいせい",
    keywords: ["水", "柔軟", "忍耐", "共感"],
    summary:
      "器に合わせて形を変える水のように、しなやかに環境へなじむ星です。表には出さない芯の強さがあり、苦労を重ねるほど深みと包容力が増していきます。",
    periodNote: "静かに力を蓄える流れです。人の話に耳を傾け、焦らず準備を進めると次の展開につながります。",
    image: { kind: "glyph", text: "一白", color: "#F5E6C8" },
    related: ["star-6", "star-7", "palace-n"],
  },
```

- [ ] **Step 2: テストを確認する**

Run: `npx vitest run src/data/guide`
Expected: numerology・kyusei の describe が PASS

- [ ] **Step 3: コミットする**

```bash
git add src/data/guide/kyusei.ts
git commit -m "feat: 九星気学の早見表の辞書データを追加"
```

---

### Task 4: マヤ暦の辞書データ(47項目)

**Files:**
- Modify: `src/data/guide/maya.ts`

- [ ] **Step 1: 項目を書く**

太陽の紋章(20)・銀河の音(13)・13の月(13+時間をはずした日)の47項目。

紋章(group「太陽の紋章」)。`name` は `SEAL_NAMES`、`image.text` は名前と同じ、`image.color` は色の頭文字で決める(赤 #C75B39 / 白 #F5E6C8 / 青 #7FA3C9 / 黄 #E5B85A):

| id | reading | nameEn |
|---|---|---|
| seal-1 | あかいりゅう | Red Dragon |
| seal-2 | しろいかぜ | White Wind |
| seal-3 | あおいよる | Blue Night |
| seal-4 | きいろいたね | Yellow Seed |
| seal-5 | あかいへび | Red Serpent |
| seal-6 | しろいせかいのはしわたし | White World-Bridger |
| seal-7 | あおいて | Blue Hand |
| seal-8 | きいろいほし | Yellow Star |
| seal-9 | あかいつき | Red Moon |
| seal-10 | しろいいぬ | White Dog |
| seal-11 | あおいさる | Blue Monkey |
| seal-12 | きいろいひと | Yellow Human |
| seal-13 | あかいそらあるくひと | Red Skywalker |
| seal-14 | しろいまほうつかい | White Wizard |
| seal-15 | あおいわし | Blue Eagle |
| seal-16 | きいろいせんし | Yellow Warrior |
| seal-17 | あかいちきゅう | Red Earth |
| seal-18 | しろいかがみ | White Mirror |
| seal-19 | あおいあらし | Blue Storm |
| seal-20 | きいろいたいよう | Yellow Sun |

銀河の音(group「銀河の音」)。`name` は `音${n}(${TONE_NAMES[n-1]})`(例「音1(磁気)」)、`image.text` は数字、色なし:

| id | reading | nameEn |
|---|---|---|
| tone-1 | じき | Magnetic |
| tone-2 | つき | Lunar |
| tone-3 | でんき | Electric |
| tone-4 | じこそんざい | Self-Existing |
| tone-5 | ばいおん | Overtone |
| tone-6 | りつどう | Rhythmic |
| tone-7 | きょうしん | Resonant |
| tone-8 | ぎんが | Galactic |
| tone-9 | たいよう | Solar |
| tone-10 | わくせい | Planetary |
| tone-11 | すぺくとる | Spectral |
| tone-12 | すいしょう | Crystal |
| tone-13 | うちゅう | Cosmic |

13の月(group「13の月」)。`name` は `MOON_NAMES`、`image.text` は数字(moon-0 は「0」)、色なし:

| id | name | reading | nameEn |
|---|---|---|---|
| moon-0 | 時間をはずした日 | じかんをはずしたひ | Day Out of Time |
| moon-1 | 磁気の月 | じきのつき | Magnetic Moon |
| moon-2 | 月の月 | つきのつき | Lunar Moon |
| moon-3 | 電気の月 | でんきのつき | Electric Moon |
| moon-4 | 自己存在の月 | じこそんざいのつき | Self-Existing Moon |
| moon-5 | 倍音の月 | ばいおんのつき | Overtone Moon |
| moon-6 | 律動の月 | りつどうのつき | Rhythmic Moon |
| moon-7 | 共振の月 | きょうしんのつき | Resonant Moon |
| moon-8 | 銀河の月 | ぎんがのつき | Galactic Moon |
| moon-9 | 太陽の月 | たいようのつき | Solar Moon |
| moon-10 | 惑星の月 | わくせいのつき | Planetary Moon |
| moon-11 | スペクトルの月 | すぺくとるのつき | Spectral Moon |
| moon-12 | 水晶の月 | すいしょうのつき | Crystal Moon |
| moon-13 | 宇宙の月 | うちゅうのつき | Cosmic Moon |

書き分け:
- 紋章: `summary` は太陽の紋章としての人物像、`periodNote` はその日のKIN・年回りとして出たときのテーマ。`related` は類似(番号の和が19または39)・反対(番号の差が10)の紋章。
- 音: `summary` は銀河の音としての性質、`periodNote` はその音のテーマ。`related` は前後の音。
- 13の月: `summary` はその月の意味、`periodNote` はその月の過ごし方。月 n は音 n と対応するので `related` に `tone-n` を含める。moon-0 は年の終わりの「時間をはずした日」の意味を書き、`related` は `moon-13`・`moon-1`。

注意: 13の月の暦はホゼ・アグエイアスらの「ドリームスペル」に由来する体系で、紋章のデザインには著作権がある。文章もオリジナルで書くこと。

見本:

```ts
  {
    system: "maya",
    id: "seal-14",
    group: "太陽の紋章",
    name: "白い魔法使い",
    reading: "しろいまほうつかい",
    nameEn: "White Wizard",
    keywords: ["受容", "誠実", "時間", "魅了"],
    summary:
      "相手をありのまま受け入れる器の大きさで、人を惹きつける紋章です。誠実に向き合うほど信頼が集まり、焦らず待つことで物事がよい時機に整っていきます。",
    periodNote: "受け入れる姿勢が鍵になります。結果を急がず、目の前の人や出来事に誠実に向き合いましょう。",
    image: { kind: "glyph", text: "白い魔法使い", color: "#F5E6C8" },
    related: ["seal-5", "seal-4"],
  },
```

- [ ] **Step 2: テストを確認する**

Run: `npx vitest run src/data/guide`
Expected: すべて PASS

- [ ] **Step 3: コミットする**

```bash
git add src/data/guide/maya.ts
git commit -m "feat: マヤ暦の早見表の辞書データを追加"
```

---

### Task 5: タロットの変換・占術の一覧・検索・一文のまとめ

**Files:**
- Create: `src/data/guide/tarot.ts`、`src/data/guide/index.ts`
- Test: `src/data/guide/__tests__/index.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/data/guide/__tests__/index.test.ts
import { describe, it, expect } from "vitest";
import { composeHeadline, getGuideEntry, guideHref, guideSystems, searchGuide } from "../index";
import type { PeriodResult } from "@/lib/fortune/types";

describe("guideSystems", () => {
  it("タブの順は タロット・数秘術・九星気学・マヤ暦", () => {
    expect(guideSystems.map((s) => [s.id, s.label])).toEqual([
      ["tarot", "タロット"],
      ["numerology", "数秘術"],
      ["kyusei", "九星気学"],
      ["maya", "マヤ暦"],
    ]);
  });

  it("グループの順と項目数", () => {
    const byId = Object.fromEntries(guideSystems.map((s) => [s.id, s]));
    expect(byId.tarot.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["大アルカナ", 22],
      ["ワンド", 14],
      ["カップ", 14],
      ["ソード", 14],
      ["ペンタクル", 14],
    ]);
    expect(byId.numerology.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["ルートナンバー", 9],
      ["マスターナンバー", 3],
    ]);
    expect(byId.kyusei.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["九星", 9],
      ["宮", 9],
      ["方位", 8],
    ]);
    expect(byId.maya.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["太陽の紋章", 20],
      ["銀河の音", 13],
      ["13の月", 14],
    ]);
  });
});

describe("getGuideEntry / guideHref", () => {
  it("占術と id から項目を引けること", () => {
    expect(getGuideEntry("kyusei", "star-1")?.name).toBe("一白水星");
    expect(getGuideEntry("tarot", "major-00")?.name).toBe("愚者");
    expect(getGuideEntry("maya", "seal-99")).toBeUndefined();
  });

  it("リンク先", () => {
    expect(guideHref("maya", "seal-14")).toBe("/guide/maya/seal-14");
    expect(guideHref("tarot", "major-00")).toBe("/guide/tarot/major-00");
  });
});

describe("searchGuide", () => {
  it("名前・読み・英名・キーワードで全占術を横断して検索できること", () => {
    expect(searchGuide("一白").map((e) => e.id)).toContain("star-1");
    expect(searchGuide("いっぱく").map((e) => e.id)).toContain("star-1");
    expect(searchGuide("wizard").map((e) => e.id)).toContain("seal-14");
    expect(searchGuide("愚者").map((e) => e.id)).toContain("major-00");
    expect(searchGuide("Fool").map((e) => e.id)).toContain("major-00");
  });

  it("カタカナでひらがなの読みに一致すること", () => {
    expect(searchGuide("イッパク").map((e) => e.id)).toContain("star-1");
  });

  it("空の検索語は空の結果", () => {
    expect(searchGuide("  ")).toEqual([]);
  });
});

describe("composeHeadline", () => {
  const result: PeriodResult = {
    period: "day",
    rangeLabel: "2026/10/14",
    headline: { text: "パーソナルデー7", ref: { system: "numerology", id: "number-7" } },
    chips: [],
  };

  it("見出しの文と、参照先の periodNote をつなげること", () => {
    const note = getGuideEntry("numerology", "number-7")?.periodNote;
    expect(composeHeadline(result)).toBe(`パーソナルデー7。${note}`);
  });

  it("参照先が見つからなければ見出しの文だけ", () => {
    expect(composeHeadline({ ...result, headline: { text: "X", ref: { system: "numerology", id: "nothing" } } })).toBe("X。");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/data/guide/__tests__/index.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/data/guide/tarot.ts
import { allCards } from "@/data/cards";
import { suitNames } from "@/lib/tarot-utils";
import type { GuideEntry } from "./types";

/** タロットのカードを早見表の項目に変換する(グループは大アルカナとスーツ) */
export const tarotEntries: GuideEntry[] = allCards.map((card) => ({
  system: "tarot",
  id: card.id,
  group: card.suit ? suitNames[card.suit].medium : "大アルカナ",
  name: card.name.ja,
  reading: "",
  nameEn: card.name.en,
  keywords: card.keywords.upright,
  summary: card.meaning.upright,
  image: { kind: "photo", path: card.imagePath, alt: card.name.ja },
}));
```

```ts
// src/data/guide/index.ts
import type { ElementRef, PeriodResult } from "@/lib/fortune/types";
import { kyuseiEntries } from "./kyusei";
import { mayaEntries } from "./maya";
import { numerologyEntries } from "./numerology";
import { tarotEntries } from "./tarot";
import type { GuideEntry, GuideSystemId } from "./types";

export type { GuideEntry, GuideSystemId, GuideImage } from "./types";

export interface GuideGroup {
  name: string;
  entries: GuideEntry[];
}

export interface GuideSystem {
  id: GuideSystemId;
  label: string;
  groups: GuideGroup[];
}

/** 項目の並び順を保ったまま、グループ名の出現順でまとめる */
function groupEntries(entries: GuideEntry[]): GuideGroup[] {
  const groups: GuideGroup[] = [];
  for (const entry of entries) {
    const group = groups.find((g) => g.name === entry.group);
    if (group) group.entries.push(entry);
    else groups.push({ name: entry.group, entries: [entry] });
  }
  return groups;
}

/** 早見表のタブの順(設計書 §11.5。フェーズ2以降の占術はここに追加する) */
export const guideSystems: GuideSystem[] = [
  { id: "tarot", label: "タロット", groups: groupEntries(tarotEntries) },
  { id: "numerology", label: "数秘術", groups: groupEntries(numerologyEntries) },
  { id: "kyusei", label: "九星気学", groups: groupEntries(kyuseiEntries) },
  { id: "maya", label: "マヤ暦", groups: groupEntries(mayaEntries) },
];

const allEntries: GuideEntry[] = guideSystems.flatMap((s) => s.groups.flatMap((g) => g.entries));
const byKey = new Map(allEntries.map((e) => [`${e.system}:${e.id}`, e]));

export function isGuideSystemId(v: string): v is GuideSystemId {
  return guideSystems.some((s) => s.id === v);
}

export function getGuideEntry(system: string, id: string): GuideEntry | undefined {
  return byKey.get(`${system}:${id}`);
}

export function guideHref(system: GuideSystemId, id: string): string {
  return `/guide/${system}/${id}`;
}

/** カタカナをひらがなにし、英字を小文字にそろえる */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .trim();
}

/** 名前・読み・英名・キーワードで全占術を横断して検索する */
export function searchGuide(query: string): GuideEntry[] {
  const q = normalize(query);
  if (!q) return [];
  return allEntries.filter((e) =>
    [e.name, e.reading, e.nameEn ?? "", ...e.keywords].some((field) => normalize(field).includes(q)),
  );
}

/** ElementRef が指す項目の「運勢として出たときの一文」 */
export function periodNoteOf(ref: ElementRef): string | undefined {
  return getGuideEntry(ref.system, ref.id)?.periodNote;
}

/** 運勢カードの一文のまとめ(設計書 §7): 「{見出しの文}。{periodNote}」 */
export function composeHeadline(result: PeriodResult): string {
  const note = periodNoteOf(result.headline.ref);
  return note ? `${result.headline.text}。${note}` : `${result.headline.text}。`;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/data/guide && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/data/guide
git commit -m "feat: 早見表の占術一覧・検索・一文のまとめの組み立てを追加し、タロットを早見表の項目に変換"
```

---

### Task 6: 画像枠・タイル・詳細の本文・要素の詳細シート

**Files:**
- Create: `src/components/guide/guide-image.tsx`、`guide-tile.tsx`、`guide-entry-body.tsx`、`element-detail-sheet.tsx`
- Test: `src/components/guide/__tests__/guide-components.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/guide/__tests__/guide-components.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideImageView } from "../guide-image";
import { GuideTile } from "../guide-tile";
import { GuideEntryBody } from "../guide-entry-body";
import { ElementDetailSheet } from "../element-detail-sheet";
import { getGuideEntry } from "@/data/guide";

const star1 = getGuideEntry("kyusei", "star-1")!;
const fool = getGuideEntry("tarot", "major-00")!;

describe("GuideImageView", () => {
  it("漢字のタイポグラフィを指定色で描くこと", () => {
    render(<GuideImageView image={star1.image} size="tile" />);
    const glyph = screen.getByText("一白");
    expect(glyph).toHaveStyle({ color: "#F5E6C8" });
  });

  it("カード画像を alt 付きで描くこと", () => {
    render(<GuideImageView image={fool.image} size="tile" />);
    expect(screen.getByRole("img", { name: "愚者" })).toBeInTheDocument();
  });
});

describe("GuideTile", () => {
  it("詳細ページへのリンクと名前を表示すること", () => {
    render(<GuideTile entry={star1} />);
    const link = screen.getByRole("link", { name: "一白水星の詳細を見る" });
    expect(link).toHaveAttribute("href", "/guide/kyusei/star-1");
    expect(link).toHaveTextContent("一白水星");
  });

  it("タロットは縦長の枠にすること", () => {
    const { container } = render(<GuideTile entry={fool} />);
    expect(container.querySelector("[data-shape='portrait']")).not.toBeNull();
  });
});

describe("GuideEntryBody", () => {
  it("キーワード・説明・運勢の一文を表示すること", () => {
    render(<GuideEntryBody entry={star1} />);
    for (const k of star1.keywords) expect(screen.getByText(k)).toBeInTheDocument();
    expect(screen.getByText(star1.summary)).toBeInTheDocument();
    expect(screen.getByText(star1.periodNote!)).toBeInTheDocument();
  });
});

describe("ElementDetailSheet", () => {
  it("参照先の項目をシートで開き、早見表へのリンクを出すこと", async () => {
    const user = userEvent.setup();
    render(
      <ElementDetailSheet element={{ system: "kyusei", id: "star-1" }}>
        <span>本命星 一白水星</span>
      </ElementDetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "本命星 一白水星" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("一白水星");
    expect(screen.getByRole("link", { name: "早見表で見る" })).toHaveAttribute("href", "/guide/kyusei/star-1");
  });

  it("参照先がなければトリガーの中身だけを表示すること", () => {
    render(
      <ElementDetailSheet element={{ system: "kyusei", id: "nothing" }}>
        <span>不明</span>
      </ElementDetailSheet>,
    );
    expect(screen.getByText("不明")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

※ React の予約語 `ref` と衝突しないよう、参照のプロパティ名は `element` にする。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/guide`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/guide/guide-image.tsx
import Image from "next/image";
import type { GuideImage } from "@/data/guide";

type Size = "tile" | "sheet" | "detail";

/** 文字数に応じたタイポグラフィの大きさ(設計書 §10.1: 1字34px / 2字24px / 3字以上 15〜20px をタイル基準に拡大) */
const GLYPH_CLASS: Record<Size, [string, string, string, string]> = {
  tile: ["text-[34px]", "text-[24px]", "text-[16px]", "text-[11px]"],
  sheet: ["text-[64px]", "text-[44px]", "text-[26px]", "text-[16px]"],
  detail: ["text-[132px] lg:text-[160px]", "text-[88px] lg:text-[110px]", "text-[48px] lg:text-[60px]", "text-[26px] lg:text-[32px]"],
};

function glyphClass(text: string, size: Size): string {
  const length = [...text].length;
  const [one, two, short, long] = GLYPH_CLASS[size];
  if (length <= 1) return one;
  if (length === 2) return two;
  if (length <= 4) return short;
  return long;
}

/** 早見表の画像枠の中身。枠(大きさ・角丸・背景)は呼び出し側が持つ */
export function GuideImageView({ image, size }: { image: GuideImage; size: Size }) {
  if (image.kind === "photo") {
    return (
      <Image src={image.path} alt={image.alt} width={240} height={400} className="h-full w-full object-cover" />
    );
  }
  return (
    <span
      className={`px-1 text-center font-heading leading-tight ${glyphClass(image.text, size)}`}
      style={{ color: image.color ?? "#E5B85A" }}
    >
      {image.text}
    </span>
  );
}
```

```tsx
// src/components/guide/guide-tile.tsx
import Link from "next/link";
import { guideHref, type GuideEntry } from "@/data/guide";
import { GuideImageView } from "./guide-image";

/** 一覧のタイル。タロットは縦長、ほかは正方形(角丸14px・枠 gold/25) */
export function GuideTile({ entry }: { entry: GuideEntry }) {
  const portrait = entry.image.kind === "photo";
  return (
    <Link
      href={guideHref(entry.system, entry.id)}
      aria-label={`${entry.name}の詳細を見る`}
      className="group flex flex-col gap-1.5 text-cream"
    >
      <span
        data-shape={portrait ? "portrait" : "square"}
        className={`relative flex items-center justify-center overflow-hidden rounded-[14px] border border-gold/25 bg-popover transition-colors group-hover:border-gold/60 ${
          portrait ? "aspect-[3/5]" : "aspect-square"
        }`}
      >
        <GuideImageView image={entry.image} size="tile" />
      </span>
      <span className="text-center text-[11px] leading-snug lg:text-xs">{entry.name}</span>
    </Link>
  );
}
```

```tsx
// src/components/guide/guide-entry-body.tsx
import type { GuideEntry } from "@/data/guide";
import { GuideImageView } from "./guide-image";

/** 詳細シート・サイドパネルの本文(画像・キーワード・説明・運勢の一文) */
export function GuideEntryBody({ entry }: { entry: GuideEntry }) {
  const portrait = entry.image.kind === "photo";
  return (
    <div className="flex flex-col gap-3.5">
      <div
        className={`flex items-center justify-center self-center overflow-hidden rounded-[20px] border border-gold/40 bg-surface lg:rounded-3xl ${
          portrait ? "h-[200px] w-[120px]" : "h-[120px] w-[120px] lg:h-[140px] lg:w-[140px]"
        }`}
      >
        <GuideImageView image={entry.image} size="sheet" />
      </div>
      <ul className="flex flex-wrap justify-center gap-1.5" aria-label="キーワード">
        {entry.keywords.map((k) => (
          <li key={k} className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold-light">
            {k}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-[1.8]">{entry.summary}</p>
      {entry.periodNote && (
        <section className="rounded-2xl border border-gold/20 bg-background/40 p-3.5">
          <h3 className="mb-1 text-xs text-gold-dim">運勢として出たとき</h3>
          <p className="text-[13px] leading-relaxed">{entry.periodNote}</p>
        </section>
      )}
    </div>
  );
}
```

```tsx
// src/components/guide/element-detail-sheet.tsx
"use client";

import type { ReactNode } from "react";
import { DetailSheet } from "@/components/detail/detail-sheet";
import { getGuideEntry, guideHref } from "@/data/guide";
import type { ElementRef } from "@/lib/fortune/types";
import { GuideEntryBody } from "./guide-entry-body";

/**
 * 計算結果の要素(ElementRef)をタップすると、早見表の項目を詳細シート(PC幅ではサイドパネル)で開く。
 * 辞書に項目がなければ、トリガーの中身をそのまま表示する。
 */
export function ElementDetailSheet({
  element,
  children,
  className,
  triggerLabel,
}: {
  element: ElementRef;
  children: ReactNode;
  className?: string;
  triggerLabel?: string;
}) {
  const entry = getGuideEntry(element.system, element.id);
  if (!entry) return <span className={className}>{children}</span>;
  return (
    <DetailSheet
      heading={{ title: entry.name, subtitle: entry.group, description: entry.reading || entry.nameEn }}
      body={<GuideEntryBody entry={entry} />}
      guideHref={guideHref(entry.system, entry.id)}
      className={className}
      triggerLabel={triggerLabel}
    >
      {children}
    </DetailSheet>
  );
}
```


- [ ] **Step 4: テスト・lint**

Run: `npx vitest run src/components/guide && npx eslint src/components/guide`
Expected: PASS、エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/components/guide
git commit -m "feat: 早見表の画像枠・タイル・詳細の本文と、計算結果の要素から詳細を開くシートを追加"
```

---

### Task 7: 早見表の一覧(占術タブ・グループ・検索)

**Files:**
- Create: `src/components/guide/guide-browser.tsx`
- Modify: `src/app/guide/page.tsx`
- Test: `src/components/guide/__tests__/guide-browser.test.tsx`、`src/app/guide/__tests__/guide-page.test.tsx`(書き換え)

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/guide/__tests__/guide-browser.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideBrowserView } from "../guide-browser";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => replace.mockClear());

describe("GuideBrowserView", () => {
  it("占術のタブを tablist として表示し、指定のタブを選択状態にすること", () => {
    render(<GuideBrowserView tab="kyusei" />);
    const tabs = screen.getByRole("tablist", { name: "占術" });
    expect(within(tabs).getAllByRole("tab").map((t) => t.textContent)).toEqual(["タロット", "数秘術", "九星気学", "マヤ暦"]);
    expect(screen.getByRole("tab", { name: "九星気学" })).toHaveAttribute("aria-selected", "true");
  });

  it("グループごとに見出しと件数、タイルを表示すること", () => {
    render(<GuideBrowserView tab="kyusei" />);
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { name: "九星" })).toBeInTheDocument();
    expect(within(panel).getByText("9項目", { selector: "span" })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "一白水星の詳細を見る" })).toBeInTheDocument();
  });

  it("タブを押すと URL の tab を置き換えること", async () => {
    const user = userEvent.setup();
    render(<GuideBrowserView tab="tarot" />);
    await user.click(screen.getByRole("tab", { name: "マヤ暦" }));
    expect(replace).toHaveBeenCalledWith("/guide?tab=maya", { scroll: false });
  });

  it("検索すると全占術を横断した結果を表示し、タブの中身を隠すこと", async () => {
    const user = userEvent.setup();
    render(<GuideBrowserView tab="tarot" />);
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "一白");
    expect(screen.getByText(/件見つかりました/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "一白水星の詳細を見る" })).toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("該当がなければその旨を表示すること", async () => {
    const user = userEvent.setup();
    render(<GuideBrowserView tab="tarot" />);
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "存在しない言葉");
    expect(screen.getByText("該当する項目が見つかりません")).toBeInTheDocument();
  });
});
```

```tsx
// src/app/guide/__tests__/guide-page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GuidePage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("tab=numerology"),
}));

describe("早見表ページ", () => {
  it("見出しと、URL で指定した占術のタブを表示すること", () => {
    render(<GuidePage />);
    expect(screen.getByRole("heading", { level: 1, name: "早見表" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "数秘術" })).toHaveAttribute("aria-selected", "true");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/guide/__tests__/guide-browser.test.tsx src/app/guide`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/guide/guide-browser.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { guideSystems, isGuideSystemId, searchGuide, type GuideSystemId } from "@/data/guide";
import { GuideTile } from "./guide-tile";

const GRID = "grid grid-cols-4 gap-2 lg:grid-cols-10 lg:gap-2.5";

/** URL の ?tab= を読む版(Suspense の内側で使う) */
export function GuideBrowser() {
  const params = useSearchParams();
  const tab = params.get("tab");
  return <GuideBrowserView tab={tab && isGuideSystemId(tab) ? tab : "tarot"} />;
}

/** 早見表の一覧の本体。tab は表示する占術 */
export function GuideBrowserView({ tab }: { tab: GuideSystemId }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const results = searchGuide(query);
  const searching = query.trim() !== "";
  const system = guideSystems.find((s) => s.id === tab) ?? guideSystems[0];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="検索欄を開く"
          aria-expanded={searchOpen}
          aria-controls="guide-search"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/30 text-gold-light lg:hidden"
        >
          <Icon name="search" size={18} />
        </button>
        <label
          id="guide-search"
          className={`${searchOpen ? "flex" : "hidden"} min-h-11 flex-1 items-center gap-2.5 rounded-full border border-gold/30 px-4 text-gold-dim lg:flex lg:max-w-sm`}
        >
          <Icon name="search" size={16} />
          <input
            type="search"
            aria-label="早見表を検索"
            placeholder="名前・読み・キーワードで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-cream placeholder:text-gold-dim/70 focus:outline-none"
          />
        </label>
      </div>

      {searching ? (
        <section aria-label="検索結果" className="flex flex-col gap-3">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-gold-dim">該当する項目が見つかりません</p>
          ) : (
            <>
              <p className="text-xs text-gold-dim">{results.length}件見つかりました</p>
              <ul className={GRID}>
                {results.map((e) => (
                  <li key={`${e.system}:${e.id}`}>
                    <GuideTile entry={e} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <>
          <div role="tablist" aria-label="占術" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {guideSystems.map((s) => {
              const selected = s.id === system.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`guide-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls="guide-tabpanel"
                  onClick={() => router.replace(`/guide?tab=${s.id}`, { scroll: false })}
                  className={`flex min-h-[38px] flex-none items-center whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold lg:min-h-10 lg:px-[18px] lg:text-sm ${
                    selected ? "border-gold bg-gold text-background" : "border-gold/30 text-gold-dim hover:text-cream"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="guide-tabpanel"
            aria-labelledby={`guide-tab-${system.id}`}
            className="flex flex-col gap-[22px] lg:gap-7"
          >
            {system.groups.map((group) => (
              <section key={group.name} aria-labelledby={`group-${system.id}-${group.name}`} className="flex flex-col gap-2.5 lg:gap-3">
                <h2 id={`group-${system.id}-${group.name}`} className="flex items-baseline gap-2 font-heading text-base lg:text-lg">
                  {group.name}
                  <span className="font-sans text-[11px] text-gold-dark lg:text-xs">{group.entries.length}項目</span>
                </h2>
                <ul className={GRID}>
                  {group.entries.map((e) => (
                    <li key={e.id}>
                      <GuideTile entry={e} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

```tsx
// src/app/guide/page.tsx
// 早見表ページ(新URL)。占術タブは ?tab= で指定する
import { Suspense } from "react";
import { GuideBrowser, GuideBrowserView } from "@/components/guide/guide-browser";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

export default function GuidePage() {
  return (
    <PageContainer>
      <PageHeader accent="Guide" title="早見表" />
      {/* useSearchParams を使う部品はクライアントで描画される。事前描画ではタロットのタブを出しておく */}
      <Suspense fallback={<GuideBrowserView tab="tarot" />}>
        <GuideBrowser />
      </Suspense>
    </PageContainer>
  );
}
```

※ タイトル行の見出しには `h1`(PageHeader)、グループには `h2` を使う。

- [ ] **Step 4: テスト・lint**

Run: `npx vitest run src/components/guide src/app/guide && npx eslint src/components/guide src/app/guide`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/guide src/app/guide
git commit -m "feat: 早見表を占術タブ・グループ別タイル・横断検索の新しい一覧にする"
```

---

### Task 8: 詳細ページ(占術の項目・タロット)

**Files:**
- Create: `src/components/guide/guide-detail-layout.tsx`、`src/app/guide/[system]/[id]/page.tsx`
- Modify: `src/components/card-detail.tsx`
- Test: `src/components/guide/__tests__/guide-detail.test.tsx`、`src/components/__tests__/card-detail.test.tsx`(必要に応じて更新)

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/guide/__tests__/guide-detail.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GuideEntryPage, { generateStaticParams } from "@/app/guide/[system]/[id]/page";
import { ELEMENT_IDS } from "@/lib/fortune/element-ids";

describe("早見表の項目の詳細ページ", () => {
  it("タロット以外の全項目を静的生成すること", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(ELEMENT_IDS.numerology.length + ELEMENT_IDS.kyusei.length + ELEMENT_IDS.maya.length);
    expect(params.some((p) => p.system === "tarot")).toBe(false);
  });

  it("名前・読み・キーワード・説明・関連項目・パンくずを表示すること", async () => {
    render(await GuideEntryPage({ params: Promise.resolve({ system: "maya", id: "seal-14" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "白い魔法使い" })).toBeInTheDocument();
    expect(screen.getByText("しろいまほうつかい")).toBeInTheDocument();
    expect(screen.getByText("White Wizard")).toBeInTheDocument();
    const crumbs = screen.getByRole("navigation", { name: "パンくずリスト" });
    expect(crumbs).toHaveTextContent("早見表");
    expect(crumbs).toHaveTextContent("マヤ暦");
    expect(crumbs).toHaveTextContent("太陽の紋章");
    expect(screen.getByRole("link", { name: "早見表に戻る" })).toHaveAttribute("href", "/guide?tab=maya");
    expect(screen.getByRole("heading", { name: "関連項目" })).toBeInTheDocument();
  });
});
```

`src/components/__tests__/card-detail.test.tsx` のパンくずのテストを次に置き換える(新レイアウトでは「戻る」リンクがタロットのタブを指す)。

```tsx
  it("パンくずリストと戻るリンクが表示されること", () => {
    render(<CardDetail card={mockCard} />);
    const nav = screen.getByLabelText("パンくずリスト");
    expect(nav).toHaveTextContent("早見表");
    expect(nav).toHaveTextContent("タロット");
    expect(nav).toHaveTextContent("大アルカナ");
    expect(screen.getByRole("link", { name: "早見表に戻る" })).toHaveAttribute("href", "/guide?tab=tarot");
  });
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/guide/__tests__/guide-detail.test.tsx src/components/__tests__/card-detail.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/guide/guide-detail-layout.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { PageContainer } from "@/components/page-container";
import type { GuideSystemId } from "@/data/guide";

/**
 * 早見表の詳細ページの共通レイアウト(設計書 §11.5)。
 * スマホは縦に積み、PC は左に画像・右に本文の2列にする。
 */
export function GuideDetailLayout({
  system,
  systemLabel,
  group,
  image,
  children,
}: {
  system: GuideSystemId;
  systemLabel: string;
  group: string;
  image: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageContainer className="gap-[18px]">
      <div className="flex items-center gap-2 lg:gap-3">
        <Link
          href={`/guide?tab=${system}`}
          aria-label="早見表に戻る"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/30 text-gold-light"
        >
          <Icon name="back" size={18} />
        </Link>
        <nav aria-label="パンくずリスト" className="text-xs text-gold-dim lg:text-[13px]">
          <Link href="/guide" className="hover:text-cream">
            早見表
          </Link>
          <span className="mx-1">/</span>
          <Link href={`/guide?tab=${system}`} className="hover:text-cream">
            {systemLabel}
          </Link>
          <span className="mx-1">/</span>
          <span>{group}</span>
        </nav>
      </div>
      <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="self-center lg:self-start">{image}</div>
        <div className="flex flex-col gap-5">{children}</div>
      </div>
    </PageContainer>
  );
}

/** 正方形の大きな画像枠(内側にもう一重の枠) */
export function GuideDetailFrame({ children, portrait = false }: { children: ReactNode; portrait?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-gold/35 bg-popover ${
        portrait
          ? "w-[220px] rounded-[20px] lg:w-[300px]"
          : "aspect-square w-[220px] rounded-[28px] lg:w-[360px]"
      }`}
    >
      {!portrait && <span aria-hidden="true" className="absolute inset-3.5 rounded-[18px] border border-gold/15" />}
      {children}
    </div>
  );
}
```

```tsx
// src/app/guide/[system]/[id]/page.tsx
// 早見表の項目の詳細ページ(数秘術・九星気学・マヤ暦。タロットは /guide/tarot/[id])
import { notFound } from "next/navigation";
import { GuideImageView } from "@/components/guide/guide-image";
import { GuideDetailFrame, GuideDetailLayout } from "@/components/guide/guide-detail-layout";
import { GuideTile } from "@/components/guide/guide-tile";
import { getGuideEntry, guideSystems } from "@/data/guide";

export const dynamicParams = false;

export function generateStaticParams() {
  return guideSystems
    .filter((s) => s.id !== "tarot")
    .flatMap((s) => s.groups.flatMap((g) => g.entries.map((e) => ({ system: s.id, id: e.id }))));
}

export default async function GuideEntryPage({ params }: { params: Promise<{ system: string; id: string }> }) {
  const { system, id } = await params;
  const entry = system === "tarot" ? undefined : getGuideEntry(system, id);
  if (!entry) notFound();
  const systemLabel = guideSystems.find((s) => s.id === entry.system)?.label ?? "";
  const related = (entry.related ?? []).map((r) => getGuideEntry(entry.system, r)).filter((e) => e !== undefined);

  return (
    <GuideDetailLayout
      system={entry.system}
      systemLabel={systemLabel}
      group={entry.group}
      image={
        <GuideDetailFrame>
          <GuideImageView image={entry.image} size="detail" />
        </GuideDetailFrame>
      }
    >
      <header className="flex flex-col gap-1 text-center lg:text-left">
        <h1 className="font-heading text-[30px] leading-tight lg:text-4xl">{entry.name}</h1>
        <p className="text-[13px] text-gold-dim lg:text-sm">{entry.reading}</p>
        {entry.nameEn && <p className="font-accent text-base leading-none text-gold-dark lg:text-xl">{entry.nameEn}</p>}
      </header>
      <ul className="flex flex-wrap justify-center gap-1.5 lg:justify-start" aria-label="キーワード">
        {entry.keywords.map((k) => (
          <li key={k} className="rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold-light">
            {k}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-[1.9] lg:max-w-[520px] lg:text-[15px]">{entry.summary}</p>
      {entry.periodNote && (
        <section className="rounded-2xl border border-gold/20 bg-surface p-4 lg:max-w-[520px]">
          <h2 className="mb-1 text-xs text-gold-dim">運勢として出たとき</h2>
          <p className="text-sm leading-relaxed">{entry.periodNote}</p>
        </section>
      )}
      {related.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="font-heading text-[15px] lg:text-base">関連項目</h2>
          <ul className="grid grid-cols-4 gap-2 lg:grid-cols-[repeat(5,88px)] lg:gap-2.5">
            {related.map((r) => (
              <li key={r.id}>
                <GuideTile entry={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </GuideDetailLayout>
  );
}
```

`src/components/card-detail.tsx` を次に置き換える(`"use client"` は不要になる。`TarotCardMeaningTabs` はクライアント部品のまま)。

```tsx
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { GuideDetailFrame, GuideDetailLayout } from "@/components/guide/guide-detail-layout";
import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";
import { arcanaLabel } from "@/lib/tarot-utils";

/** タロットのカードの詳細ページ(早見表の共通レイアウト+正逆タブ) */
export function CardDetail({ card }: { card: TarotCard }) {
  const group = arcanaLabel(card);
  return (
    <GuideDetailLayout
      system="tarot"
      systemLabel="タロット"
      group={group}
      image={
        <GuideDetailFrame portrait>
          <Image src={card.imagePath} alt={card.name.ja} width={300} height={500} className="h-auto w-full" priority />
        </GuideDetailFrame>
      }
    >
      <header className="flex flex-col gap-1 text-center lg:text-left">
        <p className="text-xs text-gold-dim">{arcanaLabel(card)}</p>
        <h1 className="font-heading text-[30px] leading-tight lg:text-4xl">{card.name.ja}</h1>
        <p className="font-accent text-base leading-none text-gold-dark lg:text-xl">{card.name.en}</p>
      </header>
      <TarotCardMeaningTabs card={card} />
    </GuideDetailLayout>
  );
}
```

※ 小アルカナのグループ名は `arcanaLabel` の値(例「ワンド(杖)」)になる。

- [ ] **Step 4: テスト・lint・型**

Run: `npx vitest run && npx tsc --noEmit && npx eslint src/components src/app/guide`
Expected: PASS(既存の `card-detail.test.tsx` の他のテスト — 見出し、正逆タブ、運勢 — も通ること)

- [ ] **Step 5: コミットする**

```bash
git add src/components src/app/guide
git commit -m "feat: 早見表の項目の詳細ページを追加し、タロットの詳細を共通の新レイアウトにする"
```

---

### Task 9: 旧一覧部品の削除と E2E の更新

**Files:**
- Delete: `src/components/card-browser.tsx`、`card-grid.tsx`、`card-list.tsx`、`card-tile.tsx` と `src/components/__tests__/card-browser.test.tsx`、`card-grid.test.tsx`、`card-list.test.tsx`、`card-tile.test.tsx`
- Delete: `e2e/cards-grid.spec.ts`
- Create: `e2e/guide.spec.ts`
- Modify: `e2e/card-detail.spec.ts`

- [ ] **Step 1: 使われていないことを確認して削除する**

Run: `grep -rn "card-browser\|card-grid\|card-list\|card-tile" src --include=*.tsx --include=*.ts | grep -v __tests__`
Expected: 出力なし(あれば削除せずに報告する)

Run: `git rm src/components/card-browser.tsx src/components/card-grid.tsx src/components/card-list.tsx src/components/card-tile.tsx src/components/__tests__/card-browser.test.tsx src/components/__tests__/card-grid.test.tsx src/components/__tests__/card-list.test.tsx src/components/__tests__/card-tile.test.tsx e2e/cards-grid.spec.ts`

- [ ] **Step 2: E2E を書く**

```ts
// e2e/guide.spec.ts
import { test, expect } from "@playwright/test";

test.describe("早見表", () => {
  test("初期表示はタロットのタブで78枚のカードがあること", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByRole("heading", { level: 1, name: "早見表" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "タロット" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("link", { name: /の詳細を見る/ })).toHaveCount(78);
  });

  test("タブを切り替えると URL と一覧が変わること", async ({ page }) => {
    await page.goto("/guide");
    await page.getByRole("tab", { name: "九星気学" }).click();
    await expect(page).toHaveURL("/guide?tab=kyusei");
    await expect(page.getByRole("link", { name: "一白水星の詳細を見る" })).toBeVisible();
  });

  test("URL の tab で初期タブを指定できること", async ({ page }) => {
    await page.goto("/guide?tab=maya");
    await expect(page.getByRole("tab", { name: "マヤ暦" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "白い魔法使いの詳細を見る" })).toBeVisible();
  });

  test("全占術を横断して検索できること", async ({ page, isMobile }) => {
    await page.goto("/guide");
    if (isMobile) await page.getByRole("button", { name: "検索欄を開く" }).click();
    await page.getByRole("searchbox", { name: "早見表を検索" }).fill("一白");
    await expect(page.getByText(/件見つかりました/)).toBeVisible();
    await expect(page.getByRole("link", { name: "一白水星の詳細を見る" })).toBeVisible();
  });

  test("項目の詳細ページに遷移し、戻れること", async ({ page }) => {
    await page.goto("/guide?tab=numerology");
    await page.getByRole("link", { name: "7の詳細を見る" }).click();
    await expect(page).toHaveURL("/guide/numerology/number-7");
    await expect(page.getByRole("heading", { level: 1, name: "7" })).toBeVisible();
    await page.getByRole("link", { name: "早見表に戻る" }).click();
    await expect(page).toHaveURL("/guide?tab=numerology");
  });

  test("早見表ナビがアクティブであること", async ({ page }) => {
    await page.goto("/guide");
    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "早見表" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
```

`e2e/card-detail.spec.ts` を次のように変更する。
- 「パンくずリストから早見表に戻れること」: `page.getByRole("link", { name: "早見表に戻る" }).click()` のあと `await expect(page).toHaveURL("/guide?tab=tarot");` にする。
- 「早見表のカードリンクから詳細に遷移できること」: `page.goto("/guide")` のあと `page.getByRole("tabpanel").getByRole("link", { name: "愚者の詳細を見る" }).click()` にする。
- ほかのテスト(見出し・正逆タブ・運勢・404)はそのまま。

- [ ] **Step 3: E2E を実行する**

Run: `npx playwright test e2e/guide.spec.ts e2e/card-detail.spec.ts e2e/redirects.spec.ts e2e/navigation.spec.ts`
Expected: すべて PASS(両プロジェクト)

- [ ] **Step 4: 全体の検証**

Run: `npx vitest run && npx tsc --noEmit && npx eslint src && npm run build`
Expected: PASS。lint は作業前からある `card-browser.tsx` のエラーがファイル削除で消え、エラー0件になること。ビルドで `out/guide/kyusei/star-1.html` などが生成されること。

Run: `ls out/guide/numerology | head -3 && ls out/guide/maya | wc -l`
Expected: `number-1.html` など。maya は47ファイル(+ `.txt` などの付随ファイル)

Run: `npx playwright test`
Expected: すべて PASS

- [ ] **Step 5: コミットする**

```bash
git add -A src e2e
git commit -m "refactor: 旧カード一覧の部品を削除し、早見表のE2Eテストを新しい画面に合わせる"
```
