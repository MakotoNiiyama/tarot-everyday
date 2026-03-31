import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DailyTarot } from "../daily-tarot";

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

describe("DailyTarot", () => {
  it("タイトルが表示されること", () => {
    render(<DailyTarot />);
    expect(
      screen.getByRole("heading", { level: 1, name: "1dayタロット占い" })
    ).toBeInTheDocument();
  });

  it("初期状態でカードを引くボタンが表示されること", () => {
    render(<DailyTarot />);
    expect(screen.getByLabelText("カードを引く")).toBeInTheDocument();
  });

  it("カードを引くと結果が表示されること", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<DailyTarot />);
    await user.click(screen.getByLabelText("カードを引く"));

    // フリップ演出のsetTimeoutをact内で進める
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    // 正位置 or 逆位置のいずれかが表示される
    const orientation = screen.queryByText("☀ 正位置") || screen.queryByText("☽ 逆位置");
    expect(orientation).toBeInTheDocument();

    // 運勢セクションが表示される
    expect(screen.getByText(/総合運/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("localStorageに結果が保存されること", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<DailyTarot />);
    await user.click(screen.getByLabelText("カードを引く"));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "tarot-daily-draw",
      expect.any(String)
    );

    vi.useRealTimers();
  });

  it("既に占い済みの場合は即座に結果が表示されること", () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    store["tarot-daily-draw"] = JSON.stringify({
      cardId: "major-00",
      isReversed: false,
      date: dateStr,
    });

    render(<DailyTarot />);

    // 愚者のカードが即座に表示される
    expect(screen.getByText("愚者")).toBeInTheDocument();
    expect(screen.getByText("☀ 正位置")).toBeInTheDocument();
  });

  it("カード詳細へのリンクが表示されること", () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    store["tarot-daily-draw"] = JSON.stringify({
      cardId: "major-00",
      isReversed: false,
      date: dateStr,
    });

    render(<DailyTarot />);

    const btn = screen.getByRole("button", { name: /愚者の詳細を見る/ });
    expect(btn).toBeInTheDocument();
  });
});
