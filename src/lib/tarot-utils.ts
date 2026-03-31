import type { TarotCard, Suit } from "@/data/types";

/** 大アルカナ番号をローマ数字に変換 */
export function toRoman(n: number): string {
  const map: [number, string][] = [
    [21, "XXI"], [20, "XX"], [19, "XIX"], [18, "XVIII"], [17, "XVII"],
    [16, "XVI"], [15, "XV"], [14, "XIV"], [13, "XIII"], [12, "XII"],
    [11, "XI"], [10, "X"], [9, "IX"], [8, "VIII"], [7, "VII"],
    [6, "VI"], [5, "V"], [4, "IV"], [3, "III"], [2, "II"], [1, "I"], [0, "0"],
  ];
  return map.find(([v]) => v === n)?.[1] ?? String(n);
}

/** 運勢ジャンル定義 */
export const fortuneLabels: {
  key: keyof TarotCard["fortune"];
  label: string;
  emoji: string;
}[] = [
  { key: "general", label: "総合運", emoji: "⭐" },
  { key: "love", label: "恋愛運", emoji: "💕" },
  { key: "work", label: "仕事運", emoji: "💼" },
  { key: "money", label: "金運", emoji: "💰" },
  { key: "health", label: "健康運", emoji: "🌿" },
  { key: "advice", label: "アドバイス", emoji: "💡" },
];

/** スーツの日本語表示（用途に応じて3パターン） */
export const suitNames: Record<Suit, { short: string; medium: string; full: string }> = {
  wands:     { short: "杖",   medium: "ワンド",     full: "ワンド（杖）" },
  cups:      { short: "聖杯", medium: "カップ",     full: "カップ（聖杯）" },
  swords:    { short: "剣",   medium: "ソード",     full: "ソード（剣）" },
  pentacles: { short: "金貨", medium: "ペンタクル", full: "ペンタクル（金貨）" },
};

/** スーツに対応するテーマカラーclass */
export const suitColorClass: Record<Suit, string> = {
  wands: "text-terracotta",
  cups: "text-blue-400",
  swords: "text-gold-dim",
  pentacles: "text-green-500",
};

/** スーツの装飾シンボル */
export function suitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    wands: "🏑", cups: "🏆", swords: "⚔", pentacles: "⬠",
  };
  return symbols[suit] ?? "";
}
