import { describe, it, expect } from "vitest";
import { arcanaLabel } from "../tarot-utils";
import type { TarotCard } from "@/data/types";

const base = {
  id: "major-00",
  number: 0,
  name: { en: "The Fool", ja: "愚者" },
  keywords: { upright: [], reversed: [] },
  meaning: { upright: "", reversed: "" },
  fortune: {
    general: { upright: "", reversed: "" },
    love: { upright: "", reversed: "" },
    work: { upright: "", reversed: "" },
    money: { upright: "", reversed: "" },
    health: { upright: "", reversed: "" },
    advice: { upright: "", reversed: "" },
  },
  imagePath: "/cards/major/00-fool.jpg",
} satisfies Omit<TarotCard, "arcana">;

describe("arcanaLabel", () => {
  it("大アルカナのカードには「大アルカナ」を返すこと", () => {
    const card: TarotCard = { ...base, arcana: "major" };
    expect(arcanaLabel(card)).toBe("大アルカナ");
  });

  it("スーツを持つ小アルカナにはスーツ名を返すこと", () => {
    const card: TarotCard = { ...base, arcana: "minor", suit: "wands" };
    expect(arcanaLabel(card)).toBe("ワンド（杖）");
  });

  it("スーツがない小アルカナには「小アルカナ」を返すこと", () => {
    const card: TarotCard = { ...base, arcana: "minor" };
    expect(arcanaLabel(card)).toBe("小アルカナ");
  });
});
