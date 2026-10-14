# フェーズ1C: 運勢の画面(プロフィール・運勢ページ・ホーム・プロンプト) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生年月日プロフィールの入力画面を作り、運勢ページに「今日・今月・今年」のタブ、占術ごとの運勢カード、人物像、総合鑑定プロンプトを表示する。ホームには今日の運勢のチップ、サイドナビにはプロフィールの要約を出す。

**Architecture:** 計算は 1A の `readAll(profile, today)`、文章は 1B の辞書(`composeHeadline` と `FactDetailSheet`)を使う。計算エンジン(astronomy-engine を含む)は `next/dynamic`(`ssr: false`)で読み込む部品の中だけで import し、ほかのページのバンドルに入れない。プロフィールは `useBirthProfile()`(localStorage を購読)で全画面が共有する。

**Tech Stack:** Next.js 16(静的エクスポート)、React 19、Tailwind CSS v4、Base UI(Accordion)、Vitest、Playwright

**設計書:** `docs/superpowers/specs/2026-10-14-birth-fortune-design.md` §8、§10.2、§11.1、§11.2、§11.4。デザインは `docs/design/claude-design/Fortune.dc.html`(参照用に保存済み)

---

## 前提知識(実装者向け)

- テスト: `npx vitest run <パス>`、型: `npx tsc --noEmit`、lint: `npx eslint <パス>`、E2E: `npx playwright test <パス>`(ポート3100で dev サーバーを自動起動。同じディレクトリで別の `next dev` が動いていたら止める)。
- **絵文字・記号文字は使わない。** アイコンは `Icon`。新しいコードで `useEffect` 内の `setState` は禁止(lint の `react-hooks/set-state-in-effect`)。コメントは日本語。
- Next.js の API(`next/dynamic`、`useRouter`)は `node_modules/next/dist/docs/` を確認してから使う。`dynamic(..., { ssr: false })` はクライアント部品の中でだけ使える。
- 使う既存部品・関数:
  - `useBirthProfile()` / `saveBirthProfile()` / `clearBirthProfile()`(`src/lib/fortune/profile-storage.ts`)
  - `readAll(profile, today)` / `fortuneSystems`(`src/lib/fortune/registry.ts`)、型 `SystemReading` / `Fact` / `PeriodResult` / `Period` / `BirthProfile`(`types.ts`)、`prefectures` / `findPrefecture`(`prefectures.ts`)、`isValidLocalDate` / `daysInMonth` / `LocalDate`(`local-date.ts`)
  - `composeHeadline` / `getGuideEntry`(`src/data/guide/index.ts`)、`FactDetailSheet`(`src/components/guide/fact-detail-sheet.tsx`。children は `<button>` の中に入るので span とテキストだけ)
  - `DetailPanelLayout`、`DailyTarotCard`、`useDailyDraw`(`src/lib/use-daily-draw.ts`)、`useToday`(Date | null)、`PageContainer`、`PageHeader`、`Icon`、`button-styles.ts`(`primaryButton` / `secondaryButton` / `outlineButton`)、`formatJaDate` / `formatJaWeekday`
  - UI 部品 `Accordion` / `AccordionItem` / `AccordionTrigger` / `AccordionContent`(`src/components/ui/accordion.tsx`)
- 「今日」は `useToday()` の Date から `{ year, month, day }` を作って計算に渡す。
- 設計書のデザイン規則(§10.1): 運勢カードは角丸20px・surface・枠 gold/25、チップは高さ34px・ピル型・gold 10%地・枠 gold/30(ラベル11px gold-dim、値13px 太字)、アコーディオンの見出しは高さ52px、候補の表示はテラコッタ色の小さな丸+文字。

## ファイル構成

| 種別 | パス | 責務 |
|---|---|---|
| 新規 | `src/lib/fortune/profile-format.ts` | プロフィールの表記(要約・時刻・出生地・性別) |
| 新規 | `src/lib/fortune/prompt.ts` | 総合鑑定プロンプトの生成 |
| 新規 | `src/lib/fortune/system-names.ts` | 計算エンジンを読み込まずに使える占術名の一覧 |
| 新規 | `src/components/fortune/fact-chip.tsx` | 要素のチップ(タップで詳細) |
| 新規 | `src/components/fortune/period-tabs.tsx` | 今日・今月・今年のタブ |
| 新規 | `src/components/fortune/system-period-card.tsx` | 占術ごとの運勢カード |
| 新規 | `src/components/fortune/natal-section.tsx` | 「あなたについて」(人物像のアコーディオン) |
| 新規 | `src/components/fortune/prompt-card.tsx` | 総合鑑定プロンプトのカード |
| 新規 | `src/components/fortune/fortune-readings.tsx` | 計算結果を使う運勢ページ本体(動的に読み込む) |
| 新規 | `src/components/fortune/signup-card.tsx` | 未登録時の登録への誘導 |
| 変更 | `src/components/fortune/fortune-content.tsx` | プロフィールの要約・候補表示・動的読み込み |
| 新規 | `src/components/profile/profile-page.tsx`、`profile-form.tsx`、`profile-preview.tsx` | プロフィール入力と、PCの「この入力で分かること」 |
| 新規 | `src/app/fortune/profile/page.tsx` | プロフィール入力ページ |
| 新規 | `src/components/home-fortune-chips.tsx` | ホームの今日の運勢のチップ(動的に読み込む) |
| 変更 | `src/components/home-content.tsx` | 登録済み/未登録の表示を追加 |
| 新規 | `src/components/profile-summary-box.tsx` | サイドナビ下部のプロフィール要約 |
| 変更 | `src/components/side-nav.tsx` | 要約を組み込む |
| 新規 | `e2e/profile-fortune.spec.ts` | 登録〜運勢ページ〜プロンプトのE2E |

---

### Task 1: プロフィールの表記と総合鑑定プロンプト

**Files:**
- Create: `src/lib/fortune/profile-format.ts`、`src/lib/fortune/prompt.ts`
- Test: `src/lib/fortune/__tests__/profile-format.test.ts`、`src/lib/fortune/__tests__/prompt.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/fortune/__tests__/profile-format.test.ts
import { describe, it, expect } from "vitest";
import { formatBirthTime, formatGender, formatPrefecture, formatProfileSummary } from "../profile-format";
import type { BirthProfile } from "../types";

const base: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("profile-format", () => {
  it("時刻の表記", () => {
    expect(formatBirthTime({ kind: "unknown" })).toBe("時刻不明");
    expect(formatBirthTime({ kind: "half", half: "am" })).toBe("午前");
    expect(formatBirthTime({ kind: "half", half: "pm" })).toBe("午後");
    expect(formatBirthTime({ kind: "hour", hour: 14 })).toBe("14時台");
  });

  it("出生地と性別の表記", () => {
    expect(formatPrefecture("13")).toBe("東京都");
    expect(formatPrefecture(undefined)).toBe("出生地未入力");
    expect(formatGender("male")).toBe("男性");
    expect(formatGender("female")).toBe("女性");
    expect(formatGender(undefined)).toBe("回答なし");
  });

  it("要約(デザインの表記)", () => {
    expect(formatProfileSummary(base)).toBe("1990/3/29 生 · 14時台 · 東京都");
    expect(formatProfileSummary({ ...base, time: { kind: "unknown" }, prefecture: undefined })).toBe("1990/3/29 生 · 時刻不明");
  });
});
```

```ts
// src/lib/fortune/__tests__/prompt.test.ts
import { describe, it, expect } from "vitest";
import { generateFortunePrompt } from "../prompt";
import { readAll } from "../registry";
import { getCardById } from "@/data/cards";
import type { BirthProfile } from "../types";

const today = { year: 2026, month: 10, day: 14 };
const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("generateFortunePrompt", () => {
  const readings = readAll(profile, today);
  const prompt = generateFortunePrompt({
    profile,
    readings,
    period: "day",
    today,
    question: "",
    tarot: { card: getCardById("major-17")!, isReversed: false },
  });

  it("設計書 §8 の見出しと順番で構成すること", () => {
    const order = ["■ 生年月日", "■ 鑑定日", "■ 相談内容", "── 人物像 ──", "── 今日の運勢 ──", "── 今日の1dayタロット ──", "── 採用している方式 ──", "── 依頼 ──"];
    const positions = order.map((h) => prompt.indexOf(h));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("基本情報と相談内容(未入力)", () => {
    expect(prompt).toContain("■ 生年月日: 1990年3月29日 / 出生時刻: 14時台 / 出生地: 東京都 / 性別: 回答なし");
    expect(prompt).toContain("■ 鑑定日: 2026年10月14日 / 対象期間: 今日");
    expect(prompt).toContain("■ 相談内容: 特になし(総合的な鑑定)");
  });

  it("各占術の人物像・運勢・方式を含むこと", () => {
    for (const r of readings) {
      expect(prompt).toContain(`【${r.name}】`);
      expect(prompt).toContain(r.method);
      expect(prompt).toContain(r.periods.day.rangeLabel);
    }
    expect(prompt).toContain("ライフパス: 33");
  });

  it("1dayタロットの結果", () => {
    expect(prompt).toContain("星(正位置) キーワード:");
  });

  it("相談内容・未抽選・期間の切り替え", () => {
    const p = generateFortunePrompt({ profile, readings, period: "year", today, question: "転職すべき?", tarot: null });
    expect(p).toContain("■ 相談内容: 転職すべき?");
    expect(p).toContain("── 今年の運勢 ──");
    expect(p).toContain("対象期間: 今年");
    expect(p).toContain("未抽選");
  });

  it("候補がある項目は「A または B(出生時刻が曖昧なため候補)」と書くこと", () => {
    const amb: BirthProfile = { version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } };
    const p = generateFortunePrompt({ profile: amb, readings: readAll(amb, today), period: "day", today, question: "", tarot: null });
    expect(p).toContain("本命星: 二黒土星 または 一白水星(出生時刻が曖昧なため候補)");
    expect(p).toContain("出生地: 未入力(明石を基準に計算)");
  });

  it("絵文字を含まないこと", () => {
    expect(prompt).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/fortune/__tests__/profile-format.test.ts src/lib/fortune/__tests__/prompt.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/fortune/profile-format.ts
import { findPrefecture } from "./prefectures";
import type { BirthProfile, BirthTime } from "./types";

export function formatBirthTime(time: BirthTime): string {
  if (time.kind === "unknown") return "時刻不明";
  if (time.kind === "half") return time.half === "am" ? "午前" : "午後";
  return `${time.hour}時台`;
}

export function formatPrefecture(code: BirthProfile["prefecture"]): string {
  return (code && findPrefecture(code)?.name) || "出生地未入力";
}

export function formatGender(gender: BirthProfile["gender"]): string {
  if (gender === "male") return "男性";
  if (gender === "female") return "女性";
  return "回答なし";
}

/** 例: 1990/3/29 生 · 14時台 · 東京都(出生地未入力なら省く) */
export function formatProfileSummary(profile: BirthProfile): string {
  const { year, month, day } = profile.date;
  const parts = [`${year}/${month}/${day} 生`, formatBirthTime(profile.time)];
  if (profile.prefecture) parts.push(formatPrefecture(profile.prefecture));
  return parts.join(" · ");
}
```

```ts
// src/lib/fortune/prompt.ts
import type { TarotCard } from "@/data/types";
import { composeHeadline } from "@/data/guide";
import type { LocalDate } from "./local-date";
import { formatBirthTime, formatGender, formatPrefecture } from "./profile-format";
import type { BirthProfile, Fact, Period, SystemReading } from "./types";

const PERIOD_LABEL: Record<Period, string> = { day: "今日", month: "今月", year: "今年" };

export interface FortunePromptInput {
  profile: BirthProfile;
  readings: SystemReading[];
  period: Period;
  today: LocalDate;
  question: string;
  tarot: { card: TarotCard; isReversed: boolean } | null;
}

/** 候補がある事実は「A または B(出生時刻が曖昧なため候補)」にする */
function factText(f: Fact): string {
  if (f.candidates && f.candidates.length > 1) {
    return `${f.label}: ${f.candidates.map((c) => c.value).join(" または ")}(出生時刻が曖昧なため候補)`;
  }
  return `${f.label}: ${f.value}`;
}

/** 総合鑑定プロンプト(設計書 §8)。ユーザーが自分で契約している生成AIに貼り付けて使う */
export function generateFortunePrompt(input: FortunePromptInput): string {
  const { profile, readings, period, today, question, tarot } = input;
  const p = PERIOD_LABEL[period];
  const { year, month, day } = profile.date;
  const place = profile.prefecture ? formatPrefecture(profile.prefecture) : "未入力(明石を基準に計算)";
  const time = profile.time.kind === "unknown" ? "不明" : formatBirthTime(profile.time);

  const natal = readings.map((r) => `【${r.name}】${r.natal.map(factText).join(" / ")}`);
  const periods = readings.map((r) => {
    const result = r.periods[period];
    const lines = [
      `【${r.name}】(期間: ${result.rangeLabel})${composeHeadline(result.headline)}`,
      `  ${result.chips.map(factText).join(" / ")}`,
    ];
    if (result.note) lines.push(`  注記: ${result.note}`);
    return lines.join("\n");
  });
  const tarotLine = tarot
    ? `${tarot.card.name.ja}(${tarot.isReversed ? "逆位置" : "正位置"}) キーワード: ${(tarot.isReversed
        ? tarot.card.keywords.reversed
        : tarot.card.keywords.upright
      ).join("・")}`
    : "未抽選";

  return `あなたはプロの占い師です。東洋・西洋の複数の占術の結果を統合し、相談者にわかりやすく鑑定してください。

■ 生年月日: ${year}年${month}月${day}日 / 出生時刻: ${time} / 出生地: ${place} / 性別: ${formatGender(profile.gender)}
■ 鑑定日: ${today.year}年${today.month}月${today.day}日 / 対象期間: ${p}
■ 相談内容: ${question.trim() || "特になし(総合的な鑑定)"}

── 人物像 ──
${natal.join("\n")}

── ${p}の運勢 ──
${periods.join("\n")}

── 今日の1dayタロット ──
${tarotLine}

── 採用している方式 ──
${readings.map((r) => `【${r.name}】${r.method}`).join("\n")}

── 依頼 ──
1. 占術間で共通しているテーマと、矛盾している点を整理してください
2. 人物像を統合して説明してください
3. 対象期間の運勢と、具体的なアドバイスをまとめてください
4. 候補が複数ある項目は、その不確かさを踏まえて解釈してください`;
}
```

- [ ] **Step 4: テスト・型**

Run: `npx vitest run src/lib/fortune/__tests__/profile-format.test.ts src/lib/fortune/__tests__/prompt.test.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/lib/fortune
git commit -m "feat: プロフィールの表記と、7占術を統合する総合鑑定プロンプトの生成を追加"
```

---

### Task 2: チップ・期間タブ・運勢カード

**Files:**
- Create: `src/components/fortune/fact-chip.tsx`、`period-tabs.tsx`、`system-period-card.tsx`
- Test: `src/components/fortune/__tests__/period-card.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/fortune/__tests__/period-card.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PeriodTabs } from "../period-tabs";
import { SystemPeriodCard } from "../system-period-card";
import { FactChip } from "../fact-chip";
import { readAll } from "@/lib/fortune/registry";
import { composeHeadline } from "@/data/guide";

const readings = readAll(
  { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } },
  { year: 2026, month: 10, day: 14 },
);

describe("PeriodTabs", () => {
  it("今日・今月・今年のタブで、選択状態と切り替えを扱うこと", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PeriodTabs value="day" onChange={onChange} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["今日", "今月", "今年"]);
    expect(screen.getByRole("tab", { name: "今日" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "今年" }));
    expect(onChange).toHaveBeenCalledWith("year");
  });

  it("矢印キーで隣のタブに移ること", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PeriodTabs value="day" onChange={onChange} />);
    screen.getByRole("tab", { name: "今日" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("month");
  });
});

describe("FactChip", () => {
  it("ラベルと値を表示し、タップで詳細シートを開くこと", async () => {
    const user = userEvent.setup();
    const fact = readings[0].natal[0];
    render(<FactChip fact={fact} />);
    await user.click(screen.getByRole("button", { name: /ライフパス/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("SystemPeriodCard", () => {
  it("占術名・期間・一文のまとめ・チップを表示すること", () => {
    const kyusei = readings.find((r) => r.id === "kyusei")!;
    render(<SystemPeriodCard reading={kyusei} period="year" />);
    const card = screen.getByRole("article", { name: "九星気学" });
    expect(card).toHaveTextContent("Nine Star Ki");
    expect(card).toHaveTextContent(kyusei.periods.year.rangeLabel);
    expect(card).toHaveTextContent(composeHeadline(kyusei.periods.year.headline));
    for (const chip of kyusei.periods.year.chips) expect(card).toHaveTextContent(chip.label);
  });

  it("注記があれば表示すること", () => {
    const amb = readAll({ version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } }, { year: 2026, month: 10, day: 14 });
    const kyusei = amb.find((r) => r.id === "kyusei")!;
    render(<SystemPeriodCard reading={kyusei} period="day" />);
    expect(screen.getByText(kyusei.periods.day.note!)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/fortune/__tests__/period-card.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/fortune/fact-chip.tsx
"use client";

import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import type { Fact } from "@/lib/fortune/types";

/** 要素のチップ(ラベル+値)。タップで早見表の項目の詳細を開く */
export function FactChip({ fact }: { fact: Fact }) {
  return (
    <FactDetailSheet
      fact={fact}
      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 text-[13px] text-cream hover:border-gold/60 lg:min-h-8"
    >
      <span className="text-[11px] text-gold-dim">{fact.label}</span>
      <span className="font-bold">{fact.value}</span>
    </FactDetailSheet>
  );
}
```

```tsx
// src/components/fortune/period-tabs.tsx
"use client";

import { useRef, type KeyboardEvent } from "react";
import type { Period } from "@/lib/fortune/types";

const TABS: { value: Period; label: string }[] = [
  { value: "day", label: "今日" },
  { value: "month", label: "今月" },
  { value: "year", label: "今年" },
];

/** 今日・今月・今年の切り替え(3等分のセグメント。矢印キー・Home・End に対応) */
export function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    const next = (index + TABS.length) % TABS.length;
    onChange(TABS[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") move(index + 1);
    else if (e.key === "ArrowLeft") move(index - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(TABS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div
      role="tablist"
      aria-label="運勢の期間"
      className="grid grid-cols-3 gap-1 rounded-[14px] border border-gold/25 bg-popover p-1 lg:max-w-[360px]"
    >
      {TABS.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`min-h-10 rounded-[11px] text-sm font-bold transition-colors ${
              selected ? "bg-gold text-background" : "text-gold-dim hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
```

```tsx
// src/components/fortune/system-period-card.tsx
import { composeHeadline } from "@/data/guide";
import type { Period, SystemReading } from "@/lib/fortune/types";
import { FactChip } from "./fact-chip";

/** 占術ごとの運勢カード(占術名・期間・一文のまとめ・注記・チップ) */
export function SystemPeriodCard({ reading, period }: { reading: SystemReading; period: Period }) {
  const result = reading.periods[period];
  const headingId = `period-card-${reading.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-2.5 rounded-[20px] border border-gold/25 bg-surface p-4 lg:px-5 lg:py-[18px]"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-baseline gap-2">
          <span id={headingId} className="font-heading text-[17px] text-gold-light lg:text-lg">
            {reading.name}
          </span>
          <span className="font-accent text-sm text-gold-dark lg:text-[15px]">{reading.nameEn}</span>
        </h3>
        <p className="whitespace-nowrap text-[11px] text-gold-dim">{result.rangeLabel}</p>
      </header>
      <p className="text-sm leading-[1.7]">{composeHeadline(result.headline)}</p>
      {result.note && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-terracotta">
          <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-terracotta" />
          {result.note}
        </p>
      )}
      <ul className="flex flex-wrap gap-2" aria-label={`${reading.name}の要素`}>
        {result.chips.map((chip) => (
          <li key={chip.key}>
            <FactChip fact={chip} />
          </li>
        ))}
      </ul>
    </article>
  );
}
```

- [ ] **Step 4: テスト・lint**

Run: `npx vitest run src/components/fortune && npx eslint src/components/fortune`
Expected: PASS(既存の `fortune-content.test.tsx` も通ること)

- [ ] **Step 5: コミットする**

```bash
git add src/components/fortune
git commit -m "feat: 運勢の期間タブ・要素のチップ・占術ごとの運勢カードを追加"
```

---

### Task 3: 「あなたについて」と総合鑑定プロンプトのカード

**Files:**
- Create: `src/components/fortune/natal-section.tsx`、`src/components/fortune/prompt-card.tsx`
- Test: `src/components/fortune/__tests__/natal-prompt.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/fortune/__tests__/natal-prompt.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NatalSection } from "../natal-section";
import { PromptCard } from "../prompt-card";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } };
const today = { year: 2026, month: 10, day: 14 };
const readings = readAll(profile, today);

describe("NatalSection", () => {
  it("見出しと占術ごとのアコーディオンを表示すること", async () => {
    const user = userEvent.setup();
    render(<NatalSection readings={readings} />);
    expect(screen.getByRole("heading", { name: "あなたについて" })).toBeInTheDocument();
    for (const r of readings) expect(screen.getByRole("button", { name: r.name })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "マヤ暦" }));
    const maya = readings.find((r) => r.id === "maya")!;
    expect(screen.getByText(maya.natal[0].value)).toBeInTheDocument();
  });

  it("候補がある事実を候補として表示すること", async () => {
    const user = userEvent.setup();
    const amb = readAll({ version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } }, today);
    render(<NatalSection readings={amb} />);
    await user.click(screen.getByRole("button", { name: "九星気学" }));
    expect(screen.getAllByText(/候補/).length).toBeGreaterThan(0);
  });
});

describe("PromptCard", () => {
  it("相談内容を含めたプロンプトをクリップボードにコピーすること", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<PromptCard profile={profile} readings={readings} period="month" today={today} tarot={null} />);
    await user.type(screen.getByRole("textbox", { name: "相談したいこと(任意)" }), "仕事のこと");
    await user.click(screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("■ 相談内容: 仕事のこと");
    expect(writeText.mock.calls[0][0]).toContain("── 今月の運勢 ──");
    expect(await screen.findByText("コピーしました")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/fortune/__tests__/natal-prompt.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

人物像は、各占術の最初の3つの事実を「同じ高さのタイル」(ラベル28px・値56pxの固定行)で、残りを一覧の行で表示する。説明文は最初の事実が参照する辞書の項目の `summary`。

```tsx
// src/components/fortune/natal-section.tsx
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import { getGuideEntry } from "@/data/guide";
import type { Fact, SystemReading } from "@/lib/fortune/types";

/** 1つの事実のタイル(タップで詳細) */
function FactTile({ fact }: { fact: Fact }) {
  const long = [...fact.value].length > 4;
  return (
    <FactDetailSheet
      fact={fact}
      className="grid h-full w-full grid-rows-[28px_56px] items-center justify-items-center rounded-xl bg-popover px-1.5 py-2.5 text-center hover:bg-popover/70"
    >
      <span className="self-start text-[10px] leading-tight text-gold-dim">{fact.label}</span>
      <span
        className={`font-heading leading-[1.15] break-keep ${fact.candidates ? "text-terracotta" : "text-gold-light"} ${
          long ? "text-[15px]" : "text-2xl"
        }`}
      >
        {fact.candidates ? fact.candidates.map((c) => c.value).join(" / ") : fact.value}
      </span>
    </FactDetailSheet>
  );
}

function CandidateNote({ fact }: { fact: Fact }) {
  if (!fact.candidates) return null;
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-terracotta">
      <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-terracotta" />
      {fact.label} 候補: {fact.candidates.map((c) => `${c.value}(${c.rangeLabel})`).join(" / ")}
    </p>
  );
}

/** 「あなたについて」。占術ごとの人物像をアコーディオンで表示する */
export function NatalSection({ readings }: { readings: SystemReading[] }) {
  return (
    <section aria-labelledby="natal-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <p className="font-accent text-xl leading-none text-gold">About you</p>
        <h2 id="natal-heading" className="font-heading text-xl">
          あなたについて
        </h2>
      </div>
      <Accordion className="flex flex-col gap-2">
        {readings.map((r) => {
          const tiles = r.natal.slice(0, 3);
          const rows = r.natal.slice(3);
          const first = r.natal[0]?.refs[0];
          const summary = first ? getGuideEntry(first.system, first.id)?.summary : undefined;
          return (
            <AccordionItem
              key={r.id}
              value={r.id}
              className="overflow-hidden rounded-2xl border border-gold/25 bg-surface"
            >
              <AccordionTrigger className="min-h-[52px] px-4 font-heading text-base text-cream">{r.name}</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3 px-4 pb-4">
                <ul className="grid grid-cols-3 gap-2">
                  {tiles.map((f) => (
                    <li key={f.key}>
                      <FactTile fact={f} />
                    </li>
                  ))}
                </ul>
                {rows.length > 0 && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                    {rows.map((f) => (
                      <div key={f.key} className="contents">
                        <dt className="text-gold-dim">{f.label}</dt>
                        <dd>
                          <FactDetailSheet fact={f} className="text-left underline decoration-gold/30 underline-offset-4 hover:text-gold-light">
                            {f.value}
                          </FactDetailSheet>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {r.natal.map((f) => (
                  <CandidateNote key={f.key} fact={f} />
                ))}
                {summary && <p className="text-[13px] leading-[1.7]">{summary}</p>}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
```

※ `Accordion` 系のクラス・props は `src/components/ui/accordion.tsx` の実装に合わせて調整する(Base UI の Accordion。`AccordionTrigger` にシェブロンが含まれているか確認し、なければ `Icon name="chev"` を足して開閉で180°回転させる)。

```tsx
// src/components/fortune/prompt-card.tsx
"use client";

import { useId, useState } from "react";
import type { TarotCard } from "@/data/types";
import { Icon } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import type { LocalDate } from "@/lib/fortune/local-date";
import { generateFortunePrompt } from "@/lib/fortune/prompt";
import type { BirthProfile, Period, SystemReading } from "@/lib/fortune/types";

/** 総合鑑定プロンプトのカード(相談内容の入力欄とコピー) */
export function PromptCard({
  profile,
  readings,
  period,
  today,
  tarot,
}: {
  profile: BirthProfile;
  readings: SystemReading[];
  period: Period;
  today: LocalDate;
  tarot: { card: TarotCard; isReversed: boolean } | null;
}) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const inputId = useId();

  const copy = async () => {
    const prompt = generateFortunePrompt({ profile, readings, period, today, question, tarot });
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="flex flex-col gap-2.5 rounded-[20px] border border-dashed border-gold/40 bg-popover p-4 lg:p-[18px]"
    >
      <h2 id={`${inputId}-heading`} className="font-heading text-base">
        総合鑑定プロンプト
      </h2>
      <p className="text-xs leading-relaxed text-gold-dim">
        占術の結果と1dayタロットをまとめた鑑定用プロンプトを作成します。ChatGPT や Claude などに貼り付けて使えます。
      </p>
      <label htmlFor={inputId} className="sr-only">
        相談したいこと(任意)
      </label>
      <textarea
        id={inputId}
        placeholder="相談したいこと(任意)"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="min-h-[72px] w-full resize-none rounded-xl border border-gold/30 bg-background px-3 py-2.5 text-sm text-cream placeholder:text-gold-dim/70 focus:border-gold/60 focus:outline-none lg:min-h-20"
      />
      <button type="button" onClick={copy} className={primaryButton}>
        <Icon name={status === "copied" ? "check" : "copy"} size={18} strokeWidth={1.8} />
        総合鑑定プロンプトをコピー
      </button>
      <p role="status" className="min-h-4 text-center text-xs text-gold-light">
        {status === "copied" ? "コピーしました" : status === "failed" ? "コピーできませんでした" : ""}
      </p>
    </section>
  );
}
```

- [ ] **Step 4: テスト・lint**

Run: `npx vitest run src/components/fortune && npx eslint src/components/fortune`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/fortune
git commit -m "feat: 運勢ページの「あなたについて」と総合鑑定プロンプトのカードを追加"
```

---

### Task 4: 運勢ページの組み立て(動的読み込み・未登録時の誘導・PCの2カラム)

**Files:**
- Create: `src/lib/fortune/system-names.ts`、`src/components/fortune/fortune-readings.tsx`、`src/components/fortune/signup-card.tsx`
- Modify: `src/components/fortune/fortune-content.tsx`
- Test: `src/components/fortune/__tests__/fortune-content.test.tsx`(拡張)

- [ ] **Step 1: テストを拡張する**

`src/components/fortune/__tests__/fortune-content.test.tsx` に次を追加する(既存のテストは残す。`localStorageMock` の `store` に `tarot-birth-profile` を入れて登録済みにする)。`next/dynamic` はテストでは同期的に読み込まれないので、テストファイルの先頭で次のようにモックする。

```tsx
vi.mock("next/dynamic", async () => {
  // テストでは動的読み込みをやめ、本体の部品をそのまま返す
  const m = await import("../fortune-readings");
  return { default: () => m.FortuneReadings };
});
```

```tsx
const PROFILE = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" });

describe("FortuneContent(登録済み)", () => {
  it("プロフィールの要約と編集リンクを表示すること", () => {
    store["tarot-birth-profile"] = PROFILE;
    render(<FortuneContent />);
    expect(screen.getByText("1990/3/29 生 · 14時台 · 東京都")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /編集/ })).toHaveAttribute("href", "/fortune/profile");
  });

  it("期間タブと占術ごとの運勢カード・あなたについて・プロンプトを表示すること", async () => {
    store["tarot-birth-profile"] = PROFILE;
    const user = userEvent.setup();
    render(<FortuneContent />);
    expect(screen.getByRole("tab", { name: "今日" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("article", { name: "数秘術" })).toHaveTextContent("パーソナルデー");
    await user.click(screen.getByRole("tab", { name: "今年" }));
    expect(screen.getByRole("article", { name: "数秘術" })).toHaveTextContent("パーソナルイヤー");
    expect(screen.getByRole("heading", { name: "あなたについて" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "総合鑑定プロンプトをコピー" })).toBeInTheDocument();
  });
});

describe("FortuneContent(未登録)", () => {
  it("登録への誘導を表示すること", () => {
    render(<FortuneContent />);
    expect(screen.getByRole("link", { name: "生年月日を登録する" })).toHaveAttribute("href", "/fortune/profile");
    expect(screen.queryByRole("tab", { name: "今日" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/fortune/__tests__/fortune-content.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

未登録時の誘導は計算エンジンを読み込まないよう、占術名だけを持つ軽い定数を使う。

```ts
// src/lib/fortune/system-names.ts
import type { SystemId } from "./types";

/** 実装済みの占術の名前(registry の順)。計算エンジンを読み込まずに占術名だけ使いたい画面向け */
export const FORTUNE_SYSTEM_NAMES: readonly { id: SystemId; name: string }[] = [
  { id: "numerology", name: "数秘術" },
  { id: "kyusei", name: "九星気学" },
  { id: "maya", name: "マヤ暦" },
];
```

`src/lib/fortune/__tests__/registry.test.ts` に、ずれを防ぐテストを追加する。

```ts
import { FORTUNE_SYSTEM_NAMES } from "../system-names";

  it("FORTUNE_SYSTEM_NAMES が fortuneSystems と一致すること", () => {
    expect(FORTUNE_SYSTEM_NAMES).toEqual(fortuneSystems.map((s) => ({ id: s.id, name: s.name })));
  });
```

```tsx
// src/components/fortune/signup-card.tsx
import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import { FORTUNE_SYSTEM_NAMES } from "@/lib/fortune/system-names";

/** 未登録時の、生年月日の登録への誘導 */
export function SignupCard({ className = "" }: { className?: string }) {
  return (
    <section aria-label="生年月日の登録" className={`flex flex-col gap-2.5 ${className}`}>
      <p className="text-sm leading-[1.7]">
        生年月日を登録すると、{FORTUNE_SYSTEM_NAMES.length}つの占術で今日・今月・今年の運勢が見られます。
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {FORTUNE_SYSTEM_NAMES.map((s) => (
          <li key={s.id} className="rounded-full border border-gold/20 px-2.5 py-0.5 text-[11px] text-gold-dim">
            {s.name}
          </li>
        ))}
      </ul>
      <Link href="/fortune/profile" className={primaryButton}>
        <Icon name="cal" size={16} strokeWidth={2} />
        生年月日を登録する
      </Link>
    </section>
  );
}
```

```tsx
// src/components/fortune/fortune-readings.tsx
"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { LocalDate } from "@/lib/fortune/local-date";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile, Period } from "@/lib/fortune/types";
import { useDailyDraw } from "@/lib/use-daily-draw";
import { NatalSection } from "./natal-section";
import { PeriodTabs } from "./period-tabs";
import { PromptCard } from "./prompt-card";
import { SystemPeriodCard } from "./system-period-card";

/**
 * 計算結果を使う運勢ページの本体。計算エンジンを含むので fortune-content から動的に読み込む。
 * PC(1280px〜)は左に1dayタロット・タブ・運勢カード、右に人物像とプロンプトの2カラム。
 */
export function FortuneReadings({
  profile,
  today,
  tarotSlot,
}: {
  profile: BirthProfile;
  today: LocalDate;
  tarotSlot: ReactNode;
}) {
  const [period, setPeriod] = useState<Period>("day");
  const readings = useMemo(() => readAll(profile, today), [profile, today]);
  const { draw, card } = useDailyDraw();
  const tarot = draw && card ? { card, isReversed: draw.isReversed } : null;

  return (
    <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] xl:items-start xl:gap-7">
      <div className="flex min-w-0 flex-col gap-4">
        {tarotSlot}
        <div className="sticky top-[env(safe-area-inset-top,0px)] z-[5] bg-background py-1.5">
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
        <section aria-label="運勢" className="flex flex-col gap-4">
          {readings.map((r) => (
            <SystemPeriodCard key={r.id} reading={r} period={period} />
          ))}
        </section>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <NatalSection readings={readings} />
        <PromptCard profile={profile} readings={readings} period={period} today={today} tarot={tarot} />
      </div>
    </div>
  );
}
```

`src/components/fortune/fortune-content.tsx` を次に置き換える。

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { DailyTarotCard } from "@/components/daily-tarot-card";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import { Icon } from "@/components/icons/icon";
import { PageContainer } from "@/components/page-container";
import { formatJaDate, formatJaWeekday } from "@/lib/date-format";
import { formatProfileSummary } from "@/lib/fortune/profile-format";
import { useBirthProfile } from "@/lib/fortune/profile-storage";
import { useToday } from "@/lib/use-today";
import { SignupCard } from "./signup-card";

/** 計算エンジン(astronomy-engine を含む)はこのページでだけ読み込む */
const FortuneReadings = dynamic(() => import("./fortune-readings").then((m) => m.FortuneReadings), {
  ssr: false,
  loading: () => <div className="h-40 rounded-[20px] bg-surface/40" aria-busy="true" aria-label="運勢を計算しています" />,
});

/** 運勢ページ(設計書 §11.2) */
export function FortuneContent() {
  const todayDate = useToday();
  const { ready, profile } = useBirthProfile();
  const today = useMemo(
    () => (todayDate ? { year: todayDate.getFullYear(), month: todayDate.getMonth() + 1, day: todayDate.getDate() } : null),
    [todayDate],
  );

  const tarot = (
    <section aria-label="今日の1dayタロット" className="rounded-[20px] border border-gold/25 bg-surface p-4 lg:p-5">
      <DailyTarotCard variant="fortune" />
    </section>
  );

  return (
    <DetailPanelLayout>
      <PageContainer className="xl:max-w-[1100px]">
        <h1 className="sr-only">運勢</h1>
        <header className="flex items-start justify-between gap-3 px-1">
          <div className="flex flex-col gap-1">
            <p className="font-accent text-[22px] leading-none text-gold lg:text-[26px]">Today</p>
            {todayDate && (
              <p className="font-heading text-[22px] leading-tight lg:text-[30px]">
                <span>{formatJaDate(todayDate)}</span>
                <span className="ml-2 text-[13px] text-gold-dim lg:ml-2.5 lg:text-[15px]">{formatJaWeekday(todayDate)}</span>
              </p>
            )}
            {profile && <p className="text-xs text-gold-dim lg:text-[13px]">{formatProfileSummary(profile)}</p>}
          </div>
          {profile && (
            <Link
              href="/fortune/profile"
              className="flex min-h-9 flex-none items-center gap-1 rounded-full border border-gold/30 px-2.5 text-xs text-gold-light lg:px-4 lg:text-[13px]"
            >
              <Icon name="edit" size={14} />
              <span className="lg:hidden">編集</span>
              <span className="hidden lg:inline">プロフィールを編集</span>
            </Link>
          )}
        </header>

        {ready && profile && today ? (
          <FortuneReadings profile={profile} today={today} tarotSlot={tarot} />
        ) : (
          <>
            {tarot}
            {ready && !profile && <SignupCard className="rounded-[20px] border border-gold/25 bg-surface p-4" />}
          </>
        )}
      </PageContainer>
    </DetailPanelLayout>
  );
}
```

※ 運勢ページの見出しの下の「候補」行(デザインの「ASC 候補: …」)は、人物像のアコーディオン内の候補表示(`CandidateNote`)で代わりに示す。ヘッダーには出さない(計算エンジンを動的に読み込む前に表示できないため)。

※ `PageContainer` の `className` に渡した `xl:max-w-[1100px]` が既定の `lg:max-w-[1000px]` に勝つことを、1280px幅の目視で確認する(負ける場合は `PageContainer` に `wide` などの指定を追加する)。

- [ ] **Step 4: テスト・lint・ビルド**

Run: `npx vitest run && npx eslint src/components/fortune src/lib/fortune && npm run build`
Expected: PASS。ビルド後、`/` や `/guide` の JS に astronomy-engine が入っていないことを確認する:

Run: `grep -l "SearchSunLongitude\|astronomy" out/_next/static/chunks/*.js | head; grep -o 'static/chunks/[^"]*\.js' out/guide.html | sort -u | while read f; do grep -l "SearchSunLongitude" "out/_next/$f" 2>/dev/null; done`
Expected: 1つ目のコマンドは運勢ページ用のチャンクだけを出力し、2つ目(早見表ページが読むチャンク)は何も出力しないこと

- [ ] **Step 5: コミットする**

```bash
git add src/components/fortune src/lib/fortune
git commit -m "feat: 運勢ページに期間タブ・運勢カード・人物像・総合鑑定プロンプトを表示し、未登録時は登録へ誘導する"
```

---

### Task 5: プロフィール入力ページ(`/fortune/profile`)

**Files:**
- Create: `src/components/profile/profile-form.tsx`、`src/components/profile/profile-preview.tsx`、`src/app/fortune/profile/page.tsx`
- Test: `src/components/profile/__tests__/profile-form.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/profile/__tests__/profile-form.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "../profile-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/dynamic", async () => {
  const m = await import("../profile-preview");
  return { default: () => m.ProfilePreview };
});

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  push.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
    writable: true,
  });
});

async function fillDate(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "1990");
  await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "3");
  await user.selectOptions(screen.getByRole("combobox", { name: "日" }), "29");
}

describe("ProfileForm", () => {
  it("生年月日が未選択なら保存できないこと", () => {
    render(<ProfileForm initial={null} />);
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });

  it("時刻の入力方式を切り替えられること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    expect(screen.getByText(/時刻が不明の場合/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "午前・午後" }));
    expect(screen.getByRole("radio", { name: /午後/ })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    expect(screen.getByRole("combobox", { name: "出生時刻" })).toBeInTheDocument();
  });

  it("入力して保存すると localStorage に保存し、運勢ページへ移動すること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await fillDate(user);
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "出生時刻" }), "14");
    await user.selectOptions(screen.getByRole("combobox", { name: "出生地" }), "13");
    await user.click(within(screen.getByRole("radiogroup", { name: "性別" })).getByRole("radio", { name: "女性" }));
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(JSON.parse(store["tarot-birth-profile"])).toEqual({
      version: 1,
      date: { year: 1990, month: 3, day: 29 },
      time: { kind: "hour", hour: 14 },
      prefecture: "13",
      gender: "female",
    });
    expect(push).toHaveBeenCalledWith("/fortune");
  });

  it("2月の日数は年に合わせること", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={null} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "年" }), "2023");
    await user.selectOptions(screen.getByRole("combobox", { name: "月" }), "2");
    const days = within(screen.getByRole("combobox", { name: "日" })).getAllByRole("option");
    expect(days.at(-1)?.textContent).toBe("28日");
  });

  it("登録済みなら初期値を表示し、確認のうえで削除できること", async () => {
    const user = userEvent.setup();
    store["tarot-birth-profile"] = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } });
    render(<ProfileForm initial={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }} />);
    expect(screen.getByRole("combobox", { name: "年" })).toHaveValue("1990");
    await user.click(screen.getByRole("button", { name: "登録情報を削除" }));
    expect(store["tarot-birth-profile"]).toBeDefined();
    await user.click(screen.getByRole("button", { name: "削除する" }));
    expect(store["tarot-birth-profile"]).toBeUndefined();
    expect(push).toHaveBeenCalledWith("/fortune");
  });

  it("データが端末内にのみ保存される旨を表示すること", () => {
    render(<ProfileForm initial={null} />);
    expect(screen.getByText("データは端末内にのみ保存されます")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/profile`
Expected: FAIL

- [ ] **Step 3: 実装する**

フォームの見た目は設計書 §11.4(Claude Design の `Profile.dc.html`)に従う。

- 項目ごとに、アイコン(`cal` / `clock` / `pin` / `person`)付きのラベルと、右端に「必須」(テラコッタ)または「任意」(gold-dim)。
- セレクトは高さ48px・角丸12px・surface 地・枠 gold/30、右端にシェブロン。年・月・日は 1.4 : 1 : 1 の比率。
- 時刻と性別のセグメントは `role="radiogroup"` + `role="radio"`(`aria-checked`)。3等分、選択中は gold 地。
- 午前・午後は大きめの2択(「午前 0:00〜11:59」「午後 12:00〜23:59」)。
- 時刻を指定は「14時台(14:00〜14:59)」形式のセレクト(aria-label「出生時刻」)。
- 保存はプライマリ、削除はデンジャー(テラコッタ文字)で、押すと「本当に削除しますか?」と「削除する」「キャンセル」のボタンを表示する確認のステップを挟む。
- 鍵アイコンと「データは端末内にのみ保存されます」。
- PC(1024px〜)はフォームを幅520pxのカードに入れ、出生地と性別を2列にし、右に `ProfilePreview`(`next/dynamic` で `ssr: false`)を出す。

```tsx
// src/components/profile/profile-form.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import { daysInMonth, isValidLocalDate } from "@/lib/fortune/local-date";
import { prefectures, type PrefectureCode } from "@/lib/fortune/prefectures";
import { clearBirthProfile, saveBirthProfile } from "@/lib/fortune/profile-storage";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";
import type { BirthProfile, BirthTime } from "@/lib/fortune/types";

const ProfilePreview = dynamic(() => import("./profile-preview").then((m) => m.ProfilePreview), { ssr: false });

type TimeMode = BirthTime["kind"];

const SELECT =
  "w-full min-h-12 appearance-none rounded-xl border border-gold/30 bg-surface pl-3.5 pr-8 text-[15px] text-cream focus:border-gold/60 focus:outline-none";

function Field({ icon, label, required, hint, children }: { icon: IconName; label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[13px] text-gold-light">
        <Icon name={icon} size={16} />
        {label}
        <span className={`ml-auto text-[11px] ${required ? "text-terracotta" : "text-gold-dim"}`}>
          {required ? "必須" : hint ? `任意 · ${hint}` : "任意"}
        </span>
      </div>
      {children}
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
        {children}
      </select>
      <Icon name="chev" size={16} className="pointer-events-none absolute right-3 top-4 text-gold-dim" />
    </div>
  );
}

function Segment<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-[14px] border border-gold/25 bg-popover p-1">
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-[11px] text-[13px] font-bold ${checked ? "bg-gold text-background" : "text-gold-dim hover:text-cream"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** プロフィール入力(設計書 §11.4)。initial は登録済みの値 */
export function ProfileForm({ initial }: { initial: BirthProfile | null }) {
  const router = useRouter();
  const thisYear = todayInTokyo().year;
  const [year, setYear] = useState(initial ? String(initial.date.year) : "");
  const [month, setMonth] = useState(initial ? String(initial.date.month) : "");
  const [day, setDay] = useState(initial ? String(initial.date.day) : "");
  const [timeMode, setTimeMode] = useState<TimeMode>(initial?.time.kind ?? "unknown");
  const [half, setHalf] = useState<"am" | "pm">(initial?.time.kind === "half" ? initial.time.half : "am");
  const [hour, setHour] = useState(initial?.time.kind === "hour" ? String(initial.time.hour) : "12");
  const [prefecture, setPrefecture] = useState<string>(initial?.prefecture ?? "");
  const [gender, setGender] = useState<"male" | "female" | "none">(initial?.gender ?? "none");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

  const lastDay = year && month ? daysInMonth(Number(year), Number(month)) : 31;

  const profile = useMemo<BirthProfile | null>(() => {
    const date = { year: Number(year), month: Number(month), day: Number(day) };
    if (!year || !month || !day || !isValidLocalDate(date)) return null;
    const time: BirthTime =
      timeMode === "unknown" ? { kind: "unknown" } : timeMode === "half" ? { kind: "half", half } : { kind: "hour", hour: Number(hour) };
    const p: BirthProfile = { version: 1, date, time };
    if (prefecture) p.prefecture = prefecture as PrefectureCode;
    if (gender !== "none") p.gender = gender;
    return p;
  }, [year, month, day, timeMode, half, hour, prefecture, gender]);

  const save = () => {
    if (!profile) return;
    if (saveBirthProfile(profile)) router.push("/fortune");
    else setError("保存できませんでした。日付が未来になっていないか、ブラウザの保存設定を確認してください。");
  };

  const remove = () => {
    clearBirthProfile();
    router.push("/fortune");
  };

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[520px_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-5 lg:gap-6">
        <div className="flex items-center gap-2 lg:gap-3">
          <Link href="/fortune" aria-label="運勢に戻る" className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold-light">
            <Icon name="back" size={18} />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-heading text-xl lg:text-[26px]">プロフィール</h1>
            <span className="font-accent text-sm leading-none text-gold-dark lg:text-base">Birth data</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-5 lg:gap-6 lg:rounded-[22px] lg:border lg:border-gold/25 lg:bg-surface lg:p-7"
        >
          <Field icon="cal" label="生年月日" required>
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
              <Select label="年" value={year} onChange={setYear}>
                <option value="">年</option>
                {Array.from({ length: thisYear - 1900 + 1 }, (_, i) => thisYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </Select>
              <Select label="月" value={month} onChange={setMonth}>
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </Select>
              <Select label="日" value={day && Number(day) <= lastDay ? day : ""} onChange={setDay}>
                <option value="">日</option>
                {Array.from({ length: lastDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}日
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field icon="clock" label="出生時刻">
            <Segment
              label="出生時刻の入力方式"
              value={timeMode}
              onChange={setTimeMode}
              options={[
                { value: "unknown", label: "不明" },
                { value: "half", label: "午前・午後" },
                { value: "hour", label: "時刻を指定" },
              ]}
            />
            {timeMode === "unknown" && (
              <p className="px-1 text-xs leading-relaxed text-gold-dim">
                時刻が不明の場合、出生時刻で結果が変わる項目は「候補」として時刻範囲付きで表示されます。
              </p>
            )}
            {timeMode === "half" && (
              <div role="radiogroup" aria-label="午前・午後" className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["am", "午前", "0:00〜11:59"],
                    ["pm", "午後", "12:00〜23:59"],
                  ] as const
                ).map(([value, label, sub]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={half === value}
                    onClick={() => setHalf(value)}
                    className={`min-h-[52px] rounded-[14px] border text-[15px] font-bold ${
                      half === value ? "border-gold bg-gold/18 text-gold-light" : "border-gold/25 bg-surface text-gold-dim"
                    }`}
                  >
                    {label}
                    <span className="block text-[11px] font-normal opacity-80">{sub}</span>
                  </button>
                ))}
              </div>
            )}
            {timeMode === "hour" && (
              <Select label="出生時刻" value={hour} onChange={setHour}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {h}時台({h}:00〜{h}:59)
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
            <Field icon="pin" label="出生地">
              <Select label="出生地" value={prefecture} onChange={setPrefecture}>
                <option value="">未入力</option>
                {prefectures.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field icon="person" label="性別" hint="大運などの計算にのみ使用">
              <Segment
                label="性別"
                value={gender}
                onChange={setGender}
                options={[
                  { value: "male", label: "男性" },
                  { value: "female", label: "女性" },
                  { value: "none", label: "回答しない" },
                ]}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3 lg:border-t lg:border-gold/15 lg:pt-2">
            <button type="submit" disabled={!profile} className={`${primaryButton} disabled:opacity-40 lg:px-8`}>
              保存
            </button>
            {initial &&
              (confirmingDelete ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-[13px]">
                  <span className="text-terracotta">本当に削除しますか?</span>
                  <button type="button" onClick={remove} className="min-h-11 rounded-[14px] px-3 font-bold text-terracotta">
                    削除する
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="min-h-11 rounded-[14px] px-3 text-gold-dim">
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] px-3.5 text-[13px] text-terracotta"
                >
                  <Icon name="trash" size={16} />
                  登録情報を削除
                </button>
              ))}
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gold-dim lg:ml-auto">
              <Icon name="lock" size={13} />
              データは端末内にのみ保存されます
            </p>
          </div>
          {error && (
            <p role="alert" className="text-xs text-terracotta">
              {error}
            </p>
          )}
        </form>
      </div>

      <div className="hidden lg:block lg:pt-16">{profile && <ProfilePreview profile={profile} />}</div>
    </div>
  );
}
```

`Icon` に `clock` / `pin` / `person` / `trash` / `lock` がなければ、`Components.dc.html` のパス(設計書の Components に記載。下記)で `src/components/icons/icon.tsx` に追加する:

- clock: `<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />`
- pin: `<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z" /><circle cx="12" cy="10" r="2" />`
- person: `<circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />`
- trash: `<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />`
- lock: `<rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />`

```tsx
// src/components/profile/profile-preview.tsx
"use client";

import { useMemo } from "react";
import { readAll } from "@/lib/fortune/registry";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";
import type { BirthProfile } from "@/lib/fortune/types";

/** PC の「この入力で分かること」。入力中の値で人物像を計算して見せる(計算エンジンを含むので動的に読み込む) */
export function ProfilePreview({ profile }: { profile: BirthProfile }) {
  const readings = useMemo(() => readAll(profile, todayInTokyo()), [profile]);
  return (
    <section aria-label="この入力で分かること" className="flex flex-col gap-3.5">
      <p className="text-xs tracking-[0.1em] text-gold-dim">この入力で分かること</p>
      <div className="flex flex-col gap-3.5 rounded-[20px] border border-gold/20 bg-popover p-[22px]">
        {readings.map((r) => (
          <div key={r.id} className="flex flex-col gap-1.5">
            <p className="font-heading text-[15px] text-gold-light">{r.name}</p>
            <ul className="flex flex-wrap gap-1.5">
              {r.natal.slice(0, 3).map((f) => (
                <li key={f.key} className={`rounded-full border px-2.5 py-1 text-xs ${f.candidates ? "border-terracotta/50 text-terracotta" : "border-gold/30"}`}>
                  <span className="text-gold-dim">{f.label}</span> {f.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {readings.some((r) => r.ambiguous) && (
          <p className="text-[13px] leading-[1.8]">出生時刻によって結果が分かれる項目は、候補として時刻範囲付きで表示されます。</p>
        )}
      </div>
    </section>
  );
}
```

```tsx
// src/app/fortune/profile/page.tsx
// プロフィール入力ページ
import { ProfilePage } from "@/components/profile/profile-page";

export default function FortuneProfilePage() {
  return <ProfilePage />;
}
```

```tsx
// src/components/profile/profile-page.tsx
"use client";

import { PageContainer } from "@/components/page-container";
import { useBirthProfile } from "@/lib/fortune/profile-storage";
import { ProfileForm } from "./profile-form";

/** 登録済みの値を読み込んでから、フォームを初期値付きで表示する */
export function ProfilePage() {
  const { ready, profile } = useBirthProfile();
  return (
    <PageContainer className="lg:max-w-[1100px]">
      {ready ? <ProfileForm key={profile ? "edit" : "new"} initial={profile} /> : <div className="h-96" aria-busy="true" />}
    </PageContainer>
  );
}
```


- [ ] **Step 4: テスト・lint**

Run: `npx vitest run src/components/profile && npx eslint src/components/profile src/app/fortune src/components/icons`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/profile src/app/fortune src/components/icons
git commit -m "feat: 生年月日・出生時刻・出生地・性別を入力するプロフィールページを追加"
```

---

### Task 6: ホームの今日の運勢のチップとサイドナビのプロフィール要約

**Files:**
- Create: `src/components/home-fortune-chips.tsx`、`src/components/profile-summary-box.tsx`
- Modify: `src/components/home-content.tsx`、`src/components/side-nav.tsx`
- Test: `src/components/__tests__/home-content.test.tsx`(拡張)、`src/components/__tests__/side-nav.test.tsx`(拡張)

- [ ] **Step 1: テストを拡張する**

`home-content.test.tsx` に追加(`next/dynamic` は Task 4 と同じ方法で `home-fortune-chips` の `HomeFortuneChips` を返すようにモックする)。

```tsx
describe("HomeContent(生年月日)", () => {
  it("未登録なら登録への誘導を表示すること", () => {
    render(<HomeContent />);
    expect(screen.getByRole("link", { name: "生年月日を登録する" })).toHaveAttribute("href", "/fortune/profile");
  });

  it("登録済みなら今日の運勢のチップを表示すること", () => {
    store["tarot-birth-profile"] = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } });
    render(<HomeContent />);
    const today = screen.getByRole("region", { name: "今日の運勢" });
    expect(today).toHaveTextContent("パーソナルデー");
    expect(today).toHaveTextContent("今日のKIN");
    expect(today).toHaveTextContent("本命星の位置");
    expect(screen.queryByRole("link", { name: "生年月日を登録する" })).not.toBeInTheDocument();
  });
});
```

`side-nav.test.tsx` に追加(`localStorage` を同様にモックする)。

```tsx
  it("未登録なら登録へのリンク、登録済みなら要約と編集リンクを表示すること", () => {
    const { unmount } = render(<SideNav />);
    expect(screen.getByRole("link", { name: "生年月日を登録" })).toHaveAttribute("href", "/fortune/profile");
    unmount();
    store["tarot-birth-profile"] = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" });
    render(<SideNav />);
    expect(screen.getByText("1990/3/29 生")).toBeInTheDocument();
    expect(screen.getByText("14時台 · 東京都")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "編集" })).toHaveAttribute("href", "/fortune/profile");
  });
```

既存の「4つのナビリンク」を数えるテストは、ナビ(`navigation`)の中だけを数えるように `within(screen.getByRole("navigation"))` に変える。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/home-content.test.tsx src/components/__tests__/side-nav.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/home-fortune-chips.tsx
"use client";

import { useMemo } from "react";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile, Fact } from "@/lib/fortune/types";
import type { LocalDate } from "@/lib/fortune/local-date";

/** ホームに出す今日の要点(設計書 §11.1): 数秘のパーソナルデー・九星の位置と吉方位・今日のKIN */
const HOME_KEYS: Record<string, string[]> = {
  numerology: ["personal-day"],
  kyusei: ["position", "lucky"],
  maya: ["today-kin"],
};

export function HomeFortuneChips({ profile, today }: { profile: BirthProfile; today: LocalDate }) {
  const chips = useMemo<Fact[]>(() => {
    return readAll(profile, today).flatMap((r) =>
      (HOME_KEYS[r.id] ?? []).flatMap((key) => r.periods.day.chips.filter((c) => c.key === key)),
    );
  }, [profile, today]);
  return (
    <ul className="flex flex-wrap gap-2" aria-label="今日の運勢の要点">
      {chips.map((c) => (
        <li
          key={c.key}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 text-[13px]"
        >
          <span className="text-[11px] text-gold-dim">{c.label}</span>
          <span className="font-bold">{c.value}</span>
        </li>
      ))}
    </ul>
  );
}
```

`home-content.tsx` の「今日の運勢」セクションで、`<DailyTarotCard variant="home" />` の直後に次を入れる(`useBirthProfile`・`useMemo`・`dynamic`・`SignupCard` を import し、`today` から `LocalDate` を作る)。

```tsx
          {ready && profile && todayLocal && <HomeFortuneChips profile={profile} today={todayLocal} />}
          {ready && !profile && <SignupCard className="border-t border-gold/15 pt-3.5" />}
```

```tsx
const HomeFortuneChips = dynamic(() => import("./home-fortune-chips").then((m) => m.HomeFortuneChips), { ssr: false });
```

登録済みのときは「詳しく見る」を出し、未登録のときは `SignupCard` の「生年月日を登録する」だけにする(「詳しく見る」と並べない)。

```tsx
// src/components/profile-summary-box.tsx
"use client";

import Link from "next/link";
import { formatBirthTime, formatPrefecture } from "@/lib/fortune/profile-format";
import { useBirthProfile } from "@/lib/fortune/profile-storage";

/** サイドナビ下部のプロフィール要約(設計書 §10.2) */
export function ProfileSummaryBox() {
  const { ready, profile } = useBirthProfile();
  if (!ready) return null;
  return (
    <div className="mt-auto rounded-[14px] border border-gold/20 px-3.5 py-3 text-xs leading-relaxed text-gold-dim">
      {profile ? (
        <>
          <p>
            {profile.date.year}/{profile.date.month}/{profile.date.day} 生
          </p>
          <p>{[formatBirthTime(profile.time), ...(profile.prefecture ? [formatPrefecture(profile.prefecture)] : [])].join(" · ")}</p>
          <Link href="/fortune/profile" className="mt-1.5 block text-gold-light hover:text-cream">
            編集
          </Link>
        </>
      ) : (
        <Link href="/fortune/profile" className="block text-gold-light hover:text-cream">
          生年月日を登録
        </Link>
      )}
    </div>
  );
}
```

`side-nav.tsx` の `</nav>` の直後に `<ProfileSummaryBox />` を入れる(外側の div は `flex-col` なので `mt-auto` で最下部に寄る)。

- [ ] **Step 4: テスト・lint・ビルド**

Run: `npx vitest run && npx eslint src && npm run build`
Expected: PASS。`out/index.html` が読み込む JS に astronomy-engine が含まれないこと(Task 4 Step 4 と同じ確認を `out/index.html` で行う)。

- [ ] **Step 5: コミットする**

```bash
git add src
git commit -m "feat: ホームに今日の運勢のチップ、サイドナビにプロフィールの要約を表示する"
```

---

### Task 7: E2E と最終確認

**Files:**
- Create: `e2e/profile-fortune.spec.ts`
- Modify: `e2e/fortune.spec.ts`、`e2e/home.spec.ts`(登録状態に合わせて必要なら)

- [ ] **Step 1: E2E を書く**

```ts
// e2e/profile-fortune.spec.ts
import { test, expect } from "@playwright/test";

test.describe("プロフィール登録から運勢ページまで", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("tarot-birth-profile");
      localStorage.removeItem("tarot-daily-draw");
    });
  });

  test("登録すると運勢ページに3占術の運勢が表示されること", async ({ page }) => {
    await page.goto("/fortune");
    await page.getByRole("link", { name: "生年月日を登録する" }).click();
    await expect(page).toHaveURL("/fortune/profile");
    await page.getByRole("combobox", { name: "年" }).selectOption("1990");
    await page.getByRole("combobox", { name: "月" }).selectOption("3");
    await page.getByRole("combobox", { name: "日" }).selectOption("29");
    await page.getByRole("radio", { name: "時刻を指定" }).click();
    await page.getByRole("combobox", { name: "出生時刻" }).selectOption("14");
    await page.getByRole("combobox", { name: "出生地" }).selectOption("13");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL("/fortune");
    await expect(page.getByText("1990/3/29 生 · 14時台 · 東京都")).toBeVisible();
    for (const name of ["数秘術", "九星気学", "マヤ暦"]) {
      await expect(page.getByRole("article", { name })).toBeVisible();
    }
    await page.getByRole("tab", { name: "今年" }).click();
    await expect(page.getByRole("article", { name: "数秘術" })).toContainText("パーソナルイヤー");
  });

  test("チップから要素の詳細を開けること", async ({ page, isMobile }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/fortune");
    await page.getByRole("article", { name: "数秘術" }).getByRole("button", { name: /ライフパス/ }).click();
    if (isMobile) {
      await expect(page.getByRole("dialog")).toContainText("33");
    } else {
      await expect(page.getByRole("complementary", { name: "詳細パネル" })).toContainText("33");
    }
  });

  test("総合鑑定プロンプトをコピーできること", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "クリップボードの権限は chromium で確認する");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/fortune");
    await page.getByRole("textbox", { name: "相談したいこと(任意)" }).fill("仕事のこと");
    await page.getByRole("button", { name: "総合鑑定プロンプトをコピー" }).click();
    await expect(page.getByText("コピーしました")).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("■ 相談内容: 仕事のこと");
    expect(text).toContain("【九星気学】");
  });

  test("ホームに今日の運勢のチップが出て、プロフィールを削除すると誘導に戻ること", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/");
    await expect(page.getByRole("region", { name: "今日の運勢" })).toContainText("今日のKIN");
    await page.goto("/fortune/profile");
    await page.getByRole("button", { name: "登録情報を削除" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page).toHaveURL("/fortune");
    await expect(page.getByRole("link", { name: "生年月日を登録する" })).toBeVisible();
  });
});
```

既存の `e2e/fortune.spec.ts` は未登録状態(プロフィールなし)の前提なので、`beforeEach` で `tarot-birth-profile` も削除する。

- [ ] **Step 2: 全体の検証**

Run: `npx vitest run && npx tsc --noEmit && npx eslint src && npm run build && npx playwright test`
Expected: すべて PASS。lint エラー0件。

- [ ] **Step 3: 目視確認**

`npm run dev` で、幅 390px・1280px の `/`・`/fortune`(登録済み・未登録)・`/fortune/profile` を確認する。確認ポイント:
- 運勢ページの期間タブがスクロールしても上部に固定される。
- 1280px で2カラムになり、チップを押すと右の詳細パネルが開いて本文が縮む。
- 時刻不明・立春当日のプロフィール(例: 1990/2/4)で、候補がテラコッタ色で表示される。
- 絵文字や記号文字がない。

- [ ] **Step 4: コミットする**

```bash
git add -A e2e src
git commit -m "test: プロフィール登録から運勢ページ・プロンプト・ホームのチップまでのE2Eテストを追加"
```
