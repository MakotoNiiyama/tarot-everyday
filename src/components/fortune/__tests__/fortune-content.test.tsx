import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FortuneContent, ReadingsLoading } from "../fortune-content";
import { getTodayKey } from "@/lib/daily-draw";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";

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

/** 日本時間の今日(アプリと同じ基準) */
function todayKey(): string {
  return getTodayKey();
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

describe("FortuneContent(運勢の見出しとタブパネル)", () => {
  it("選んだ期間に合わせた見出しと、選択中のタブに結び付いたタブパネルを表示すること", async () => {
    store["tarot-birth-profile"] = PROFILE;
    const user = userEvent.setup();
    render(<FortuneContent />);
    expect(screen.getByRole("heading", { level: 2, name: "今日の運勢" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "今日" })).toContainElement(screen.getByRole("article", { name: "数秘術" }));
    await user.click(screen.getByRole("tab", { name: "今月" }));
    expect(screen.getByRole("heading", { level: 2, name: "今月の運勢" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "今月" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "今月" })).toHaveAttribute("aria-controls", screen.getByRole("tabpanel").id);
  });
});

describe("ReadingsLoading", () => {
  it("計算中であることを読み上げ用のテキストで伝えること", () => {
    render(<ReadingsLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("運勢を計算しています");
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
    const d = todayInTokyo();
    expect(screen.getByText(`${d.year}年${d.month}月${d.day}日`)).toBeInTheDocument();
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
