import type { TarotCard, Suit } from "./types";
import { majorArcana } from "./major";
import { wands } from "./minor/wands";
import { cups } from "./minor/cups";
import { swords } from "./minor/swords";
import { pentacles } from "./minor/pentacles";

/** 全タロットカード（78枚） */
export const allCards: TarotCard[] = [
  ...majorArcana,
  ...wands,
  ...cups,
  ...swords,
  ...pentacles,
];

/** IDでカードを取得 */
export function getCardById(id: string): TarotCard | undefined {
  return allCards.find((card) => card.id === id);
}

/** アルカナ種別でカードを取得 */
export function getCardsByArcana(arcana: "major" | "minor"): TarotCard[] {
  return allCards.filter((card) => card.arcana === arcana);
}

/** スーツでカードを取得 */
export function getCardsBySuit(suit: Suit): TarotCard[] {
  return allCards.filter((card) => card.suit === suit);
}

export { majorArcana, wands, cups, swords, pentacles };
export type { TarotCard, Suit } from "./types";
