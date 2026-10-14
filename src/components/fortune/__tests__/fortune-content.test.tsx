import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FortuneContent } from "../fortune-content";

vi.mock("next/dynamic", async () => {
  // テストでは動的読み込みをやめ、本体の部品をそのまま返す
  const m = await import("../fortune-readings");
  return { default: () => m.FortuneReadings };
});

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
