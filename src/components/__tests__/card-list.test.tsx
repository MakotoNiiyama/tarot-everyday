import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardList } from "../card-list";
import type { TarotCard } from "@/data/types";

const makeCard = (
  id: string,
  ja: string,
  overrides?: Partial<TarotCard>
): TarotCard => ({
  id,
  number: 0,
  name: { en: "Test", ja },
  arcana: "major",
  keywords: { upright: ["キーワード"], reversed: ["逆"] },
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

describe("CardList", () => {
  it("カード名が表示されること", () => {
    const cards = [makeCard("major-00", "愚者")];
    render(<CardList cards={cards} />);
    expect(screen.getByText("愚者")).toBeInTheDocument();
  });

  it("リンクが正しいhrefを持つこと", () => {
    const cards = [makeCard("major-00", "愚者")];
    render(<CardList cards={cards} />);
    const link = screen.getByRole("link", { name: "愚者の詳細を見る" });
    expect(link).toHaveAttribute("href", "/cards/major-00");
  });

  it("大アルカナの場合「大アルカナ」と表示されること", () => {
    const cards = [makeCard("major-00", "愚者")];
    render(<CardList cards={cards} />);
    expect(screen.getByText("大アルカナ")).toBeInTheDocument();
  });

  it("小アルカナの場合スーツ名が表示されること", () => {
    const cards = [
      makeCard("wands-01", "ワンドのエース", {
        arcana: "minor",
        suit: "wands",
      }),
    ];
    render(<CardList cards={cards} />);
    expect(screen.getByText("ワンド")).toBeInTheDocument();
  });

  it("空配列では何も描画されないこと", () => {
    const { container } = render(<CardList cards={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
