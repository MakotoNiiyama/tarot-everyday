import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeContent } from "../home-content";
import { _resetModuleStateForTest } from "@/lib/use-daily-draw";

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
  _resetModuleStateForTest();
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
