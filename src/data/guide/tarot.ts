import { allCards } from "@/data/cards";
import { suitNames } from "@/lib/tarot-utils";
import type { GuideEntry } from "./types";

/** タロットのカードを早見表の項目に変換する(グループは大アルカナとスーツ) */
export const tarotEntries: GuideEntry[] = allCards.map((card) => ({
  system: "tarot" as const,
  id: card.id,
  group: card.suit ? suitNames[card.suit].medium : "大アルカナ",
  name: card.name.ja,
  reading: "",
  nameEn: card.name.en,
  keywords: card.keywords.upright,
  summary: card.meaning.upright,
  image: { kind: "photo" as const, path: card.imagePath, alt: card.name.ja },
}));
