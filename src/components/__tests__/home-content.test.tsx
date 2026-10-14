import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeContent } from "../home-content";
import { _resetModuleStateForTest } from "@/lib/use-daily-draw";
import { getTodayKey } from "@/lib/daily-draw";

vi.mock("next/dynamic", async () => {
  // テストでは動的読み込みをやめ、本体の部品をそのまま返す
  const m = await import("../home-fortune-chips");
  return { default: () => m.HomeFortuneChips };
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

beforeEach(() => {
  _resetModuleStateForTest();
  localStorageMock.clear();
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

/** 日本時間の今日(アプリと同じ基準) */
function todayKey(): string {
  return getTodayKey();
}

describe("HomeContent", () => {
  it("アプリ名を見出しとして表示すること", () => {
    render(<HomeContent />);
    expect(screen.getByRole("heading", { level: 1, name: "tarot-everyday" })).toBeInTheDocument();
  });

  it("「今日の運勢」カードに1dayタロットを表示すること", () => {
    render(<HomeContent />);
    const today = screen.getByRole("region", { name: "今日の運勢" });
    expect(today).toHaveTextContent("1dayタロット");
  });

  it("登録済みなら「詳しく見る」を表示すること", () => {
    store["tarot-birth-profile"] = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } });
    render(<HomeContent />);
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
    const menu = screen.getByRole("region", { name: "メニュー" });
    expect(menu.querySelector('a[href="/tarot/reading"]')).toHaveTextContent("相談したいことがある");
    expect(menu.querySelector('a[href="/tarot/quiz"]')).toHaveTextContent("タロットクイズ");
    expect(menu.querySelector('a[href="/guide"]')).toHaveTextContent("早見表");
  });

  it("絵文字を使わないこと", () => {
    const { container } = render(<HomeContent />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u);
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
    render(<HomeContent />);
    await user.click(screen.getByRole("button", { name: "愚者の詳細を見る" }));
    expect(screen.getByRole("complementary", { name: "詳細パネル" })).toHaveTextContent("The Fool");
  });
});

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
