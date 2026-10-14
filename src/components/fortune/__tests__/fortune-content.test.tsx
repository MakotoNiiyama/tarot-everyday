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
