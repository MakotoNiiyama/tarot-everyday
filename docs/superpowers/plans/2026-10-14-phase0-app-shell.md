# フェーズ0: 画面構成の作り直し Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** メニューを「ホーム / 運勢 / タロット / 早見表」の4つに再構成し、PC(左サイドナビ・詳細サイドパネル)とスマホ(下部ナビ・ボトムシート)のレスポンシブな土台を作る。あわせて、既存UIの絵文字をSVGアイコンに置き換える。

**Architecture:** ナビ定義を `nav-items.ts` に集約し、`BottomNav`(〜1023px)と `SideNav`(1024px〜)が共有する。詳細表示は `DetailSheet`(Base UI Drawer)を汎用化し、`DetailPanelLayout` の内側かつ 1280px 以上のときは右サイドパネルに表示を切り替える。既存ページは新URLへ移設し、旧URLにはクライアント側で転送するページを残す(静的エクスポートのため `next.config` の `redirects` は使えない)。

**Tech Stack:** Next.js 16.2.1(App Router、`output: "export"`)、React 19.2、Tailwind CSS v4、@base-ui/react 1.3(Drawer / Tabs)、framer-motion、Vitest + Testing Library、Playwright

**設計書:** `docs/superpowers/specs/2026-10-14-birth-fortune-design.md`(§9〜§11、§13 のフェーズ0)

---

## 前提知識(実装者向け)

- このリポジトリの Next.js は学習データと異なる可能性がある。API を使う前に `node_modules/next/dist/docs/` の該当ドキュメントを確認すること(`AGENTS.md`)。
- **絵文字は使わない。** ☀ ☽ ⭐ などの記号文字も使わない。アイコンはすべて `Icon` コンポーネント(SVGパス)で描く。
- lint の `react-hooks/set-state-in-effect` が有効。新しいコードでは `useEffect` 内で `setState` を呼ばず、`useSyncExternalStore` を使う(既存コードの3件のエラーは今回の範囲外なので触らない)。
- テスト実行: `npx vitest run <パス>`(ユニット)、`npx playwright test <パス>`(E2E。dev サーバーを自動起動する。プロジェクトは `chromium`(1280×720)と `mobile-chrome`(Pixel 7))。
- 作業開始時点でユニットテストは 16ファイル / 190件 すべて成功している。
- カード画像は `public/cards/...` にあり、`/cards/major/00-fool.jpg` のようなパスで配信される。旧URL `/cards` にページを置いても画像パスとは衝突しない。
- 色クラス: `bg-background`(#130C06)、`bg-surface`(#2A1D0A)、`bg-popover`(#1F1508)、`text-gold`、`text-gold-light`、`text-gold-dim`、`text-gold-dark`、`text-cream`、`text-terracotta`。フォント: `font-heading`(Kaisei Decol)、`font-accent`(Caveat)、本文は既定(Zen Maru Gothic)。

## ファイル構成

| 種別 | パス | 責務 |
|---|---|---|
| 新規 | `src/components/icons/icon.tsx` | SVG線画アイコン(名前で切り替え) |
| 新規 | `src/components/orientation-badge.tsx` | 正位置・逆位置のバッジ |
| 新規 | `src/components/tarot-card-meaning-tabs.tsx` | 正逆タブ(キーワード・意味・運勢)。カード詳細ページと詳細シートで共有 |
| 新規 | `src/lib/use-media-query.ts` | メディアクエリの購読フック |
| 新規 | `src/components/detail/detail-heading.tsx` | 詳細の見出し(分類・名前・補足)の型と表示 |
| 新規 | `src/components/detail/detail-panel.tsx` | `DetailPanelLayout` と `useDetailPanel`(PCの右サイドパネル) |
| 新規 | `src/components/detail/detail-sheet.tsx` | 汎用の詳細シート(スマホはボトムシート、パネルがあればパネル) |
| 変更 | `src/components/card-detail-sheet.tsx` | `DetailSheet` を使う薄いラッパーにする |
| 新規 | `src/components/nav-items.ts` | ナビ項目の定義と現在地判定 |
| 変更 | `src/components/bottom-nav.tsx` | 4項目・均等配置・1024px以上で非表示 |
| 新規 | `src/components/side-nav.tsx` | 1024px以上の左サイドナビ |
| 変更 | `src/app/layout.tsx` | ナビ2種の配置と余白、`viewportFit: "cover"` |
| 新規 | `src/lib/date-format.ts` | 日付の日本語表記 |
| 新規 | `src/lib/button-styles.ts` | ボタンのクラス定義(プライマリ・セカンダリ・アウトライン) |
| 新規 | `src/components/page-container.tsx` | ページ本文の幅と余白 |
| 新規 | `src/components/page-header.tsx` | ページ見出し(Caveat + 見出し + 区切り線) |
| 新規 | `src/lib/use-daily-draw.ts` | 1dayタロットの状態(localStorage を購読) |
| 新規 | `src/components/daily-tarot-card.tsx` | 1dayタロットの表示(ホーム用・運勢用) |
| 新規 | `src/components/client-redirect.tsx` | 旧URLからの転送 |
| 新規 | `src/app/tarot/page.tsx`、`src/app/tarot/reading/page.tsx`、`src/app/tarot/quiz/page.tsx` | タロットの入口と移設先 |
| 新規 | `src/app/guide/page.tsx`、`src/app/guide/tarot/[id]/page.tsx` | 早見表と、カード詳細の移設先 |
| 新規 | `src/app/fortune/page.tsx`、`src/components/fortune/fortune-content.tsx` | 運勢ページ(フェーズ0は1dayタロットのみ) |
| 変更 | `src/app/cards/page.tsx`、`src/app/cards/[id]/page.tsx`、`src/app/reading/page.tsx`、`src/app/quiz/page.tsx`、`src/app/daily/page.tsx` | 転送専用ページにする |
| 変更 | `src/components/home-content.tsx` | 新デザインのホーム |
| 新規 | `src/components/tarot-entry.tsx` | タロットの2択画面 |
| 変更 | `src/components/card-tile.tsx`、`src/components/card-list.tsx`、`src/components/card-detail.tsx` | 新URLへのリンクとアイコン化 |
| 変更 | `src/lib/tarot-utils.ts` | `fortuneLabels` を絵文字からアイコン名へ。`suitSymbol` を削除 |
| 変更 | `src/components/quiz-mode.tsx`、`src/components/spread-reading-flow.tsx` | 絵文字・記号の置き換え |
| 削除 | `src/components/daily-tarot.tsx`、`src/components/__tests__/daily-tarot.test.tsx` | 運勢ページに統合したため |
| 変更 | `public/sw.js` | キャッシュ対象を新URLに |
| 変更/新規 | `e2e/*.spec.ts` | 新URL・新UIに合わせて更新、転送とパネルのテストを追加 |

---

### Task 1: SVGアイコン部品

**Files:**
- Create: `src/components/icons/icon.tsx`
- Test: `src/components/icons/__tests__/icon.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/icons/__tests__/icon.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon, iconNames } from "../icon";

describe("Icon", () => {
  it("aria-hidden の SVG を描画すること", () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg?.querySelectorAll("path, rect, circle").length).toBeGreaterThan(0);
  });

  it("size と strokeWidth を反映すること", () => {
    const { container } = render(<Icon name="up" size={14} strokeWidth={1.8} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "14");
    expect(svg).toHaveAttribute("height", "14");
    expect(svg).toHaveAttribute("stroke-width", "1.8");
  });

  it("線画の共通属性(塗りなし・丸い端点・currentColor)を持つこと", () => {
    const { container } = render(<Icon name="guide" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-linecap", "round");
    expect(svg).toHaveAttribute("stroke-linejoin", "round");
  });

  it("定義済みのすべてのアイコンが描画できること", () => {
    for (const name of iconNames) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector("svg")?.childElementCount).toBeGreaterThan(0);
      unmount();
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/icons/__tests__/icon.test.tsx`
Expected: FAIL(`Failed to resolve import "../icon"`)

- [ ] **Step 3: 実装する**

パスは Claude Design の `Components.dc.html` の `symbol` 定義をそのまま移植したもの。`spread-choice` / `spread-hexagram` / `spread-celtic` はスプレッド選択用に追加したもの。

```tsx
// src/components/icons/icon.tsx
import type { ReactNode } from "react";

/**
 * SVG線画アイコン。24pxグリッド・塗りなし・丸い端点で、色は currentColor。
 * 絵文字やUnicodeの記号文字の代わりに必ずこれを使う。
 */
const ICONS = {
  home: <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" />,
  fortune: <path d="M12 3l2.4 6.1L21 9.6l-5 4.3 1.6 6.5L12 16.9 6.4 20.4 8 13.9 3 9.6l6.6-.5z" />,
  tarot: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M12 8l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" />
    </>
  ),
  guide: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 21a2 2 0 0 1 2-2h14" />
    </>
  ),
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </>
  ),
  chev: <path d="M6 9l6 6 6-6" />,
  right: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  cal: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chat: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" />,
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  spread: (
    <>
      <rect x="2" y="7" width="7" height="11" rx="1.5" transform="rotate(-10 5.5 12.5)" />
      <rect x="8.5" y="5" width="7" height="11" rx="1.5" />
      <rect x="15" y="7" width="7" height="11" rx="1.5" transform="rotate(10 18.5 12.5)" />
    </>
  ),
  "spread-choice": (
    <>
      <path d="M12 4v16" />
      <path d="M8 8l-4 4 4 4" />
      <path d="M16 8l4 4-4 4" />
    </>
  ),
  "spread-hexagram": (
    <>
      <path d="M12 3l8 13.5H4z" />
      <path d="M12 21L4 7.5h16z" />
    </>
  ),
  "spread-celtic": (
    <>
      <rect x="9" y="5" width="6" height="14" rx="1" />
      <path d="M4 12h16" />
    </>
  ),
  overall: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      <path d="M14.5 9.5L13 13l-3.5 1.5L11 11z" />
    </>
  ),
  love: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  work: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18" />
    </>
  ),
  money: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4v2M12 18v2" />
    </>
  ),
  health: (
    <>
      <path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z" />
      <path d="M5 19l8-8" />
    </>
  ),
  advice: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.8-1.5 1.5-1.5 2.5h-4c0-1-.7-1.7-1.5-2.5z" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export const iconNames = Object.keys(ICONS) as IconName[];

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.6,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/components/icons/__tests__/icon.test.tsx`
Expected: PASS(4 tests)

- [ ] **Step 5: コミットする**

```bash
git add src/components/icons
git commit -m "feat: SVG線画アイコン部品を追加"
```

---

### Task 2: 正逆バッジと、正逆タブ部品の切り出し(絵文字の置き換え その1)

`card-detail.tsx` と `card-detail-sheet.tsx` に同じ正逆タブのコードが重複しているので `TarotCardMeaningTabs` に切り出し、同時に ☀ ☽ と運勢ジャンルの絵文字をアイコンに置き換える。

**Files:**
- Create: `src/components/orientation-badge.tsx`
- Create: `src/components/tarot-card-meaning-tabs.tsx`
- Modify: `src/lib/tarot-utils.ts`
- Modify: `src/components/card-detail.tsx`
- Modify: `src/components/card-detail-sheet.tsx`
- Modify: `src/components/daily-tarot.tsx`(Task 12 で削除するが、それまでテストを通すために最小限の修正をする)
- Test: `src/components/__tests__/orientation-badge.test.tsx`、`src/components/__tests__/card-detail.test.tsx`、`src/components/__tests__/daily-tarot.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/__tests__/orientation-badge.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrientationBadge } from "../orientation-badge";

describe("OrientationBadge", () => {
  it("正位置のときは「正位置」と上向き矢印を表示すること", () => {
    const { container } = render(<OrientationBadge isReversed={false} />);
    expect(screen.getByText("正位置")).toBeInTheDocument();
    expect(container.querySelector("svg path")).toHaveAttribute("d", "M12 19V5M6 11l6-6 6 6");
    expect(container.firstElementChild).toHaveClass("text-gold-light");
  });

  it("逆位置のときは「逆位置」と下向き矢印をテラコッタ色で表示すること", () => {
    const { container } = render(<OrientationBadge isReversed />);
    expect(screen.getByText("逆位置")).toBeInTheDocument();
    expect(container.querySelector("svg path")).toHaveAttribute("d", "M12 5v14M6 13l6 6 6-6");
    expect(container.firstElementChild).toHaveClass("text-terracotta");
  });

  it("記号文字を含まないこと", () => {
    const { container } = render(<OrientationBadge isReversed={false} />);
    expect(container.textContent).toBe("正位置");
  });
});
```

`src/components/__tests__/card-detail.test.tsx` の該当テストを次のように書き換える(☀ ☽ を使わない)。

```tsx
  it("正位置タブが初期表示されること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByRole("tab", { name: "正位置" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "逆位置" })).toBeInTheDocument();
  });
```

```tsx
  it("逆位置タブに切り替えると逆位置の内容が表示されること", async () => {
    const user = userEvent.setup();
    render(<CardDetail card={mockCard} />);
    await user.click(screen.getByRole("tab", { name: "逆位置" }));
    expect(screen.getByText("無謀")).toBeInTheDocument();
    expect(screen.getByText("逆位置の意味テスト")).toBeInTheDocument();
  });
```

さらに、絵文字がないことのテストを `describe("CardDetail")` の末尾に追加する。

```tsx
  it("運勢ジャンルに絵文字を使わずアイコンを表示すること", () => {
    const { container } = render(<CardDetail card={mockCard} />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u);
  });
```

`src/components/__tests__/daily-tarot.test.tsx` の2か所を書き換える。

```tsx
    // 正位置 or 逆位置のいずれかが表示される
    const orientation = screen.queryByText("正位置") || screen.queryByText("逆位置");
    expect(orientation).toBeInTheDocument();
```

```tsx
    expect(screen.getByText("愚者")).toBeInTheDocument();
    expect(screen.getByText("正位置")).toBeInTheDocument();
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/orientation-badge.test.tsx src/components/__tests__/card-detail.test.tsx src/components/__tests__/daily-tarot.test.tsx`
Expected: FAIL(`orientation-badge` の import 解決エラー、`card-detail` の tab 名不一致、`daily-tarot` の「正位置」が見つからない)

- [ ] **Step 3: `OrientationBadge` を実装する**

```tsx
// src/components/orientation-badge.tsx
import { Icon } from "@/components/icons/icon";

/** 正位置・逆位置のバッジ(正位置は gold、逆位置は terracotta) */
export function OrientationBadge({
  isReversed,
  className = "",
}: {
  isReversed: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-bold ${
        isReversed ? "bg-terracotta/18 text-terracotta" : "bg-gold/15 text-gold-light"
      } ${className}`}
    >
      <Icon name={isReversed ? "down" : "up"} size={14} strokeWidth={1.8} />
      {isReversed ? "逆位置" : "正位置"}
    </span>
  );
}
```

- [ ] **Step 4: `fortuneLabels` をアイコン名に変え、`suitSymbol` を削除する**

`src/lib/tarot-utils.ts` の先頭の import と `fortuneLabels` を次のように置き換え、ファイル末尾の `suitSymbol` 関数(「スーツの装飾シンボル」のコメントから関数の終わりまで)を削除する。

```ts
import type { TarotCard, Suit } from "@/data/types";
import type { IconName } from "@/components/icons/icon";
```

```ts
/** 運勢ジャンル定義 */
export const fortuneLabels: {
  key: keyof TarotCard["fortune"];
  label: string;
  icon: IconName;
}[] = [
  { key: "general", label: "総合運", icon: "overall" },
  { key: "love", label: "恋愛運", icon: "love" },
  { key: "work", label: "仕事運", icon: "work" },
  { key: "money", label: "金運", icon: "money" },
  { key: "health", label: "健康運", icon: "health" },
  { key: "advice", label: "アドバイス", icon: "advice" },
];
```

`suitSymbol` を使っているのは `src/components/card-tile.tsx` の未使用関数 `MiniCardSvg` だけなので、`card-tile.tsx` から `MiniCardSvg` 関数全体(「スクラッチアート風のミニカードSVG」のコメントから関数の終わりまで)を削除し、import を次のようにする。

```tsx
import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
```

- [ ] **Step 5: `TarotCardMeaningTabs` を作る**

```tsx
// src/components/tarot-card-meaning-tabs.tsx
"use client";

import type { TarotCard } from "@/data/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Icon } from "@/components/icons/icon";
import { fortuneLabels } from "@/lib/tarot-utils";

export function KeywordBadge({ keyword }: { keyword: string }) {
  return (
    <span className="inline-block bg-surface/60 border border-gold/20 rounded-full px-3 py-1 text-xs text-cream">
      {keyword}
    </span>
  );
}

const orientations = [
  { value: 0, key: "upright" as const, label: "正位置", icon: "up" as const, color: "text-gold", activeBg: "data-active:bg-gold data-active:text-background" },
  { value: 1, key: "reversed" as const, label: "逆位置", icon: "down" as const, color: "text-terracotta", activeBg: "data-active:bg-terracotta data-active:text-cream" },
] as const;

/** 正位置/逆位置のタブ(キーワード・意味・運勢ジャンル別の解説) */
export function TarotCardMeaningTabs({
  card,
  className,
}: {
  card: TarotCard;
  className?: string;
}) {
  return (
    <Tabs defaultValue={0} className={className}>
      <TabsList className="w-full bg-surface/40 rounded-lg">
        {orientations.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            className={`flex-1 inline-flex items-center justify-center gap-1 ${o.activeBg} rounded-md px-4 py-2 text-sm font-heading`}
          >
            <Icon name={o.icon} size={14} strokeWidth={1.8} />
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {orientations.map((o) => (
        <TabsContent key={o.value} value={o.value} className="mt-4 flex flex-col gap-4">
          <section aria-label={`${o.label}のキーワード`}>
            <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>キーワード</h2>
            <div className="flex flex-wrap gap-2">
              {card.keywords[o.key].map((kw) => (
                <KeywordBadge key={kw} keyword={kw} />
              ))}
            </div>
          </section>

          <section aria-label={`${o.label}の意味`}>
            <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>意味</h2>
            <p className="text-cream/90 text-sm leading-relaxed">{card.meaning[o.key]}</p>
          </section>

          <section aria-label={`${o.label}の運勢`}>
            <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>運勢</h2>
            <Accordion>
              {fortuneLabels.map(({ key, label, icon }) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-cream text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Icon name={icon} size={16} className="text-gold-light" />
                      {label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-cream/80 text-sm leading-relaxed">{card.fortune[key][o.key]}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

- [ ] **Step 6: `card-detail.tsx` を `TarotCardMeaningTabs` を使う形にする**

`src/components/card-detail.tsx` を次の内容に置き換える(リンク先は Task 9 で変更するので、ここでは `/cards` のまま)。

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";
import { suitNames } from "@/lib/tarot-utils";

export function CardDetail({ card }: { card: TarotCard }) {
  const subTitle = card.arcana === "major"
    ? "大アルカナ"
    : (card.suit ? suitNames[card.suit].full : "小アルカナ");

  return (
    <div className="flex flex-col flex-1 px-4 py-6 pb-20 gap-6 max-w-lg mx-auto">
      {/* パンくず */}
      <nav aria-label="パンくずリスト" className="text-xs text-gold-dim">
        <Link href="/cards" className="hover:text-gold transition-colors">
          早見表
        </Link>
        <span className="mx-1">›</span>
        <span className="text-cream">{card.name.ja}</span>
      </nav>

      {/* ヘッダー */}
      <header className="text-center">
        <p className="text-gold-dim text-xs mb-1">{subTitle}</p>
        <h1 className="font-heading text-2xl font-bold text-gold">{card.name.ja}</h1>
        <p className="text-gold-dim text-sm mt-1 font-accent">{card.name.en}</p>
      </header>

      {/* カード画像 */}
      <div className="flex justify-center">
        <div className="w-40 h-auto rounded-lg overflow-hidden border border-gold/30 shadow-lg shadow-black/40">
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={160}
            height={267}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      <ScratchDivider className="text-gold" />

      <TarotCardMeaningTabs card={card} />
    </div>
  );
}
```

- [ ] **Step 7: `card-detail-sheet.tsx` の正逆タブを置き換える**

`src/components/card-detail-sheet.tsx` で、次の3点を変更する(シート全体の作り直しは Task 4 で行う)。

1. import の `Tabs`〜`AccordionContent` の行と `fortuneLabels` を削除し、`import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";` を追加する。`suitNames` の import は `import { suitNames } from "@/lib/tarot-utils";` にする。
2. ファイル内の `KeywordBadge` 関数と `orientations` 定数を削除する。
3. `{/* 正位置 / 逆位置 タブ */}` から対応する `</Tabs>` までを、次の1行に置き換える。

```tsx
              <TarotCardMeaningTabs card={card} className="mt-4" />
```

- [ ] **Step 8: `daily-tarot.tsx` を最小限修正する**

`src/components/daily-tarot.tsx` で次の2点を変更する。

1. `import { fortuneLabels } from "@/lib/tarot-utils";` の下に次の2行を追加する。

```tsx
import { Icon } from "@/components/icons/icon";
import { OrientationBadge } from "@/components/orientation-badge";
```

2. 正逆表示の `<p ...>{draw.isReversed ? "☽ 逆位置" : "☀ 正位置"}</p>` を `<OrientationBadge isReversed={draw.isReversed} className="mt-1 self-center" />` に、運勢一覧の `{fortuneLabels.map(({ key, label, emoji }) => {` を `{fortuneLabels.map(({ key, label, icon }) => {` に、見出しの `{emoji} {label}` を次のように置き換える。

```tsx
                  <h2 className="text-gold text-sm font-heading font-bold inline-flex items-center gap-2">
                    <Icon name={icon} size={16} className="text-gold-light" />
                    {label}
                  </h2>
```

(元の `<h2 className="text-gold text-sm font-heading font-bold">` 行ごと置き換える)

- [ ] **Step 9: テストが通ることを確認する**

Run: `npx vitest run`
Expected: すべて PASS(`card-tile` など他のテストも含めて失敗がないこと)

- [ ] **Step 10: 型チェックをする**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 11: コミットする**

```bash
git add -A src
git commit -m "refactor: 正逆タブを共通部品に切り出し、正逆表示と運勢ジャンルの絵文字をSVGアイコンに置き換え"
```

---

### Task 3: クイズとスプレッド占いの記号を置き換える(絵文字の置き換え その2)

**Files:**
- Modify: `src/components/quiz-mode.tsx`
- Modify: `src/components/spread-reading-flow.tsx`
- Test: `src/components/__tests__/quiz-mode.test.tsx`(既存。変更なしで通ること)

- [ ] **Step 1: `quiz-mode.tsx` の正逆バッジを置き換える**

import に `import { OrientationBadge } from "@/components/orientation-badge";` を追加し、「正位置/逆位置バッジ」の `<span className={`text-xs font-heading px-3 py-1 rounded-full border ${...}`}>{isReversed ? "☽ 逆位置" : "☀ 正位置"}</span>`(コメント `{/* 正位置/逆位置バッジ */}` の直後の span 要素全体)を次に置き換える。

```tsx
      <OrientationBadge isReversed={isReversed} className="self-center" />
```

`✦ 正解！` / `✧ 不正解…` は `正解！` / `不正解…` にする(記号を削除)。結果一覧の `{a.isCorrect ? "○" : "✕"} {a.selectedKeyword}` は、import に `import { Icon } from "@/components/icons/icon";` を追加したうえで次に置き換える。

```tsx
                  <span className="inline-flex items-center gap-1">
                    <Icon name={a.isCorrect ? "check" : "close"} size={14} strokeWidth={1.8} />
                    {a.selectedKeyword}
                  </span>
```

- [ ] **Step 2: `spread-reading-flow.tsx` の記号を置き換える**

import に次の2行を追加する。

```tsx
import { Icon, type IconName } from "@/components/icons/icon";
import { OrientationBadge } from "@/components/orientation-badge";
```

`SelectPhase` の `icons` 定数を次に置き換える。

```tsx
  const icons: Record<string, IconName> = {
    "three-card": "spread",
    choice: "spread-choice",
    hexagram: "spread-hexagram",
    "celtic-cross": "spread-celtic",
  };
```

その表示部 `<span className="text-gold text-lg w-12 text-center font-accent">{icons[s.id]}</span>` を次に置き換える。

```tsx
              <span className="flex w-12 justify-center text-gold">
                <Icon name={icons[s.id]} size={28} strokeWidth={1.5} />
              </span>
```

結果のカード一覧の `<span className={`text-xs ${dc.isReversed ? "text-terracotta" : "text-gold-dim"}`}>{dc.isReversed ? "☽ 逆位置" : "☀ 正位置"}</span>` を `<OrientationBadge isReversed={dc.isReversed} />` に置き換える。

AIプロンプトの見出し `🤖 AI分析用プロンプト` を次に置き換える。

```tsx
        <h2 className="text-gold text-sm font-heading font-bold inline-flex items-center gap-2">
          <Icon name="copy" size={16} />
          AI分析用プロンプト
        </h2>
```

(元の `<h2 className="text-gold text-sm font-heading font-bold">` 行ごと置き換える)

`✓ コピーしました` を次に置き換える。

```tsx
              <span className="text-gold font-heading font-bold text-lg inline-flex items-center gap-2">
                <Icon name="check" size={20} strokeWidth={1.8} />
                コピーしました
              </span>
```

(元の `<span className="text-gold font-heading font-bold text-lg">` 行ごと置き換える)

- [ ] **Step 3: 絵文字が残っていないことを確認する**

Run: `grep -rnP "[\x{2600}-\x{27BF}\x{1F300}-\x{1FAFF}\x{2B50}\x{2B1F}-\x{2B2F}\x{27E8}\x{27E9}]" src --include="*.tsx" --include="*.ts" | grep -v __tests__ | grep -v "src/data/"`
Expected: 出力なし(矢印 → ← はテキストなので対象外。`spread-layout.tsx` のコメント内の → も問題ない)

※ `choice` のアイコン `⟨A|B⟩` は Step 2 で置き換え済み。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run`
Expected: すべて PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/quiz-mode.tsx src/components/spread-reading-flow.tsx
git commit -m "refactor: クイズとスプレッド占いの記号文字をSVGアイコンに置き換え"
```

---

### Task 4: 汎用の詳細シートとPCのサイドパネル

**Files:**
- Create: `src/lib/use-media-query.ts`
- Create: `src/components/detail/detail-heading.tsx`
- Create: `src/components/detail/detail-panel.tsx`
- Create: `src/components/detail/detail-sheet.tsx`
- Modify: `src/components/card-detail-sheet.tsx`
- Test: `src/lib/__tests__/use-media-query.test.tsx`、`src/components/detail/__tests__/detail-sheet.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/lib/__tests__/use-media-query.test.tsx
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

function Probe({ query }: { query: string }) {
  return <p>{useMediaQuery(query) ? "match" : "no-match"}</p>;
}

type Listener = () => void;

function installMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }));
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((l) => l());
    },
  };
}

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

describe("useMediaQuery", () => {
  it("matchMedia が無い環境では false を返すこと", () => {
    // jsdom には matchMedia が実装されていない
    // @ts-expect-error テストのため削除する
    delete window.matchMedia;
    render(<Probe query="(min-width: 1280px)" />);
    expect(screen.getByText("no-match")).toBeInTheDocument();
  });

  it("一致状態を返し、変化に追従すること", () => {
    const mql = installMatchMedia(true);
    render(<Probe query="(min-width: 1280px)" />);
    expect(screen.getByText("match")).toBeInTheDocument();
    act(() => mql.set(false));
    expect(screen.getByText("no-match")).toBeInTheDocument();
  });
});
```

```tsx
// src/components/detail/__tests__/detail-sheet.test.tsx
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetailSheet } from "../detail-sheet";
import { DetailPanelLayout } from "../detail-panel";

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

function mockWide(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const heading = { title: "星", subtitle: "大アルカナ", description: "The Star" };

describe("DetailSheet", () => {
  it("トリガーを押すとボトムシートに見出しと本文を表示すること", async () => {
    const user = userEvent.setup();
    render(
      <DetailSheet heading={heading} body={<p>本文テキスト</p>}>
        <span>開く</span>
      </DetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "星" })).toBeInTheDocument();
    expect(screen.getByText("The Star")).toBeInTheDocument();
    expect(screen.getByText("本文テキスト")).toBeInTheDocument();
  });

  it("DetailPanelLayout の中でも幅が狭いときはボトムシートを使うこと", async () => {
    mockWide(false);
    const user = userEvent.setup();
    render(
      <DetailPanelLayout>
        <DetailSheet heading={heading} body={<p>本文テキスト</p>}>
          <span>開く</span>
        </DetailSheet>
      </DetailPanelLayout>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "詳細パネル" })).not.toBeInTheDocument();
  });

  it("DetailPanelLayout の中で幅が広いときはサイドパネルに表示し、閉じられること", async () => {
    mockWide(true);
    const user = userEvent.setup();
    render(
      <DetailPanelLayout>
        <DetailSheet heading={heading} body={<p>本文テキスト</p>}>
          <span>開く</span>
        </DetailSheet>
      </DetailPanelLayout>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    const panel = screen.getByRole("complementary", { name: "詳細パネル" });
    expect(panel).toHaveTextContent("星");
    expect(panel).toHaveTextContent("本文テキスト");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "詳細を閉じる" }));
    expect(screen.queryByRole("complementary", { name: "詳細パネル" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/__tests__/use-media-query.test.tsx src/components/detail`
Expected: FAIL(import 解決エラー)

- [ ] **Step 3: `useMediaQuery` を実装する**

```ts
// src/lib/use-media-query.ts
"use client";

import { useCallback, useSyncExternalStore } from "react";

function canMatch(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/** メディアクエリに一致しているか。サーバー描画時と matchMedia が無い環境では false */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatch()) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => canMatch() && window.matchMedia(query).matches,
    () => false,
  );
}
```

- [ ] **Step 4: 見出しの型と表示を実装する**

```tsx
// src/components/detail/detail-heading.tsx
import type { ReactNode } from "react";

/** 詳細表示の見出し。subtitle は分類(例「大アルカナ」)、description は補足(例: 英名・読み) */
export interface DetailHeading {
  title: string;
  subtitle?: string;
  description?: string;
}

/** 詳細表示の中身(見出し+本文) */
export interface DetailContent {
  heading: DetailHeading;
  body: ReactNode;
}

/** パネル用の見出し表示。ボトムシートでは Drawer.Title を使うため detail-sheet.tsx 側で描く */
export function DetailHeadingView({ heading }: { heading: DetailHeading }) {
  return (
    <header className="text-center">
      {heading.subtitle && <p className="text-gold-dim text-xs mb-1">{heading.subtitle}</p>}
      <h2 className="font-heading text-[26px] text-cream">{heading.title}</h2>
      {heading.description && (
        <p className="text-gold-dim text-sm font-accent mt-1">{heading.description}</p>
      )}
    </header>
  );
}
```

- [ ] **Step 5: サイドパネルを実装する**

```tsx
// src/components/detail/detail-panel.tsx
"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { useMediaQuery } from "@/lib/use-media-query";
import { DetailHeadingView, type DetailContent } from "./detail-heading";

interface DetailPanelContextValue {
  /** サイドパネルが使える状態か(DetailPanelLayout の中で、かつ 1280px 以上) */
  enabled: boolean;
  show: (content: DetailContent | null) => void;
}

const DetailPanelContext = createContext<DetailPanelContextValue | null>(null);

export function useDetailPanel(): DetailPanelContextValue | null {
  return useContext(DetailPanelContext);
}

/**
 * 1280px 以上で、詳細を右の第3カラム(340px)に表示するレイアウト。
 * パネルは本文に覆いかぶせず、本文の幅を縮めて並べる。
 */
export function DetailPanelLayout({ children }: { children: ReactNode }) {
  const isWide = useMediaQuery("(min-width: 1280px)");
  const [content, setContent] = useState<DetailContent | null>(null);
  const value = useMemo(() => ({ enabled: isWide, show: setContent }), [isWide]);
  const panel = isWide ? content : null;

  return (
    <DetailPanelContext.Provider value={value}>
      <div className={panel ? "grid flex-1 grid-cols-[minmax(0,1fr)_340px]" : "flex flex-1 flex-col"}>
        <div className="flex min-w-0 flex-col">{children}</div>
        {panel && (
          <aside
            aria-label="詳細パネル"
            className="sticky top-0 h-dvh overflow-y-auto border-l border-gold/35 bg-popover"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-popover px-5 py-4">
              <span className="text-xs tracking-[0.1em] text-gold-dim">詳細</span>
              <button
                type="button"
                aria-label="詳細を閉じる"
                onClick={() => setContent(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold-light hover:bg-gold/10"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 pb-8 pt-6">
              <DetailHeadingView heading={panel.heading} />
              {panel.body}
            </div>
          </aside>
        )}
      </div>
    </DetailPanelContext.Provider>
  );
}
```

- [ ] **Step 6: 汎用の詳細シートを実装する**

既存の `card-detail-sheet.tsx` の Drawer の構造(公式 Anatomy 準拠。コミット `e6b2d11`)をそのまま汎用化する。

```tsx
// src/components/detail/detail-sheet.tsx
"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { useDetailPanel } from "./detail-panel";
import type { DetailHeading } from "./detail-heading";

/**
 * 詳細を開くトリガーと、その表示先。
 * スマホ(と DetailPanelLayout の外)ではボトムシート、
 * DetailPanelLayout の中で 1280px 以上なら右サイドパネルに表示する。
 */
export function DetailSheet({
  heading,
  body,
  children,
  className,
  triggerLabel,
}: {
  heading: DetailHeading;
  body: ReactNode;
  /** トリガーの中身 */
  children: ReactNode;
  className?: string;
  /** トリガーの中身がテキストでない場合のアクセシブルな名前 */
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const panel = useDetailPanel();

  const handleOpenChange = (next: boolean) => {
    if (next && panel?.enabled) {
      panel.show({ heading, body });
      return;
    }
    setOpen(next);
  };

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Trigger
        render={(props) => (
          <button
            {...props}
            type="button"
            aria-label={triggerLabel}
            className={`cursor-pointer ${className ?? ""}`}
          >
            {children}
          </button>
        )}
      />
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 bg-black/60 z-[60]
            transition-opacity duration-300
            data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
        />
        <Drawer.Viewport className="fixed inset-x-0 bottom-0 z-[70]">
          <Drawer.Popup
            className="flex flex-col rounded-t-[28px]
              bg-popover border-t border-gold/35 max-h-[85vh] outline-none
              transition-transform duration-300 ease-out
              translate-y-[calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y))]
              data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full
              data-[swiping]:transition-none"
          >
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-2.5 pb-1 w-full cursor-grab active:cursor-grabbing select-none">
              <div className="w-10 h-[5px] rounded-full bg-gold-dim/60" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-11 pt-2 flex flex-col gap-3.5">
              <header className="text-center">
                {heading.subtitle && <p className="text-gold-dim text-xs mb-1">{heading.subtitle}</p>}
                <Drawer.Title className="font-heading text-2xl text-cream">{heading.title}</Drawer.Title>
                {heading.description && (
                  <Drawer.Description className="text-gold-dim text-sm font-accent mt-1">
                    {heading.description}
                  </Drawer.Description>
                )}
              </header>
              {body}
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

※ 下部ナビ(`z-50`)より前面に出すため、Backdrop を `z-[60]`、Viewport を `z-[70]` にしている。

- [ ] **Step 7: `CardDetailSheet` を薄いラッパーにする**

`src/components/card-detail-sheet.tsx` を次の内容に置き換える(呼び出し側の API `card` / `children` / `className` は変えない)。

```tsx
"use client";

import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";
import { DetailSheet } from "@/components/detail/detail-sheet";
import { suitNames } from "@/lib/tarot-utils";

/** タロットカードの詳細(画像+正逆タブ)を詳細シートで表示する。children がトリガー */
export function CardDetailSheet({
  card,
  children,
  className,
  triggerLabel,
}: {
  card: TarotCard;
  children: React.ReactNode;
  className?: string;
  triggerLabel?: string;
}) {
  const subtitle = card.arcana === "major"
    ? "大アルカナ"
    : (card.suit ? suitNames[card.suit].full : "小アルカナ");

  return (
    <DetailSheet
      heading={{ title: card.name.ja, subtitle, description: card.name.en }}
      body={<TarotCardSheetBody card={card} />}
      className={className}
      triggerLabel={triggerLabel}
    >
      {children}
    </DetailSheet>
  );
}

function TarotCardSheetBody({ card }: { card: TarotCard }) {
  return (
    <>
      <div className="flex justify-center">
        <div className="w-32 h-auto rounded-lg overflow-hidden border border-gold/30 shadow-lg shadow-black/40">
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={128}
            height={213}
            className="w-full h-auto"
          />
        </div>
      </div>
      <ScratchDivider className="text-gold" />
      <TarotCardMeaningTabs card={card} />
    </>
  );
}
```

- [ ] **Step 8: テストが通ることを確認する**

Run: `npx vitest run`
Expected: すべて PASS(`quiz-mode`・`home-content`・`daily-tarot` の既存テストも含む)

- [ ] **Step 9: lint と型チェック**

Run: `npx tsc --noEmit && npx eslint src/lib/use-media-query.ts src/components/detail src/components/card-detail-sheet.tsx`
Expected: エラーなし

- [ ] **Step 10: コミットする**

```bash
git add src/lib/use-media-query.ts src/lib/__tests__/use-media-query.test.tsx src/components/detail src/components/card-detail-sheet.tsx
git commit -m "feat: 詳細シートを汎用化し、PC幅では右サイドパネルに表示できるようにする"
```

---

### Task 5: ナビゲーションの作り直し(下部ナビ4項目+左サイドナビ)

**Files:**
- Create: `src/components/nav-items.ts`
- Modify: `src/components/bottom-nav.tsx`
- Create: `src/components/side-nav.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/components/__tests__/nav-items.test.ts`、`src/components/__tests__/bottom-nav.test.tsx`(書き換え)、`src/components/__tests__/side-nav.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/components/__tests__/nav-items.test.ts
import { describe, it, expect } from "vitest";
import { navItems, isNavActive } from "../nav-items";

describe("navItems", () => {
  it("ホーム・運勢・タロット・早見表の4項目であること", () => {
    expect(navItems.map((i) => [i.href, i.label])).toEqual([
      ["/", "ホーム"],
      ["/fortune", "運勢"],
      ["/tarot", "タロット"],
      ["/guide", "早見表"],
    ]);
  });
});

describe("isNavActive", () => {
  it("ホームは / のときだけアクティブ", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/", "/guide")).toBe(false);
  });

  it("配下のパスでもアクティブ", () => {
    expect(isNavActive("/tarot", "/tarot")).toBe(true);
    expect(isNavActive("/tarot", "/tarot/quiz")).toBe(true);
    expect(isNavActive("/guide", "/guide/tarot/major-00")).toBe(true);
    expect(isNavActive("/fortune", "/fortune/profile")).toBe(true);
  });

  it("前方一致だけの別パスはアクティブにしない", () => {
    expect(isNavActive("/tarot", "/tarotx")).toBe(false);
  });
});
```

`src/components/__tests__/bottom-nav.test.tsx` を次の内容に置き換える。

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("BottomNav", () => {
  it("4つのナビリンクが正しいhrefで表示されること", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "運勢" })).toHaveAttribute("href", "/fortune");
    expect(screen.getByRole("link", { name: "タロット" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "早見表" })).toHaveAttribute("href", "/guide");
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("navigation ロールとaria-labelが設定されていること", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "メインナビゲーション");
  });

  it("4項目を均等に並べ、強調表示の項目を持たないこと", () => {
    const { container } = render(<BottomNav />);
    expect(container.querySelector("ul")).toHaveClass("grid-cols-4");
    expect(container.querySelector(".rounded-full")).toBeNull();
  });

  it("PC幅(lg)では非表示になること", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation")).toHaveClass("lg:hidden");
  });

  it("配下のページでも該当項目に aria-current='page' が付くこと", () => {
    vi.mocked(usePathname).mockReturnValue("/tarot/quiz");
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "タロット" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "ホーム" })).not.toHaveAttribute("aria-current");
  });
});
```

```tsx
// src/components/__tests__/side-nav.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SideNav } from "@/components/side-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/guide/tarot/major-00"),
}));

describe("SideNav", () => {
  it("ロゴと4つのナビリンクを表示すること", () => {
    render(<SideNav />);
    expect(screen.getByText("tarot-everyday")).toBeInTheDocument();
    expect(screen.getByText("毎日の占いノート")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("現在地の項目に aria-current='page' が付くこと", () => {
    render(<SideNav />);
    expect(screen.getByRole("link", { name: "早見表" })).toHaveAttribute("aria-current", "page");
  });

  it("lg 未満では非表示であること", () => {
    render(<SideNav />);
    const aside = screen.getByRole("navigation").closest("aside");
    expect(aside).toHaveClass("hidden", "lg:flex");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/nav-items.test.ts src/components/__tests__/bottom-nav.test.tsx src/components/__tests__/side-nav.test.tsx`
Expected: FAIL

- [ ] **Step 3: ナビ定義を実装する**

```ts
// src/components/nav-items.ts
import type { IconName } from "@/components/icons/icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const navItems: readonly NavItem[] = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/fortune", label: "運勢", icon: "fortune" },
  { href: "/tarot", label: "タロット", icon: "tarot" },
  { href: "/guide", label: "早見表", icon: "guide" },
];

/** pathname がナビ項目 href の配下にあるか(ホームは完全一致のみ) */
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 4: 下部ナビを書き換える**

`src/components/bottom-nav.tsx` を次の内容に置き換える(旧アイコン関数はすべて削除)。

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { navItems, isNavActive } from "@/components/nav-items";

/** スマホ・タブレット(〜1023px)の下部固定ナビ */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gold/20 bg-background/96 backdrop-blur-sm px-2 pt-2 pb-[env(safe-area-inset-bottom)]"
      aria-label="メインナビゲーション"
    >
      <ul className="grid grid-cols-4 max-w-2xl mx-auto">
        {navItems.map(({ href, label, icon }) => {
          const isActive = isNavActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center gap-1 py-1.5 text-[10px] transition-colors ${
                  isActive ? "text-gold-light font-bold" : "text-gold-dim hover:text-cream"
                }`}
              >
                <Icon name={icon} size={22} strokeWidth={isActive ? 1.8 : 1.6} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 5: サイドナビを実装する**

```tsx
// src/components/side-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { navItems, isNavActive } from "@/components/nav-items";

/** PC(1024px〜)の左サイドナビ。幅 232px で画面左に固定 */
export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[232px] flex-col gap-7 border-r border-gold/15 bg-background px-4 py-7">
      <div className="flex flex-col gap-0.5 px-3">
        <span className="font-accent text-[28px] leading-none text-gold">tarot-everyday</span>
        <span className="text-[11px] tracking-[0.15em] text-gold-dark">毎日の占いノート</span>
      </div>
      <nav aria-label="メインナビゲーション">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon }) => {
            const isActive = isNavActive(href, pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-gold/12 font-bold text-gold-light"
                      : "text-gold-dim hover:bg-gold/5 hover:text-cream"
                  }`}
                >
                  <Icon name={icon} size={20} strokeWidth={isActive ? 1.8 : 1.6} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

(設計書 §10.2 のサイドナビ下部のプロフィール要約は、プロフィール機能と一緒にフェーズ1で追加する)

- [ ] **Step 6: レイアウトに組み込む**

`src/app/layout.tsx` を次のように変更する。

import に追加:

```tsx
import { SideNav } from "@/components/side-nav";
```

`viewport` に `viewportFit: "cover"` を追加する(`env(safe-area-inset-bottom)` を有効にするため)。

```tsx
export const viewport: Viewport = {
  themeColor: "#130C06",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};
```

`<body>` を次に置き換える。

```tsx
      <body className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[232px]">
        <SideNav />
        {children}
        <BottomNav />
        <ServiceWorkerRegistrar />
      </body>
```

- [ ] **Step 7: テストが通ることを確認する**

Run: `npx vitest run`
Expected: すべて PASS

- [ ] **Step 8: コミットする**

```bash
git add src/components/nav-items.ts src/components/bottom-nav.tsx src/components/side-nav.tsx src/app/layout.tsx src/components/__tests__/nav-items.test.ts src/components/__tests__/bottom-nav.test.tsx src/components/__tests__/side-nav.test.tsx
git commit -m "feat: メニューを4項目に再構成し、PC用の左サイドナビを追加"
```

---

### Task 6: ページ共通部品(日付表記・ボタン・本文コンテナ・見出し)

**Files:**
- Create: `src/lib/date-format.ts`
- Create: `src/lib/button-styles.ts`
- Create: `src/components/page-container.tsx`
- Create: `src/components/page-header.tsx`
- Test: `src/lib/__tests__/date-format.test.ts`、`src/components/__tests__/page-header.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/__tests__/date-format.test.ts
import { describe, it, expect } from "vitest";
import { formatJaDate, formatJaWeekday, formatEnWeekday } from "../date-format";

describe("date-format", () => {
  const d = new Date(2026, 9, 14); // 2026-10-14(水)

  it("年月日を日本語で表記すること", () => {
    expect(formatJaDate(d)).toBe("2026年10月14日");
  });

  it("曜日を日本語で表記すること", () => {
    expect(formatJaWeekday(d)).toBe("水曜日");
    expect(formatJaWeekday(new Date(2026, 9, 18))).toBe("日曜日");
  });

  it("曜日を英語で表記すること", () => {
    expect(formatEnWeekday(d)).toBe("Wednesday");
  });
});
```

```tsx
// src/components/__tests__/page-header.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  it("アクセント・見出し(h1)・説明を表示すること", () => {
    render(<PageHeader accent="Tarot" title="タロット" description="今日はどちらにしますか" />);
    expect(screen.getByText("Tarot")).toHaveClass("font-accent");
    expect(screen.getByRole("heading", { level: 1, name: "タロット" })).toBeInTheDocument();
    expect(screen.getByText("今日はどちらにしますか")).toBeInTheDocument();
  });

  it("区切り線を表示すること", () => {
    const { container } = render(<PageHeader accent="Guide" title="早見表" />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/__tests__/date-format.test.ts src/components/__tests__/page-header.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```ts
// src/lib/date-format.ts
const JA_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** 例: 2026年10月14日 */
export function formatJaDate(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 例: 水曜日 */
export function formatJaWeekday(d: Date): string {
  return `${JA_WEEKDAYS[d.getDay()]}曜日`;
}

/** 例: Wednesday */
export function formatEnWeekday(d: Date): string {
  return EN_WEEKDAYS[d.getDay()];
}
```

```ts
// src/lib/button-styles.ts
/** 共通ボタンのクラス(Claude Design の Components に準拠。最小高さ44px、角丸14px) */
const base =
  "inline-flex items-center justify-center gap-1.5 rounded-[14px] min-h-11 px-5 text-[15px] font-bold transition-colors";

export const primaryButton = `${base} min-h-12 bg-gold text-background hover:bg-gold-light`;
export const secondaryButton = `${base} border border-gold/50 bg-gold/10 text-gold-light hover:bg-gold/20`;
export const outlineButton = `${base} border border-gold/40 text-[14px] font-normal text-gold-light hover:bg-gold/10`;
```

```tsx
// src/components/page-container.tsx
import type { ReactNode } from "react";

/** ページ本文の幅と余白(タブレットは最大672px、PCは最大1000px) */
export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[672px] flex-1 flex-col gap-5 px-4 py-6 lg:max-w-[1000px] lg:gap-7 lg:px-12 lg:py-10 ${className}`}
    >
      {children}
    </div>
  );
}
```

```tsx
// src/components/page-header.tsx
import { ScratchDivider } from "@/components/svg/scratch-decorations";

/** ページ見出し: Caveat の英字アクセント+見出し+手描き風の区切り線+説明 */
export function PageHeader({
  accent,
  title,
  description,
}: {
  accent: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="flex flex-col gap-1.5 px-1">
      <p className="font-accent text-2xl leading-none text-gold lg:text-[26px]">{accent}</p>
      <h1 className="font-heading text-2xl text-cream lg:text-[30px]">{title}</h1>
      {/* ScratchDivider は w-full なので、外側の要素で幅を決める */}
      <div className="w-40">
        <ScratchDivider className="text-gold" />
      </div>
      {description && <p className="text-[13px] text-gold-dim lg:text-sm">{description}</p>}
    </header>
  );
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/__tests__/date-format.test.ts src/components/__tests__/page-header.test.tsx`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/lib/date-format.ts src/lib/button-styles.ts src/components/page-container.tsx src/components/page-header.tsx src/lib/__tests__/date-format.test.ts src/components/__tests__/page-header.test.tsx
git commit -m "feat: ページ共通部品(日付表記・ボタン・本文コンテナ・見出し)を追加"
```

---

### Task 7: 1dayタロットの状態フックと表示部品

ホームと運勢ページの両方で1dayタロットを表示・抽選できるようにする。状態は localStorage(キー `tarot-daily-draw`、`src/lib/daily-draw.ts` の既存関数)を `useSyncExternalStore` で購読する。

**Files:**
- Create: `src/lib/use-daily-draw.ts`
- Create: `src/components/daily-tarot-card.tsx`
- Test: `src/components/__tests__/daily-tarot-card.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/__tests__/daily-tarot-card.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DailyTarotCard } from "../daily-tarot-card";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
};

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("DailyTarotCard", () => {
  it("未抽選なら案内文と「カードを引く」ボタンを表示すること", () => {
    render(<DailyTarotCard variant="fortune" />);
    expect(screen.getByText("今日のカードはまだ引いていません。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "カードを引く" })).toBeInTheDocument();
  });

  it("「カードを引く」を押すと結果を表示し、保存すること", async () => {
    const user = userEvent.setup();
    render(<DailyTarotCard variant="fortune" />);
    await user.click(screen.getByRole("button", { name: "カードを引く" }));
    expect(screen.getByText(/^(正位置|逆位置)$/)).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tarot-daily-draw", expect.any(String));
  });

  it("抽選済みならカード名・英名・正逆・キーワードを表示すること", () => {
    store["tarot-daily-draw"] = JSON.stringify({ cardId: "major-00", isReversed: false, date: todayKey() });
    render(<DailyTarotCard variant="fortune" />);
    expect(screen.getByText("愚者")).toBeInTheDocument();
    expect(screen.getByText("The Fool")).toBeInTheDocument();
    expect(screen.getByText("正位置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "愚者の詳細を見る" })).toBeInTheDocument();
  });

  it("逆位置のときはカード画像を180度回転すること", () => {
    store["tarot-daily-draw"] = JSON.stringify({ cardId: "major-00", isReversed: true, date: todayKey() });
    render(<DailyTarotCard variant="home" />);
    expect(screen.getByRole("img", { name: "愚者" })).toHaveClass("rotate-180");
    expect(screen.getByText("逆位置")).toBeInTheDocument();
  });

  it("前日の結果は未抽選として扱うこと", () => {
    store["tarot-daily-draw"] = JSON.stringify({ cardId: "major-00", isReversed: false, date: "2000-01-01" });
    render(<DailyTarotCard variant="home" />);
    expect(screen.getByRole("button", { name: "カードを引く" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/daily-tarot-card.test.tsx`
Expected: FAIL

- [ ] **Step 3: 状態フックを実装する**

```ts
// src/lib/use-daily-draw.ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TarotCard } from "@/data/types";
import { allCards, getCardById } from "@/data/cards";
import {
  type DailyDrawResult,
  drawRandomCard,
  getTodayKey,
  loadTodayDraw,
  saveDraw,
} from "@/lib/daily-draw";

const STORAGE_KEY = "tarot-daily-draw";
const listeners = new Set<() => void>();

let cacheKey: string | null = null;
let cacheValue: DailyDrawResult | null = null;

/** localStorage の値と日付が変わらない限り同じ参照を返す(useSyncExternalStore の要件) */
function getSnapshot(): DailyDrawResult | null {
  const key = `${localStorage.getItem(STORAGE_KEY)}|${getTodayKey()}`;
  if (key !== cacheKey) {
    cacheKey = key;
    cacheValue = loadTodayDraw();
  }
  return cacheValue;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

const subscribeNoop = () => () => {};

export interface DailyDrawState {
  /** クライアントで localStorage を読み終えたか(サーバー描画・ハイドレーション中は false) */
  ready: boolean;
  draw: DailyDrawResult | null;
  card: TarotCard | null;
  drawNow: () => void;
}

/** 今日の1dayタロット。ホームと運勢ページで同じ結果を共有する */
export function useDailyDraw(): DailyDrawState {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const draw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const card = draw ? getCardById(draw.cardId) ?? null : null;

  const drawNow = useCallback(() => {
    saveDraw(drawRandomCard(allCards));
    listeners.forEach((l) => l());
  }, []);

  return { ready, draw: card ? draw : null, card, drawNow };
}
```

- [ ] **Step 4: 表示部品を実装する**

`variant="home"` はホームの「今日の運勢」カード内に、`variant="fortune"` は運勢ページで単独のカードとして表示する。

```tsx
// src/components/daily-tarot-card.tsx
"use client";

import Image from "next/image";
import { Icon } from "@/components/icons/icon";
import { OrientationBadge } from "@/components/orientation-badge";
import { CardDetailSheet } from "@/components/card-detail-sheet";
import { secondaryButton } from "@/lib/button-styles";
import { useDailyDraw } from "@/lib/use-daily-draw";

type Variant = "home" | "fortune";

const sizes: Record<Variant, { box: string; width: number; height: number }> = {
  home: { box: "w-[72px] h-[120px] lg:w-[110px] lg:h-[184px]", width: 110, height: 184 },
  fortune: { box: "w-[84px] h-[140px] lg:w-24 lg:h-40", width: 96, height: 160 },
};

/** 今日の1dayタロット。未抽選ならその場で引ける。カードをタップすると詳細を開く */
export function DailyTarotCard({ variant }: { variant: Variant }) {
  const { ready, draw, card, drawNow } = useDailyDraw();
  const size = sizes[variant];
  const label = variant === "home" ? "1dayタロット" : "今日の1dayタロット";

  if (!ready) {
    return <div className={`${size.box} rounded-[10px] bg-popover`} aria-hidden="true" />;
  }

  if (!draw || !card) {
    return (
      <div className="flex items-center gap-3.5">
        <div
          className={`${size.box} flex flex-none items-center justify-center rounded-[10px] border border-dashed border-gold/50 bg-popover text-gold-dark`}
        >
          <Icon name="tarot" size={26} strokeWidth={1.4} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[11px] text-gold-dim">{label}</p>
          <p className="text-sm leading-relaxed">今日のカードはまだ引いていません。</p>
          <button type="button" onClick={drawNow} className={secondaryButton}>
            カードを引く
          </button>
        </div>
      </div>
    );
  }

  const keywords = draw.isReversed ? card.keywords.reversed : card.keywords.upright;
  const general = draw.isReversed ? card.fortune.general.reversed : card.fortune.general.upright;

  return (
    <div className="flex items-center gap-4 lg:gap-5">
      <CardDetailSheet card={card} triggerLabel={`${card.name.ja}の詳細を見る`} className="flex-none">
        <span className={`${size.box} block overflow-hidden rounded-[10px] border border-gold/40`}>
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={size.width}
            height={size.height}
            className={`h-full w-full object-cover ${draw.isReversed ? "rotate-180" : ""}`}
          />
        </span>
      </CardDetailSheet>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-[11px] tracking-[0.1em] text-gold-dim">{label}</p>
        <p className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="font-heading text-[22px] leading-tight lg:text-[26px]">{card.name.ja}</span>
          <span className="font-accent text-lg leading-none text-gold lg:text-xl">{card.name.en}</span>
        </p>
        <OrientationBadge isReversed={draw.isReversed} />
        <p className="text-[13px] lg:text-sm">{keywords.join(" · ")}</p>
        {variant === "fortune" && (
          <p className="hidden max-w-[420px] text-[13px] leading-relaxed text-gold-dim lg:block">{general}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx vitest run src/components/__tests__/daily-tarot-card.test.tsx`
Expected: PASS(5 tests)

- [ ] **Step 6: lint を確認する**

Run: `npx eslint src/lib/use-daily-draw.ts src/components/daily-tarot-card.tsx`
Expected: エラーなし

- [ ] **Step 7: コミットする**

```bash
git add src/lib/use-daily-draw.ts src/components/daily-tarot-card.tsx src/components/__tests__/daily-tarot-card.test.tsx
git commit -m "feat: 1dayタロットの状態フックと、ホーム・運勢ページ用の表示部品を追加"
```

---

### Task 8: 旧URLからの転送部品

**Files:**
- Create: `src/components/client-redirect.tsx`
- Test: `src/components/__tests__/client-redirect.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/__tests__/client-redirect.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientRedirect } from "../client-redirect";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("ClientRedirect", () => {
  it("新しいURLへ router.replace で移動すること", () => {
    render(<ClientRedirect to="/guide" />);
    expect(replace).toHaveBeenCalledWith("/guide");
  });

  it("移動できなかった場合のためにリンクを表示すること", () => {
    render(<ClientRedirect to="/tarot/quiz" />);
    expect(screen.getByRole("link", { name: "新しいページを開く" })).toHaveAttribute("href", "/tarot/quiz");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/client-redirect.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/client-redirect.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 旧URLから新URLへ転送する。
 * 静的エクスポート(output: "export")では next.config の redirects が使えないため、クライアント側で移動する。
 */
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-gold-dim">ページが移動しました。</p>
      <Link href={to} className="text-sm text-gold-light underline underline-offset-4">
        新しいページを開く
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/components/__tests__/client-redirect.test.tsx`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/client-redirect.tsx src/components/__tests__/client-redirect.test.tsx
git commit -m "feat: 旧URLから新URLへ転送する部品を追加"
```

---

### Task 9: タロット(占い・クイズ)と早見表の新URLへの移設

**Files:**
- Create: `src/app/tarot/reading/page.tsx`、`src/app/tarot/quiz/page.tsx`
- Create: `src/app/guide/page.tsx`、`src/app/guide/tarot/[id]/page.tsx`
- Modify: `src/app/reading/page.tsx`、`src/app/quiz/page.tsx`、`src/app/cards/page.tsx`、`src/app/cards/[id]/page.tsx`
- Modify: `src/components/card-tile.tsx`、`src/components/card-list.tsx`、`src/components/card-detail.tsx`
- Test: `src/components/__tests__/card-tile.test.tsx`、`src/components/__tests__/card-list.test.tsx`、`src/components/__tests__/card-detail.test.tsx`、`src/app/guide/__tests__/guide-page.test.tsx`

- [ ] **Step 1: テストを新URLに合わせて書き換える**

`src/components/__tests__/card-tile.test.tsx` の `expect(link).toHaveAttribute("href", "/cards/major-00");` を `expect(link).toHaveAttribute("href", "/guide/tarot/major-00");` に、`src/components/__tests__/card-list.test.tsx` の同じ行も同様に書き換える。

`src/components/__tests__/card-detail.test.tsx` のパンくずのテストを次に置き換える。

```tsx
  it("パンくずリストが表示されること", () => {
    render(<CardDetail card={mockCard} />);
    const nav = screen.getByLabelText("パンくずリスト");
    expect(nav).toHaveTextContent("早見表");
    expect(nav).toHaveTextContent("タロット");
    expect(screen.getByRole("link", { name: "早見表" })).toHaveAttribute("href", "/guide");
  });
```

早見表ページのテストを追加する。

```tsx
// src/app/guide/__tests__/guide-page.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GuidePage from "../page";

describe("早見表ページ", () => {
  it("見出しと占術タブ(タロット)を表示すること", () => {
    render(<GuidePage />);
    expect(screen.getByRole("heading", { level: 1, name: "早見表" })).toBeInTheDocument();
    const tabs = screen.getByRole("navigation", { name: "占術" });
    expect(tabs).toHaveTextContent("タロット");
    expect(screen.getByText("タロット", { selector: "[aria-current='page']" })).toBeInTheDocument();
  });

  it("タロットのカード一覧を表示すること", () => {
    render(<GuidePage />);
    expect(screen.getByText("全78枚のタロットカード")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /の詳細を見る/ })).toHaveLength(78);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/card-tile.test.tsx src/components/__tests__/card-list.test.tsx src/components/__tests__/card-detail.test.tsx src/app/guide`
Expected: FAIL

- [ ] **Step 3: リンク先を変更する**

- `src/components/card-tile.tsx`: `` href={`/cards/${card.id}`} `` を `` href={`/guide/tarot/${card.id}`} `` に変更する。
- `src/components/card-list.tsx`: 同じく `` href={`/guide/tarot/${card.id}`} `` に変更する。
- `src/components/card-detail.tsx`: パンくずを次に置き換え、外側の div の `pb-20` を削除する(下部ナビの余白は `layout.tsx` の body が持つ)。

```tsx
      <nav aria-label="パンくずリスト" className="text-xs text-gold-dim">
        <Link href="/guide" className="hover:text-gold transition-colors">
          早見表
        </Link>
        <span className="mx-1">/</span>
        <span>タロット</span>
        <span className="mx-1">/</span>
        <span className="text-cream">{card.name.ja}</span>
      </nav>
```

- [ ] **Step 4: 新しいページを作る**

```tsx
// src/app/tarot/reading/page.tsx
import { SpreadReadingFlow } from "@/components/spread-reading-flow";

export default function TarotReadingPage() {
  return <SpreadReadingFlow />;
}
```

```tsx
// src/app/tarot/quiz/page.tsx
import { QuizMode } from "@/components/quiz-mode";

export default function TarotQuizPage() {
  return <QuizMode />;
}
```

```tsx
// src/app/guide/page.tsx
import { CardBrowser } from "@/components/card-browser";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { allCards } from "@/data/cards";

/** 早見表の占術タブ。フェーズ1以降で占術を追加し、切り替えられるようにする */
const guideSystems = [{ id: "tarot", label: "タロット" }] as const;

export default function GuidePage() {
  return (
    <PageContainer>
      <PageHeader accent="Guide" title="早見表" />

      <nav aria-label="占術" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <ul className="flex gap-1.5 lg:flex-wrap">
          {guideSystems.map((s) => (
            <li key={s.id}>
              <span
                aria-current="page"
                className="flex min-h-[38px] items-center whitespace-nowrap rounded-full border border-gold bg-gold px-3.5 text-[13px] font-bold text-background lg:min-h-10 lg:px-[18px] lg:text-sm"
              >
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <section className="flex flex-col gap-4">
        <p className="text-xs text-gold-dim">全78枚のタロットカード</p>
        <CardBrowser cards={allCards} />
      </section>
    </PageContainer>
  );
}
```

```tsx
// src/app/guide/tarot/[id]/page.tsx
import { notFound } from "next/navigation";
import { allCards, getCardById } from "@/data/cards";
import { CardDetail } from "@/components/card-detail";

export function generateStaticParams() {
  return allCards.map((card) => ({ id: card.id }));
}

export default async function GuideTarotCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCardById(id);

  if (!card) {
    notFound();
  }

  return <CardDetail card={card} />;
}
```

- [ ] **Step 5: 旧URLを転送専用にする**

```tsx
// src/app/reading/page.tsx
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyReadingPage() {
  return <ClientRedirect to="/tarot/reading" />;
}
```

```tsx
// src/app/quiz/page.tsx
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyQuizPage() {
  return <ClientRedirect to="/tarot/quiz" />;
}
```

```tsx
// src/app/cards/page.tsx
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyCardsPage() {
  return <ClientRedirect to="/guide" />;
}
```

```tsx
// src/app/cards/[id]/page.tsx
import { notFound } from "next/navigation";
import { allCards, getCardById } from "@/data/cards";
import { ClientRedirect } from "@/components/client-redirect";

export function generateStaticParams() {
  return allCards.map((card) => ({ id: card.id }));
}

export default async function LegacyCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getCardById(id)) {
    notFound();
  }
  return <ClientRedirect to={`/guide/tarot/${id}`} />;
}
```

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx vitest run`
Expected: すべて PASS

- [ ] **Step 7: コミットする**

```bash
git add -A src/app src/components/card-tile.tsx src/components/card-list.tsx src/components/card-detail.tsx src/components/__tests__
git commit -m "feat: タロット占い・クイズ・早見表を新URLへ移設し、旧URLを転送ページにする"
```

---

### Task 10: タロットの入口ページ(`/tarot`)

**Files:**
- Create: `src/components/tarot-entry.tsx`
- Create: `src/app/tarot/page.tsx`
- Test: `src/components/__tests__/tarot-entry.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/__tests__/tarot-entry.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TarotEntry } from "../tarot-entry";

describe("TarotEntry", () => {
  it("見出しと案内文を表示すること", () => {
    render(<TarotEntry />);
    expect(screen.getByRole("heading", { level: 1, name: "タロット" })).toBeInTheDocument();
    expect(screen.getByText("今日はどちらにしますか")).toBeInTheDocument();
  });

  it("占いとクイズの2択へのリンクを表示すること", () => {
    render(<TarotEntry />);
    expect(screen.getByRole("link", { name: /タロット占いをする/ })).toHaveAttribute("href", "/tarot/reading");
    expect(screen.getByRole("link", { name: /クイズで練習する/ })).toHaveAttribute("href", "/tarot/quiz");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/tarot-entry.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/tarot-entry.tsx
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/icon";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

const choices: { href: string; icon: IconName; accent: string; title: string; description: string }[] = [
  {
    href: "/tarot/reading",
    icon: "spread",
    accent: "Reading",
    title: "タロット占いをする",
    description: "相談したいことを決めて、スプレッドを選んでカードを引きます。",
  },
  {
    href: "/tarot/quiz",
    icon: "quiz",
    accent: "Practice",
    title: "クイズで練習する",
    description: "78枚のカードの意味を、正位置・逆位置のクイズで覚えます。",
  },
];

/** タロットの入口(占い / クイズの2択) */
export function TarotEntry() {
  return (
    <PageContainer className="lg:gap-9">
      <PageHeader accent="Tarot" title="タロット" description="今日はどちらにしますか" />
      <div className="grid flex-1 gap-3.5 lg:flex-none lg:grid-cols-2 lg:gap-6">
        {choices.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex min-h-[220px] flex-col justify-between gap-5 rounded-3xl border border-gold/30 bg-surface p-6 text-cream transition-colors hover:border-gold/60 lg:min-h-[340px] lg:gap-7 lg:rounded-[28px] lg:p-8"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/14 text-gold-light lg:h-16 lg:w-16 lg:rounded-[18px]">
              <Icon name={c.icon} size={28} strokeWidth={1.5} />
            </span>
            <span className="flex flex-col gap-1.5 lg:gap-2">
              <span className="font-accent text-base leading-none text-gold-dark lg:text-lg">{c.accent}</span>
              <span className="font-heading text-[22px] lg:text-[26px]">{c.title}</span>
              <span className="text-[13px] leading-relaxed text-gold-dim lg:text-sm">{c.description}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-gold-light lg:text-sm">
              はじめる
              <Icon name="right" size={16} strokeWidth={1.8} />
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
```

```tsx
// src/app/tarot/page.tsx
import { TarotEntry } from "@/components/tarot-entry";

export default function TarotPage() {
  return <TarotEntry />;
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/components/__tests__/tarot-entry.test.tsx`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/tarot-entry.tsx src/app/tarot/page.tsx src/components/__tests__/tarot-entry.test.tsx
git commit -m "feat: タロットの入口ページ(占い・クイズの2択)を追加"
```

---

### Task 11: 今日の日付フックとホームの新デザイン

**Files:**
- Create: `src/lib/use-today.ts`
- Modify: `src/components/home-content.tsx`
- Test: `src/lib/__tests__/use-today.test.tsx`、`src/components/__tests__/home-content.test.tsx`(書き換え)

- [ ] **Step 1: 日付フックの失敗するテストを書く**

```tsx
// src/lib/__tests__/use-today.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useToday } from "../use-today";

function Probe() {
  const today = useToday();
  return <p>{today ? `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}` : "none"}</p>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useToday", () => {
  it("今日の0時の Date を返すこと", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 15, 30));
    render(<Probe />);
    expect(screen.getByText("2026-10-14 0")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/lib/__tests__/use-today.test.tsx`
Expected: FAIL

- [ ] **Step 3: 日付フックを実装する**

`useSyncExternalStore` の `getSnapshot` は毎回同じ値を返す必要があるので、`Date` ではなく日付文字列をスナップショットにする。

```ts
// src/lib/use-today.ts
"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** 今日の0時の Date(サーバー描画・ハイドレーション中は null) */
export function useToday(): Date | null {
  const key = useSyncExternalStore(subscribeNoop, () => new Date().toDateString(), () => null);
  return key ? new Date(key) : null;
}
```

Run: `npx vitest run src/lib/__tests__/use-today.test.tsx`
Expected: PASS

- [ ] **Step 4: ホームのテストを書き換える**

`src/components/__tests__/home-content.test.tsx` を次の内容に置き換える。

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeContent } from "../home-content";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
};

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("HomeContent", () => {
  it("アプリ名を見出しとして表示すること", () => {
    render(<HomeContent />);
    expect(screen.getByRole("heading", { level: 1, name: "tarot-everyday" })).toBeInTheDocument();
  });

  it("「今日の運勢」カードに1dayタロットと「詳しく見る」を表示すること", () => {
    render(<HomeContent />);
    const today = screen.getByRole("region", { name: "今日の運勢" });
    expect(today).toHaveTextContent("1dayタロット");
    expect(screen.getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/fortune");
  });

  it("未抽選ならホームから直接カードを引けること", () => {
    render(<HomeContent />);
    expect(screen.getByRole("button", { name: "カードを引く" })).toBeInTheDocument();
  });

  it("抽選済みならカード名を表示すること", () => {
    store["tarot-daily-draw"] = JSON.stringify({ cardId: "major-00", isReversed: false, date: todayKey() });
    render(<HomeContent />);
    expect(screen.getByText("愚者")).toBeInTheDocument();
    expect(screen.getByText("正位置")).toBeInTheDocument();
  });

  it("各ページへの入口リンクを表示すること", () => {
    render(<HomeContent />);
    const menu = screen.getByRole("navigation", { name: "メニュー" });
    expect(menu.querySelector('a[href="/tarot/reading"]')).toHaveTextContent("相談したいことがある");
    expect(menu.querySelector('a[href="/tarot/quiz"]')).toHaveTextContent("タロットクイズ");
    expect(menu.querySelector('a[href="/guide"]')).toHaveTextContent("早見表");
  });

  it("絵文字を使わないこと", () => {
    const { container } = render(<HomeContent />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u);
  });
});
```

- [ ] **Step 5: テストが失敗することを確認する**

Run: `npx vitest run src/components/__tests__/home-content.test.tsx`
Expected: FAIL

- [ ] **Step 6: ホームを書き換える**

`src/components/home-content.tsx` を次の内容に置き換える。

```tsx
"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/icon";
import { DailyTarotCard } from "@/components/daily-tarot-card";
import { PageContainer } from "@/components/page-container";
import { primaryButton } from "@/lib/button-styles";
import { formatEnWeekday, formatJaDate, formatJaWeekday } from "@/lib/date-format";
import { useToday } from "@/lib/use-today";

const entries: { href: string; icon: IconName; title: string; sub: string }[] = [
  { href: "/tarot/reading", icon: "chat", title: "相談したいことがある", sub: "タロット占い" },
  { href: "/tarot/quiz", icon: "quiz", title: "タロットクイズ", sub: "カードの意味を練習する" },
  { href: "/guide", icon: "guide", title: "早見表", sub: "タロットと7占術の要素を調べる" },
];

export function HomeContent() {
  const today = useToday();

  return (
    <PageContainer>
      <header className="flex flex-col gap-0.5 px-1">
        <h1 className="font-accent text-[30px] leading-none text-gold lg:sr-only">tarot-everyday</h1>
        {today && (
          <>
            <p className="text-xs text-gold-dim lg:hidden">
              {formatJaDate(today)} {formatJaWeekday(today)}
            </p>
            <p className="hidden font-accent text-[26px] leading-none text-gold lg:block">{formatEnWeekday(today)}</p>
            <p className="hidden font-heading text-[30px] lg:block">{formatJaDate(today)}</p>
          </>
        )}
      </header>

      <section
        aria-label="今日の運勢"
        className="flex flex-col gap-3.5 rounded-[22px] border border-gold/30 bg-surface p-[18px] lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-7 lg:rounded-3xl lg:p-7"
      >
        <div className="flex flex-col gap-3.5 lg:gap-3">
          <div className="flex items-baseline justify-between lg:justify-start lg:gap-2.5">
            <h2 className="font-heading text-[19px] lg:text-[22px]">今日の運勢</h2>
            <span className="font-accent text-base text-gold-dark lg:text-[17px]">Today&apos;s fortune</span>
          </div>
          <DailyTarotCard variant="home" />
        </div>
        <Link href="/fortune" className={`${primaryButton} lg:px-[22px]`}>
          詳しく見る
          <Icon name="right" size={16} strokeWidth={2} />
        </Link>
      </section>

      <nav aria-label="メニュー">
        <ul className="flex flex-col gap-2.5 lg:grid lg:grid-cols-3 lg:gap-4">
          {entries.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                className="flex min-h-[76px] items-center gap-3.5 rounded-[18px] border border-gold/25 bg-surface p-4 text-cream transition-colors hover:border-gold/50 lg:min-h-[150px] lg:flex-col lg:items-start lg:rounded-[20px] lg:p-[22px]"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gold/12 text-gold-light lg:h-12 lg:w-12 lg:rounded-[14px]">
                  <Icon name={e.icon} size={22} />
                </span>
                <span className="flex flex-1 flex-col gap-0.5 lg:gap-1">
                  <span className="font-heading text-base lg:text-[17px]">{e.title}</span>
                  <span className="text-xs text-gold-dim">{e.sub}</span>
                </span>
                <Icon name="right" size={18} className="text-gold-dark lg:hidden" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </PageContainer>
  );
}
```

- [ ] **Step 7: テストと lint を確認する**

Run: `npx vitest run src/lib/__tests__/use-today.test.tsx src/components/__tests__/home-content.test.tsx && npx eslint src/lib/use-today.ts src/components/home-content.tsx`
Expected: PASS(7 tests)、lint エラーなし

- [ ] **Step 8: コミットする**

```bash
git add src/lib/use-today.ts src/lib/__tests__/use-today.test.tsx src/components/home-content.tsx src/components/__tests__/home-content.test.tsx
git commit -m "feat: ホームを新デザインにする(今日の運勢カードと各ページへの入口)"
```

---

### Task 12: 運勢ページの外枠(`/fortune`)と `/daily` の転送

**Files:**
- Create: `src/components/fortune/fortune-content.tsx`
- Create: `src/app/fortune/page.tsx`
- Modify: `src/app/daily/page.tsx`
- Delete: `src/components/daily-tarot.tsx`、`src/components/__tests__/daily-tarot.test.tsx`
- Test: `src/components/fortune/__tests__/fortune-content.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/fortune/__tests__/fortune-content.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FortuneContent } from "../fortune-content";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
};

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("FortuneContent", () => {
  it("ページ見出しと今日の日付を表示すること", () => {
    render(<FortuneContent />);
    expect(screen.getByRole("heading", { level: 1, name: "運勢" })).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    const d = new Date();
    expect(screen.getByText(`${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`)).toBeInTheDocument();
  });

  it("今日の1dayタロットを表示すること", () => {
    render(<FortuneContent />);
    const section = screen.getByRole("region", { name: "今日の1dayタロット" });
    expect(section).toHaveTextContent("今日のカードはまだ引いていません。");
  });

  it("PC幅ではカードの詳細を右サイドパネルに表示すること", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    store["tarot-daily-draw"] = JSON.stringify({ cardId: "major-00", isReversed: false, date: todayKey() });
    const user = userEvent.setup();
    render(<FortuneContent />);
    await user.click(screen.getByRole("button", { name: "愚者の詳細を見る" }));
    expect(screen.getByRole("complementary", { name: "詳細パネル" })).toHaveTextContent("The Fool");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx vitest run src/components/fortune`
Expected: FAIL

- [ ] **Step 3: 実装する**

```tsx
// src/components/fortune/fortune-content.tsx
"use client";

import { DailyTarotCard } from "@/components/daily-tarot-card";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import { PageContainer } from "@/components/page-container";
import { formatJaDate, formatJaWeekday } from "@/lib/date-format";
import { useToday } from "@/lib/use-today";

/**
 * 運勢ページ。フェーズ0では1dayタロットのみ。
 * フェーズ1でプロフィールの要約・期間タブ・7占術の運勢カード・人物像・総合鑑定プロンプトを追加する。
 */
export function FortuneContent() {
  const today = useToday();

  return (
    <DetailPanelLayout>
      <PageContainer>
        <h1 className="sr-only">運勢</h1>
        <header className="flex flex-col gap-1 px-1">
          <p className="font-accent text-[22px] leading-none text-gold lg:text-[26px]">Today</p>
          {today && (
            <p className="font-heading text-[22px] leading-tight lg:text-[30px]">
              <span>{formatJaDate(today)}</span>
              <span className="ml-2 text-[13px] text-gold-dim lg:ml-2.5 lg:text-[15px]">{formatJaWeekday(today)}</span>
            </p>
          )}
        </header>

        <section
          aria-label="今日の1dayタロット"
          className="rounded-[20px] border border-gold/25 bg-surface p-4 lg:p-5"
        >
          <DailyTarotCard variant="fortune" />
        </section>
      </PageContainer>
    </DetailPanelLayout>
  );
}
```

```tsx
// src/app/fortune/page.tsx
import { FortuneContent } from "@/components/fortune/fortune-content";

export default function FortunePage() {
  return <FortuneContent />;
}
```

```tsx
// src/app/daily/page.tsx
import { ClientRedirect } from "@/components/client-redirect";

export default function LegacyDailyPage() {
  return <ClientRedirect to="/fortune" />;
}
```

- [ ] **Step 4: 使われなくなった `DailyTarot` を削除する**

Run: `git rm src/components/daily-tarot.tsx src/components/__tests__/daily-tarot.test.tsx`

Run: `grep -rn "daily-tarot\"" src`
Expected: 出力なし(`daily-tarot-card` は別物なので、末尾が `daily-tarot"` の import がないこと)

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx vitest run`
Expected: すべて PASS

- [ ] **Step 6: コミットする**

```bash
git add -A src
git commit -m "feat: 運勢ページの外枠を追加し、1dayタロットを統合。/daily は /fortune へ転送"
```

---

### Task 13: Service Worker のキャッシュ対象を更新

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: キャッシュ名とプリキャッシュ対象を変更する**

`public/sw.js` の先頭2つの定数を次に置き換える(キャッシュ名を変えることで、activate 時に旧キャッシュが削除される)。

```js
const CACHE_NAME = "tarot-everyday-v2";

// プリキャッシュする静的リソース
const PRECACHE_URLS = ["/", "/fortune", "/tarot", "/guide"];
```

- [ ] **Step 2: コミットする**

```bash
git add public/sw.js
git commit -m "chore: Service Worker のキャッシュ対象を新しいURLに更新"
```

---

### Task 14: E2Eテストの更新

**Files:**
- Modify: `e2e/navigation.spec.ts`、`e2e/home.spec.ts`、`e2e/cards-grid.spec.ts`、`e2e/card-detail.spec.ts`、`e2e/reading.spec.ts`、`e2e/quiz.spec.ts`
- Delete: `e2e/daily.spec.ts`
- Create: `e2e/fortune.spec.ts`、`e2e/redirects.spec.ts`、`e2e/tarot.spec.ts`

- [ ] **Step 1: ナビゲーションのテストを書き換える**

`e2e/navigation.spec.ts` を次の内容に置き換える。

```ts
import { test, expect } from "@playwright/test";

const nav = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "メインナビゲーション" });

test.describe("メインナビゲーション", () => {
  test("4つのナビリンクが表示されていること", async ({ page }) => {
    await page.goto("/");
    await expect(nav(page)).toBeVisible();
    for (const label of ["ホーム", "運勢", "タロット", "早見表"]) {
      await expect(nav(page).getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav(page).getByRole("link")).toHaveCount(4);
  });

  test("各リンクで正しいページに遷移すること", async ({ page }) => {
    await page.goto("/");
    await nav(page).getByRole("link", { name: "早見表" }).click();
    await expect(page).toHaveURL("/guide");
    await nav(page).getByRole("link", { name: "タロット" }).click();
    await expect(page).toHaveURL("/tarot");
    await nav(page).getByRole("link", { name: "運勢" }).click();
    await expect(page).toHaveURL("/fortune");
    await nav(page).getByRole("link", { name: "ホーム" }).click();
    await expect(page).toHaveURL("/");
  });

  test("配下のページでも該当項目がアクティブであること", async ({ page }) => {
    await page.goto("/tarot/quiz");
    await expect(nav(page).getByRole("link", { name: "タロット" })).toHaveAttribute("aria-current", "page");
    await page.goto("/guide/tarot/major-00");
    await expect(nav(page).getByRole("link", { name: "早見表" })).toHaveAttribute("aria-current", "page");
  });

  test("全ページでナビが表示されること", async ({ page }) => {
    for (const path of ["/", "/fortune", "/tarot", "/tarot/reading", "/tarot/quiz", "/guide"]) {
      await page.goto(path);
      await expect(nav(page)).toBeVisible();
    }
  });

  test("スマホでは下部ナビ、PCでは左サイドナビになること", async ({ page, isMobile }) => {
    await page.goto("/");
    const box = await nav(page).boundingBox();
    const viewport = page.viewportSize()!;
    if (isMobile) {
      expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 120);
    } else {
      expect(box!.x).toBeLessThan(240);
      await expect(page.getByText("毎日の占いノート")).toBeVisible();
    }
  });
});
```

- [ ] **Step 2: ホームのテストを書き換える**

`e2e/home.spec.ts` を次の内容に置き換える。

```ts
import { test, expect } from "@playwright/test";

test.describe("ホーム画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();
  });

  test("背景色が適用されていること", async ({ page }) => {
    const bgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bgColor).toBe("rgb(19, 12, 6)");
  });

  test("今日の運勢カードからカードを引けること", async ({ page }) => {
    const today = page.getByRole("region", { name: "今日の運勢" });
    await today.getByRole("button", { name: "カードを引く" }).click();
    await expect(today.getByText(/^(正位置|逆位置)$/)).toBeVisible();
  });

  test("「詳しく見る」で運勢ページへ遷移すること", async ({ page }) => {
    await page.getByRole("link", { name: "詳しく見る" }).click();
    await expect(page).toHaveURL("/fortune");
  });

  test("入口カードから各ページへ遷移できること", async ({ page }) => {
    const menu = page.getByRole("navigation", { name: "メニュー" });
    await menu.getByRole("link", { name: /相談したいことがある/ }).click();
    await expect(page).toHaveURL("/tarot/reading");
    await page.goBack();
    await menu.getByRole("link", { name: /タロットクイズ/ }).click();
    await expect(page).toHaveURL("/tarot/quiz");
    await page.goBack();
    await menu.getByRole("link", { name: /早見表/ }).click();
    await expect(page).toHaveURL("/guide");
  });

  test("画面に絵文字が表示されないこと", async ({ page }) => {
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u);
  });
});
```

- [ ] **Step 3: 運勢ページのテストを作り、1dayのテストを削除する**

Run: `git rm e2e/daily.spec.ts`

```ts
// e2e/fortune.spec.ts
import { test, expect } from "@playwright/test";

test.describe("運勢ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fortune");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();
  });

  test("今日の日付と1dayタロットが表示されること", async ({ page }) => {
    await expect(page.getByText("Today")).toBeVisible();
    await expect(page.getByRole("region", { name: "今日の1dayタロット" })).toBeVisible();
  });

  test("カードを引くと結果が表示され、再読み込み後も保持されること", async ({ page }) => {
    const section = page.getByRole("region", { name: "今日の1dayタロット" });
    await section.getByRole("button", { name: "カードを引く" }).click();
    const orientation = section.getByText(/^(正位置|逆位置)$/);
    await expect(orientation).toBeVisible();
    await page.reload();
    await expect(orientation).toBeVisible();
    await expect(section.getByRole("button", { name: "カードを引く" })).toHaveCount(0);
  });

  test("カードをタップすると詳細が開くこと(スマホはボトムシート、PCはサイドパネル)", async ({ page, isMobile }) => {
    const section = page.getByRole("region", { name: "今日の1dayタロット" });
    await section.getByRole("button", { name: "カードを引く" }).click();
    await section.getByRole("button", { name: /の詳細を見る/ }).click();
    if (isMobile) {
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog").getByRole("tab", { name: "正位置" })).toBeVisible();
    } else {
      // Desktop Chrome は 1280×720 なのでサイドパネルになる
      const panel = page.getByRole("complementary", { name: "詳細パネル" });
      await expect(panel).toBeVisible();
      await panel.getByRole("button", { name: "詳細を閉じる" }).click();
      await expect(panel).toHaveCount(0);
    }
  });

  test("運勢ナビがアクティブであること", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "運勢" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 4: タロットの入口と転送のテストを作る**

```ts
// e2e/tarot.spec.ts
import { test, expect } from "@playwright/test";

test.describe("タロットの入口", () => {
  test("占いとクイズを選べること", async ({ page }) => {
    await page.goto("/tarot");
    await expect(page.getByRole("heading", { level: 1, name: "タロット" })).toBeVisible();
    await page.getByRole("link", { name: /タロット占いをする/ }).click();
    await expect(page).toHaveURL("/tarot/reading");
    await expect(page.getByRole("heading", { level: 1, name: "タロット占い" })).toBeVisible();
    await page.goto("/tarot");
    await page.getByRole("link", { name: /クイズで練習する/ }).click();
    await expect(page).toHaveURL("/tarot/quiz");
    await expect(page.getByRole("heading", { level: 1, name: "キーワードクイズ" })).toBeVisible();
  });
});
```

```ts
// e2e/redirects.spec.ts
import { test, expect } from "@playwright/test";

const cases: [string, string][] = [
  ["/cards", "/guide"],
  ["/cards/major-00", "/guide/tarot/major-00"],
  ["/reading", "/tarot/reading"],
  ["/quiz", "/tarot/quiz"],
  ["/daily", "/fortune"],
];

test.describe("旧URLの転送", () => {
  for (const [from, to] of cases) {
    test(`${from} は ${to} へ転送されること`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    });
  }
});
```

- [ ] **Step 5: 早見表とカード詳細のテストを新URLに合わせる**

`e2e/cards-grid.spec.ts`:
- `test.describe` 名を `"早見表ページ — タロットのカード一覧"` にする。
- `beforeEach` の `page.goto("/cards")` を `page.goto("/guide")` にする。
- 「カードリンクが正しいhrefを持つこと」の期待値を `"/guide/tarot/major-00"` にする。
- 「BottomNavの早見表タブがアクティブであること」を次に置き換える。

```ts
  test("早見表ナビがアクティブであること", async ({ page }) => {
    const navLink = page
      .getByRole("navigation", { name: "メインナビゲーション" })
      .getByRole("link", { name: "早見表" });
    await expect(navLink).toHaveAttribute("aria-current", "page");
  });
```

`e2e/card-detail.spec.ts`:
- すべての `page.goto("/cards/...")` を `page.goto("/guide/tarot/...")` に、`page.goto("/cards")` を `page.goto("/guide")` にする。
- 「パンくずリストから早見表に戻れること」の期待値を `await expect(page).toHaveURL("/guide");` にする。
- 「早見表のカードリンクから詳細に遷移できること」の期待値を `await expect(page).toHaveURL("/guide/tarot/major-00");` にする。
- 「正位置タブが初期表示されキーワードが見えること」の `await expect(page.getByText("☀ 正位置")).toBeVisible();` を `await expect(page.getByRole("tab", { name: "正位置" })).toBeVisible();` にする。
- 「逆位置タブに切り替えられること」の `await page.getByText("☽ 逆位置").click();` を `await page.getByRole("tab", { name: "逆位置" }).click();` にする。
- 「存在しないIDでは404ページが表示されること」の goto を `/guide/tarot/nonexistent-99` にする。

`e2e/reading.spec.ts` の `page.goto("/reading")` を `page.goto("/tarot/reading")` に、`e2e/quiz.spec.ts` の `page.goto("/quiz")` を `page.goto("/tarot/quiz")` にする。両ファイルに `☀` `☽` `BottomNav` を使ったアサーションがあれば、上と同じ方針(`getByRole("tab")` や `getByText(/^(正位置|逆位置)$/)`、`メインナビゲーション` のリンク)に置き換える。

Run: `grep -nE '☀|☽|goto\("/(cards|reading|quiz|daily)|"1day"' e2e/*.ts`
Expected: `redirects.spec.ts` の転送元URL以外に出力がないこと

- [ ] **Step 6: E2E を実行する**

Run: `npx playwright test`
Expected: すべて PASS(`chromium` と `mobile-chrome` の両方)

失敗した場合は、スクリーンショットとトレース(`playwright-report/`)で原因を確認する。レイアウト起因の失敗(要素が下部ナビに隠れてクリックできない等)は、テストではなく実装側を直す。

- [ ] **Step 7: コミットする**

```bash
git add -A e2e
git commit -m "test: E2Eテストを新しい画面構成とURLに合わせて更新し、転送と詳細パネルのテストを追加"
```

---

### Task 15: 最終確認

- [ ] **Step 1: ユニットテスト**

Run: `npx vitest run`
Expected: すべて PASS

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: lint**

Run: `npx eslint src`
Expected: エラーは作業前から存在する3件(`react-hooks/set-state-in-effect`。`card-browser.tsx` など既存ファイル)のみで、新規のエラーがないこと。作業前の3件のうち、削除した `daily-tarot.tsx`・置き換えた `home-content.tsx` に含まれていたものは消えていてよい。

- [ ] **Step 4: 静的エクスポートのビルド**

Run: `npm run build`
Expected: 成功。`out/guide/tarot/major-00.html`、`out/cards/major-00.html`、`out/fortune.html`、`out/tarot/reading.html` が生成されていること。

Run: `ls out/guide/tarot | head -3 && ls out/fortune.html out/tarot.html out/tarot/reading.html out/tarot/quiz.html out/guide.html`

- [ ] **Step 5: 目視確認**

`npm run dev` で起動し、幅 390px・768px・1024px・1280px で `/`・`/fortune`・`/tarot`・`/guide`・`/guide/tarot/major-00` を確認する。確認ポイント:
- 1023px 以下で下部ナビ、1024px 以上で左サイドナビになる。
- 下部ナビにコンテンツが隠れない。
- 1280px 以上の `/fortune` で、カードをタップすると右に詳細パネルが開き、本文が縮む。
- 絵文字や記号文字が表示されていない。

- [ ] **Step 6: 問題があれば修正してコミットする**

```bash
git add -A
git commit -m "fix: フェーズ0の最終確認で見つかった表示の問題を修正"
```
(修正がなければこのステップは不要)
