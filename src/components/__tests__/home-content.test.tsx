import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeContent } from "../home-content";

// localStorage mock
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
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
});

/** 今日の日付文字列 (テスト用) */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("HomeContent", () => {
  it("タイトル「Tarot Everyday」が表示されること", () => {
    render(<HomeContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Tarot Everyday" })
    ).toBeInTheDocument();
  });

  it("占い未済時にCTA「今日のカードを引いてみましょう」が表示されること", () => {
    render(<HomeContent />);
    expect(screen.getByLabelText("今日のカードを引く")).toBeInTheDocument();
    expect(screen.getByText("今日のカードを")).toBeInTheDocument();
    expect(screen.getByText("引いてみましょう")).toBeInTheDocument();
  });

  it("占い済み時にカード名と結果サマリーが表示されること", () => {
    // 愚者のデータを保存
    store["tarot-daily-draw"] = JSON.stringify({
      cardId: "major-00",
      isReversed: false,
      date: todayKey(),
    });

    render(<HomeContent />);
    expect(screen.getByText("愚者")).toBeInTheDocument();
    expect(screen.getByText("The Fool")).toBeInTheDocument();
    expect(screen.getByText(/☀ 正位置/)).toBeInTheDocument();
    expect(screen.getByText("⭐ 総合運")).toBeInTheDocument();
    expect(screen.getByTestId("today-result")).toBeInTheDocument();
  });

  it("占い済み（逆位置）時に逆位置表示されること", () => {
    store["tarot-daily-draw"] = JSON.stringify({
      cardId: "major-00",
      isReversed: true,
      date: todayKey(),
    });

    render(<HomeContent />);
    expect(screen.getByText(/☽ 逆位置/)).toBeInTheDocument();
  });

  it("クイックリンク「早見表」「1dayタロット」が表示されること", () => {
    render(<HomeContent />);
    expect(screen.getByText("📖 早見表")).toBeInTheDocument();
    expect(screen.getByText("🔮 1dayタロット")).toBeInTheDocument();
  });

  it("早見表リンクが /cards へ遷移すること", () => {
    render(<HomeContent />);
    const nav = screen.getByRole("navigation", { name: "メインメニュー" });
    const cardsLink = nav.querySelector('a[href="/cards"]');
    expect(cardsLink).toBeInTheDocument();
  });

  it("1dayタロットリンクが /daily へ遷移すること", () => {
    render(<HomeContent />);
    const nav = screen.getByRole("navigation", { name: "メインメニュー" });
    const dailyLink = nav.querySelector('a[href="/daily"]');
    expect(dailyLink).toBeInTheDocument();
  });

  it("占い未済時のCTAが /daily へのリンクであること", () => {
    render(<HomeContent />);
    const cta = screen.getByLabelText("今日のカードを引く");
    expect(cta.closest("a")).toHaveAttribute("href", "/daily");
  });

  it("占い済み時に1dayタロットページへのリンクが表示されること", () => {
    store["tarot-daily-draw"] = JSON.stringify({
      cardId: "major-00",
      isReversed: false,
      date: todayKey(),
    });

    render(<HomeContent />);
    expect(screen.getByText("1dayタロットを見る →")).toHaveAttribute(
      "href",
      "/daily"
    );
  });

  it("占い済み時にカード画像が表示されること", () => {
    store["tarot-daily-draw"] = JSON.stringify({
      cardId: "major-00",
      isReversed: false,
      date: todayKey(),
    });

    render(<HomeContent />);
    expect(screen.getByRole("img", { name: "愚者" })).toBeInTheDocument();
  });
});
