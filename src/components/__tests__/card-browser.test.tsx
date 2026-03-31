import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardBrowser } from "../card-browser";
import type { TarotCard } from "@/data/types";

const makeCard = (
  overrides: Partial<TarotCard> & Pick<TarotCard, "id" | "name">
): TarotCard => ({
  number: 0,
  arcana: "major",
  keywords: { upright: ["テスト"], reversed: ["逆テスト"] },
  meaning: { upright: "t", reversed: "t" },
  fortune: {
    general: { upright: "t", reversed: "t" },
    love: { upright: "t", reversed: "t" },
    work: { upright: "t", reversed: "t" },
    money: { upright: "t", reversed: "t" },
    health: { upright: "t", reversed: "t" },
    advice: { upright: "t", reversed: "t" },
  },
  imagePath: "/images/test.webp",
  ...overrides,
});

const testCards: TarotCard[] = [
  makeCard({ id: "major-00", name: { en: "The Fool", ja: "愚者" }, number: 0 }),
  makeCard({
    id: "major-01",
    name: { en: "The Magician", ja: "魔術師" },
    number: 1,
    keywords: { upright: ["創造", "意志"], reversed: ["詐欺"] },
  }),
  makeCard({
    id: "wands-01",
    name: { en: "Ace of Wands", ja: "ワンドのエース" },
    number: 1,
    arcana: "minor",
    suit: "wands",
    keywords: { upright: ["情熱"], reversed: ["停滞"] },
  }),
  makeCard({
    id: "cups-01",
    name: { en: "Ace of Cups", ja: "カップのエース" },
    number: 1,
    arcana: "minor",
    suit: "cups",
    keywords: { upright: ["愛情"], reversed: ["空虚"] },
  }),
];

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
});

describe("CardBrowser", () => {
  it("全カードが初期表示されること", () => {
    render(<CardBrowser cards={testCards} />);
    expect(screen.getByText("4枚のカード")).toBeInTheDocument();
  });

  it("検索フィールドが表示されること", () => {
    render(<CardBrowser cards={testCards} />);
    expect(screen.getByLabelText("カード検索")).toBeInTheDocument();
  });

  it("フィルタータブが表示されること", () => {
    render(<CardBrowser cards={testCards} />);
    expect(screen.getByRole("tab", { name: "全て" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "大アルカナ" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "ワンド" })).toBeInTheDocument();
  });

  it("大アルカナフィルターで絞り込めること", () => {
    render(<CardBrowser cards={testCards} />);
    fireEvent.click(screen.getByRole("tab", { name: "大アルカナ" }));
    expect(screen.getByText("2枚のカード")).toBeInTheDocument();
  });

  it("スーツフィルターで絞り込めること", () => {
    render(<CardBrowser cards={testCards} />);
    fireEvent.click(screen.getByRole("tab", { name: "ワンド" }));
    expect(screen.getByText("1枚のカード")).toBeInTheDocument();
  });

  it("名前で検索できること", async () => {
    const user = userEvent.setup();
    render(<CardBrowser cards={testCards} />);
    const input = screen.getByLabelText("カード検索");
    await user.type(input, "愚者");
    expect(screen.getByText(/1枚のカード/)).toBeInTheDocument();
    expect(screen.getByText(/「愚者」で検索/)).toBeInTheDocument();
  });

  it("キーワードで検索できること", async () => {
    const user = userEvent.setup();
    render(<CardBrowser cards={testCards} />);
    const input = screen.getByLabelText("カード検索");
    await user.type(input, "情熱");
    expect(screen.getByText(/1枚のカード/)).toBeInTheDocument();
  });

  it("英語名で検索できること", async () => {
    const user = userEvent.setup();
    render(<CardBrowser cards={testCards} />);
    const input = screen.getByLabelText("カード検索");
    await user.type(input, "fool");
    expect(screen.getByText(/1枚のカード/)).toBeInTheDocument();
  });

  it("検索結果0件の場合はメッセージが表示されること", async () => {
    const user = userEvent.setup();
    render(<CardBrowser cards={testCards} />);
    const input = screen.getByLabelText("カード検索");
    await user.type(input, "存在しない");
    expect(screen.getByText(/0枚のカード/)).toBeInTheDocument();
    expect(
      screen.getByText("該当するカードが見つかりません")
    ).toBeInTheDocument();
  });

  it("表示切替ボタンが存在すること", () => {
    render(<CardBrowser cards={testCards} />);
    expect(
      screen.getByLabelText("リスト表示に切り替え")
    ).toBeInTheDocument();
  });

  it("表示切替でリスト表示に変わること", () => {
    render(<CardBrowser cards={testCards} />);
    fireEvent.click(screen.getByLabelText("リスト表示に切り替え"));
    expect(
      screen.getByLabelText("グリッド表示に切り替え")
    ).toBeInTheDocument();
  });

  it("表示切替がlocalStorageに保存されること", () => {
    render(<CardBrowser cards={testCards} />);
    fireEvent.click(screen.getByLabelText("リスト表示に切り替え"));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "tarot-view-mode",
      "list"
    );
  });

  it("フィルターと検索を組み合わせて絞り込めること", async () => {
    const user = userEvent.setup();
    render(<CardBrowser cards={testCards} />);
    await user.click(screen.getByRole("tab", { name: "大アルカナ" }));
    const input = screen.getByLabelText("カード検索");
    await user.type(input, "魔術師");
    expect(screen.getByText(/1枚のカード/)).toBeInTheDocument();
  });
});
