import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DailyTarotCard } from "../daily-tarot-card";
import { _resetModuleStateForTest } from "@/lib/use-daily-draw";

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
  // Reset module-level snapshot cache and in-memory draw so tests don't leak state.
  _resetModuleStateForTest();
  localStorageMock.clear();
  // Restore any mock overrides from throwing tests back to the default implementations.
  localStorageMock.getItem.mockImplementation((key: string) => store[key] ?? null);
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    store[key] = value;
  });
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
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

  it("localStorage.getItem が例外を投げてもクラッシュせず未抽選状態を表示すること", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new DOMException("Access denied", "SecurityError");
    });
    render(<DailyTarotCard variant="fortune" />);
    expect(screen.getByText("今日のカードはまだ引いていません。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "カードを引く" })).toBeInTheDocument();
  });

  it("localStorage.setItem が例外を投げても「カードを引く」を押すと結果を表示すること", async () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });
    const user = userEvent.setup();
    render(<DailyTarotCard variant="fortune" />);
    await user.click(screen.getByRole("button", { name: "カードを引く" }));
    expect(screen.getByText(/^(正位置|逆位置)$/)).toBeInTheDocument();
  });
});
