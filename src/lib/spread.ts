import type { TarotCard } from "@/data/types";

/** スプレッドの種類 */
export type SpreadType = "three-card" | "choice" | "hexagram" | "celtic-cross";

/** スプレッド内の1枚の位置定義 */
export interface SpreadPosition {
  /** この位置の名前（例: "過去", "現在"） */
  label: string;
  /** 説明 */
  description: string;
}

/** スプレッド定義 */
export interface SpreadDefinition {
  id: SpreadType;
  name: string;
  description: string;
  /** 必要枚数 */
  cardCount: number;
  /** 各位置の定義（インデックス順） */
  positions: SpreadPosition[];
}

/** 展開されたカード1枚 */
export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  /** スプレッド内の位置インデックス */
  positionIndex: number;
}

/** スプレッド占い結果 */
export interface SpreadReading {
  spread: SpreadDefinition;
  question: string;
  cards: DrawnCard[];
  timestamp: number;
}

/* ──────────── スプレッド定義 ──────────── */

export const spreadDefinitions: Record<SpreadType, SpreadDefinition> = {
  "three-card": {
    id: "three-card",
    name: "スリーカード",
    description: "過去・現在・未来を3枚で読み解くシンプルなスプレッド",
    cardCount: 3,
    positions: [
      { label: "過去", description: "これまでの流れ・背景" },
      { label: "現在", description: "今の状況・直面していること" },
      { label: "未来", description: "今後の展開・可能性" },
    ],
  },
  choice: {
    id: "choice",
    name: "二者択一",
    description: "2つの選択肢を比較して最善の道を探るスプレッド",
    cardCount: 5,
    positions: [
      { label: "現状", description: "今のあなたの状況" },
      { label: "選択肢A", description: "Aを選んだ場合の展開" },
      { label: "選択肢Aの結果", description: "Aの最終的な結果" },
      { label: "選択肢B", description: "Bを選んだ場合の展開" },
      { label: "選択肢Bの結果", description: "Bの最終的な結果" },
    ],
  },
  hexagram: {
    id: "hexagram",
    name: "ヘキサグラム",
    description: "六芒星の配置で問題の全体像を多角的に分析するスプレッド",
    cardCount: 7,
    positions: [
      { label: "過去", description: "問題の原因・背景" },
      { label: "現在", description: "今の状況" },
      { label: "未来", description: "近い将来の展開" },
      { label: "対策", description: "取るべきアクション" },
      { label: "周囲の影響", description: "環境や他者からの影響" },
      { label: "潜在意識", description: "あなたの本音・深層心理" },
      { label: "最終結果", description: "最終的な結末・答え" },
    ],
  },
  "celtic-cross": {
    id: "celtic-cross",
    name: "ケルト十字",
    description: "10枚で人生の全体像を読む、タロットの代表的なスプレッド",
    cardCount: 10,
    positions: [
      { label: "現状", description: "あなたの現在の状況" },
      { label: "障害", description: "直面する課題・障害" },
      { label: "顕在意識", description: "意識的に考えていること" },
      { label: "潜在意識", description: "無意識・深層心理" },
      { label: "過去", description: "最近の過去" },
      { label: "近未来", description: "今後起こりうること" },
      { label: "自分自身", description: "あなたの姿勢・態度" },
      { label: "周囲の影響", description: "環境・他者の影響" },
      { label: "希望と恐れ", description: "期待と不安" },
      { label: "最終結果", description: "最終的な結末" },
    ],
  },
};

/** スプレッド一覧（選択画面用） */
export const spreadList: SpreadDefinition[] = [
  spreadDefinitions["three-card"],
  spreadDefinitions["choice"],
  spreadDefinitions["hexagram"],
  spreadDefinitions["celtic-cross"],
];
