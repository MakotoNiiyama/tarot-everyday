/** タロットカードのスーツ（小アルカナ） */
export type Suit = "wands" | "cups" | "swords" | "pentacles";

/** アルカナ種別 */
export type Arcana = "major" | "minor";

/** 正位置/逆位置のペア */
export interface UprightReversed {
  upright: string;
  reversed: string;
}

/** 正位置/逆位置のキーワード配列ペア */
export interface KeywordPair {
  upright: string[];
  reversed: string[];
}

/** 運勢ジャンル別の解説 */
export interface Fortune {
  general: UprightReversed;
  love: UprightReversed;
  work: UprightReversed;
  money: UprightReversed;
  health: UprightReversed;
  advice: UprightReversed;
}

/** タロットカード */
export interface TarotCard {
  /** 一意ID: "major-00", "wands-01" 等 */
  id: string;
  /** カード番号（大アルカナ 0-21, 小アルカナ 1-14） */
  number: number;
  /** カード名 */
  name: { en: string; ja: string };
  /** アルカナ種別 */
  arcana: Arcana;
  /** スーツ（小アルカナのみ） */
  suit?: Suit;
  /** キーワード（正位置/逆位置） */
  keywords: KeywordPair;
  /** 意味の解説（正位置/逆位置） */
  meaning: UprightReversed;
  /** 運勢ジャンル別解説 */
  fortune: Fortune;
  /** カード画像パス */
  imagePath: string;
}
