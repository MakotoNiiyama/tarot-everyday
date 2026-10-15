import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtherFortuneContent } from "../other-fortune-content";

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
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
};

const SAVED = JSON.stringify({ version: 1, date: { year: 1985, month: 1, day: 1 }, time: { kind: "unknown" } });

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
  // 日本時間 2026-10-14 12:00 に固定する(userEvent のタイマーは動かしたままにする)
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T03:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

const combo = (name: string) => screen.getByRole("combobox", { name });

describe("OtherFortuneContent", () => {
  it("見出しとホームへ戻るリンク、保存しない旨を表示すること", () => {
    render(<OtherFortuneContent />);
    expect(screen.getByRole("heading", { level: 1, name: "好きな生年月日で占う" })).toBeInTheDocument();
    expect(screen.getByText("Any birthday")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホームに戻る" })).toHaveAttribute("href", "/");
    expect(screen.getByText("入力した内容は保存されません")).toBeInTheDocument();
  });

  it("初期値は今日の日付・時刻不明・東京都・回答しないであること", () => {
    render(<OtherFortuneContent />);
    expect(combo("年")).toHaveValue("2026");
    expect(combo("月")).toHaveValue("10");
    expect(combo("日")).toHaveValue("14");
    expect(screen.getByRole("radio", { name: "不明" })).toHaveAttribute("aria-checked", "true");
    expect(combo("出生地")).toHaveValue("13");
    expect(within(screen.getByRole("radiogroup", { name: "性別" })).getByRole("radio", { name: "回答しない" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("今日の生年月日で7占術の運勢・人物像・プロンプトを表示し、1dayタロットは出さないこと", () => {
    render(<OtherFortuneContent />);
    for (const name of ["数秘術", "九星気学", "マヤ暦", "四柱推命", "算命学", "宿曜", "西洋占星術"]) {
      expect(screen.getByRole("article", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: "今日" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("region", { name: "この生年月日の人物像" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "あなたについて" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "今日の1dayタロット" })).not.toBeInTheDocument();
    const preview = screen.getByLabelText("コピーされる内容");
    expect(preview).toHaveTextContent("■ 生年月日: 2026年10月14日 / 出生時刻: 不明 / 出生地: 東京都");
    expect(preview).not.toHaveTextContent("1dayタロット");
  });

  it("入力を変えるとすぐに結果が変わること", async () => {
    const user = userEvent.setup();
    render(<OtherFortuneContent />);
    // 今日の KIN との関係は生まれ年で変わる(数秘術のパーソナルデーは月日だけで決まるので使わない)
    const before = screen.getByRole("article", { name: "マヤ暦" }).textContent;
    await user.selectOptions(combo("年"), "1990");
    expect(screen.getByRole("article", { name: "マヤ暦" }).textContent).not.toBe(before);
    expect(screen.getByLabelText("コピーされる内容")).toHaveTextContent("■ 生年月日: 1990年10月14日");
  });

  it("出生時刻が未入力の間は結果の代わりに案内を出すこと", async () => {
    const user = userEvent.setup();
    render(<OtherFortuneContent />);
    await user.click(screen.getByRole("radio", { name: "時刻を指定" }));
    expect(screen.queryByRole("article", { name: "数秘術" })).not.toBeInTheDocument();
    expect(screen.getByText("出生時刻を入力すると、7つの占術の結果が表示されます。")).toBeInTheDocument();
    await user.type(screen.getByLabelText("出生時刻"), "09:05");
    expect(screen.getByRole("article", { name: "数秘術" })).toBeInTheDocument();
  });

  it("入力しても登録済みのプロフィールを書き換えないこと", async () => {
    store["tarot-birth-profile"] = SAVED;
    const user = userEvent.setup();
    render(<OtherFortuneContent />);
    await user.selectOptions(combo("年"), "1990");
    await user.selectOptions(combo("出生地"), "27");
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith("tarot-birth-profile", expect.anything());
    expect(localStorageMock.removeItem).not.toHaveBeenCalledWith("tarot-birth-profile");
    expect(store["tarot-birth-profile"]).toBe(SAVED);
  });
});
