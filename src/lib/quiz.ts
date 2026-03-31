import type { TarotCard } from "@/data/types";

export const QUIZ_COUNT = 10;

export interface QuizQuestion {
  card: TarotCard;
  isReversed: boolean;
  /** 正解のキーワード */
  correctKeyword: string;
  /** 4択の選択肢（正解含む、シャッフル済み） */
  choices: string[];
}

export interface QuizAnswer {
  question: QuizQuestion;
  selectedKeyword: string;
  isCorrect: boolean;
}

/** Fisher-Yates シャッフル（非破壊） */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 全カードからランダムに count 問の QuizQuestion を生成する */
export function generateQuiz(
  allCards: readonly TarotCard[],
  count: number = QUIZ_COUNT
): QuizQuestion[] {
  const selected = shuffle(allCards).slice(0, count);

  return selected.map((card) => {
    const isReversed = Math.random() < 0.5;
    const orientation = isReversed ? "reversed" : "upright";
    const correctKeywords = card.keywords[orientation];
    const correctKeyword =
      correctKeywords[Math.floor(Math.random() * correctKeywords.length)];

    // 不正解キーワード候補: 出題カードのキーワードと被らないもの
    const allCardKeywords = new Set([
      ...card.keywords.upright,
      ...card.keywords.reversed,
    ]);

    const wrongPool: string[] = [];
    for (const other of allCards) {
      if (other.id === card.id) continue;
      for (const kw of other.keywords[orientation]) {
        if (!allCardKeywords.has(kw)) {
          wrongPool.push(kw);
        }
      }
    }

    const wrongKeywords = shuffle(wrongPool).slice(0, 3);
    const choices = shuffle([correctKeyword, ...wrongKeywords]);

    return { card, isReversed, correctKeyword, choices };
  });
}
