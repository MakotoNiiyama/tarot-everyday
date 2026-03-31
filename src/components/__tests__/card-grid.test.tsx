import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardGrid } from "../card-grid";
import type { TarotCard } from "@/data/types";

const makeCard = (id: string, name: string): TarotCard => ({
  id,
  number: 0,
  name: { en: name, ja: name },
  arcana: "major",
  keywords: {
    upright: ["テスト"],
    reversed: ["テスト"],
  },
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
});

describe("CardGrid", () => {
  it("ラベルが表示されること", () => {
    const cards = [makeCard("major-00", "愚者")];
    render(<CardGrid cards={cards} label="大アルカナ" />);
    expect(screen.getByText("大アルカナ")).toBeInTheDocument();
  });

  it("カードの数だけタイルが描画されること", () => {
    const cards = [
      makeCard("major-00", "愚者"),
      makeCard("major-01", "魔術師"),
      makeCard("major-02", "女教皇"),
    ];
    render(<CardGrid cards={cards} label="テスト" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("空配列の場合は何も描画されないこと", () => {
    const { container } = render(<CardGrid cards={[]} label="空" />);
    expect(container.querySelector("section")).not.toBeInTheDocument();
  });

  it("ラベルなしでも描画されること", () => {
    const cards = [makeCard("major-00", "愚者")];
    const { container } = render(<CardGrid cards={cards} />);
    expect(container.querySelector("section")).toBeInTheDocument();
    expect(container.querySelector("h2")).not.toBeInTheDocument();
  });

  it("aria-labelがセクションに適用されること", () => {
    const cards = [makeCard("major-00", "愚者")];
    render(<CardGrid cards={cards} label="大アルカナ" />);
    expect(screen.getByRole("region", { name: "大アルカナ" })).toBeInTheDocument();
  });
});
