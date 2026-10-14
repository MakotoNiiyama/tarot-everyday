import type { TarotCard, Suit } from "@/data/types";
import type { IconName } from "@/components/icons/icon";

/** 運勢ジャンル定義 */
export const fortuneLabels: {
  key: keyof TarotCard["fortune"];
  label: string;
  icon: IconName;
}[] = [
  { key: "general", label: "総合運", icon: "overall" },
  { key: "love", label: "恋愛運", icon: "love" },
  { key: "work", label: "仕事運", icon: "work" },
  { key: "money", label: "金運", icon: "money" },
  { key: "health", label: "健康運", icon: "health" },
  { key: "advice", label: "アドバイス", icon: "advice" },
];

/** スーツの日本語表示（用途に応じて3パターン） */
export const suitNames: Record<Suit, { short: string; medium: string; full: string }> = {
  wands:     { short: "杖",   medium: "ワンド",     full: "ワンド（杖）" },
  cups:      { short: "聖杯", medium: "カップ",     full: "カップ（聖杯）" },
  swords:    { short: "剣",   medium: "ソード",     full: "ソード（剣）" },
  pentacles: { short: "金貨", medium: "ペンタクル", full: "ペンタクル（金貨）" },
};

/** カードのアルカナ分類を日本語で返す(大アルカナ / スーツ名 / 小アルカナ) */
export function arcanaLabel(card: TarotCard): string {
  return card.arcana === "major"
    ? "大アルカナ"
    : (card.suit ? suitNames[card.suit].full : "小アルカナ");
}

