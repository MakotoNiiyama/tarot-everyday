import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardDetail } from "../card-detail";
import type { TarotCard } from "@/data/types";

const mockCard: TarotCard = {
  id: "major-00",
  number: 0,
  name: { en: "The Fool", ja: "愚者" },
  arcana: "major",
  keywords: {
    upright: ["自由", "冒険", "無邪気"],
    reversed: ["無謀", "軽率", "無計画"],
  },
  meaning: {
    upright: "正位置の意味テスト",
    reversed: "逆位置の意味テスト",
  },
  fortune: {
    general: { upright: "総合正", reversed: "総合逆" },
    love: { upright: "恋愛正", reversed: "恋愛逆" },
    work: { upright: "仕事正", reversed: "仕事逆" },
    money: { upright: "金運正", reversed: "金運逆" },
    health: { upright: "健康正", reversed: "健康逆" },
    advice: { upright: "助言正", reversed: "助言逆" },
  },
  imagePath: "/images/major/00-fool.webp",
};

const mockMinorCard: TarotCard = {
  ...mockCard,
  id: "wands-01",
  name: { en: "Ace of Wands", ja: "ワンドのエース" },
  arcana: "minor",
  suit: "wands",
};

describe("CardDetail", () => {
  it("カード名（日英）が表示されること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("愚者");
    expect(screen.getByText("The Fool")).toBeInTheDocument();
  });

  it("大アルカナの場合「大アルカナ」と表示されること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByText("大アルカナ")).toBeInTheDocument();
  });

  it("小アルカナの場合スーツ名が表示されること", () => {
    render(<CardDetail card={mockMinorCard} />);
    expect(screen.getByText("ワンド（杖）")).toBeInTheDocument();
  });

  it("パンくずリストが表示されること", () => {
    render(<CardDetail card={mockCard} />);
    const nav = screen.getByLabelText("パンくずリスト");
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "早見表" })).toHaveAttribute(
      "href",
      "/cards"
    );
  });

  it("正位置タブが初期表示されること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByText("☀ 正位置")).toBeInTheDocument();
    expect(screen.getByText("☽ 逆位置")).toBeInTheDocument();
  });

  it("正位置のキーワードが表示されること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByText("自由")).toBeInTheDocument();
    expect(screen.getByText("冒険")).toBeInTheDocument();
  });

  it("正位置の意味が表示されること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByText("正位置の意味テスト")).toBeInTheDocument();
  });

  it("逆位置タブに切り替えると逆位置の内容が表示されること", async () => {
    const user = userEvent.setup();
    render(<CardDetail card={mockCard} />);
    await user.click(screen.getByText("☽ 逆位置"));
    expect(screen.getByText("無謀")).toBeInTheDocument();
    expect(screen.getByText("逆位置の意味テスト")).toBeInTheDocument();
  });

  it("運勢セクションに6つのジャンルが存在すること", () => {
    render(<CardDetail card={mockCard} />);
    expect(screen.getByText(/総合運/)).toBeInTheDocument();
    expect(screen.getByText(/恋愛運/)).toBeInTheDocument();
    expect(screen.getByText(/仕事運/)).toBeInTheDocument();
    expect(screen.getByText(/金運/)).toBeInTheDocument();
    expect(screen.getByText(/健康運/)).toBeInTheDocument();
    expect(screen.getByText(/アドバイス/)).toBeInTheDocument();
  });
});
