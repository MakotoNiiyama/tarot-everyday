import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardTile } from "../card-tile";
import type { TarotCard } from "@/data/types";

const mockMajorCard: TarotCard = {
  id: "major-00",
  number: 0,
  name: { en: "The Fool", ja: "愚者" },
  arcana: "major",
  keywords: {
    upright: ["自由", "冒険"],
    reversed: ["無謀", "軽率"],
  },
  meaning: {
    upright: "テスト正位置",
    reversed: "テスト逆位置",
  },
  fortune: {
    general: { upright: "t", reversed: "t" },
    love: { upright: "t", reversed: "t" },
    work: { upright: "t", reversed: "t" },
    money: { upright: "t", reversed: "t" },
    health: { upright: "t", reversed: "t" },
    advice: { upright: "t", reversed: "t" },
  },
  imagePath: "/images/major/00-fool.webp",
};

const mockMinorCard: TarotCard = {
  ...mockMajorCard,
  id: "wands-01",
  number: 1,
  name: { en: "Ace of Wands", ja: "ワンドのエース" },
  arcana: "minor",
  suit: "wands",
};

describe("CardTile", () => {
  it("カード名が表示されること", () => {
    render(<CardTile card={mockMajorCard} />);
    expect(screen.getByText("愚者")).toBeInTheDocument();
  });

  it("カード詳細へのリンクが正しいこと", () => {
    render(<CardTile card={mockMajorCard} />);
    const link = screen.getByRole("link", { name: "愚者の詳細を見る" });
    expect(link).toHaveAttribute("href", "/cards/major-00");
  });

  it("カード画像が表示されること", () => {
    render(<CardTile card={mockMajorCard} />);
    const img = screen.getByRole("img", { name: "愚者" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", expect.stringContaining("major"));
  });

  it("小アルカナのカード画像にalt属性が設定されていること", () => {
    render(<CardTile card={mockMinorCard} />);
    const img = screen.getByRole("img", { name: "ワンドのエース" });
    expect(img).toBeInTheDocument();
  });

  it("リンクにaria-labelが設定されていること", () => {
    render(<CardTile card={mockMajorCard} />);
    expect(
      screen.getByRole("link", { name: "愚者の詳細を見る" })
    ).toBeInTheDocument();
  });
});
