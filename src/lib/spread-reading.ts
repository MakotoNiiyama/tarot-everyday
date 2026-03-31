import type { TarotCard } from "@/data/types";
import type { SpreadDefinition, DrawnCard, SpreadReading } from "./spread";

/**
 * デッキをシャッフル（Fisher-Yates）
 * 元の配列を変更せず新しい配列を返す
 */
export function shuffleDeck(cards: readonly TarotCard[]): TarotCard[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * 3山カット — デッキを3分割し、chosen の山を先頭にして再構築
 * @param deck シャッフル済みデッキ
 * @param chosen 選ばれた山（0, 1, 2）
 * @returns 再構築されたデッキ
 */
export function cutDeck(
  deck: readonly TarotCard[],
  chosen: 0 | 1 | 2,
): TarotCard[] {
  const third = Math.floor(deck.length / 3);
  const piles = [
    deck.slice(0, third),
    deck.slice(third, third * 2),
    deck.slice(third * 2),
  ];
  return [
    ...piles[chosen],
    ...piles[(chosen + 1) % 3],
    ...piles[(chosen + 2) % 3],
  ];
}

/**
 * デッキの上からN枚を引き、正逆をランダムで決定
 */
export function drawCards(
  deck: readonly TarotCard[],
  count: number,
): DrawnCard[] {
  return deck.slice(0, count).map((card, i) => ({
    card,
    isReversed: Math.random() < 0.5,
    positionIndex: i,
  }));
}

/**
 * AIプロンプト生成
 */
export function generatePrompt(reading: SpreadReading): string {
  const { spread, question, cards } = reading;

  const cardLines = cards.map((dc) => {
    const pos = spread.positions[dc.positionIndex];
    const orientation = dc.isReversed ? "逆位置" : "正位置";
    const keywords = dc.isReversed
      ? dc.card.keywords.reversed.join("、")
      : dc.card.keywords.upright.join("、");
    return `【${pos.label}】${dc.card.name.ja}（${dc.card.name.en}）— ${orientation}\n  キーワード: ${keywords}\n  位置の意味: ${pos.description}`;
  });

  return `あなたはプロのタロット占い師です。以下のタロット展開結果を分析し、相談者にわかりやすく解説してください。

■ スプレッド: ${spread.name}（${spread.cardCount}枚展開）
■ 相談内容: ${question}

── 展開結果 ──
${cardLines.join("\n\n")}

── 依頼 ──
1. 各カードが示す意味を相談内容に沿って具体的に説明してください
2. カード同士の関連性やストーリーを読み解いてください
3. 相談者への具体的なアドバイスをまとめてください
4. 全体の流れを踏まえた総合的なメッセージを述べてください`;
}
