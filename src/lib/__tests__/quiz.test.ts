import { describe, it, expect } from "vitest";
import { generateQuiz, QUIZ_COUNT } from "../../lib/quiz";
import { allCards } from "../../data/cards";

describe("generateQuiz", () => {
  it("デフォルトで10問生成されること", () => {
    const quiz = generateQuiz(allCards);
    expect(quiz).toHaveLength(QUIZ_COUNT);
  });

  it("指定された問題数で生成できること", () => {
    const quiz = generateQuiz(allCards, 5);
    expect(quiz).toHaveLength(5);
  });

  it("同じカードが重複しないこと", () => {
    const quiz = generateQuiz(allCards, 10);
    const ids = quiz.map((q) => q.card.id);
    expect(new Set(ids).size).toBe(10);
  });

  it("各問に4つの選択肢があること", () => {
    const quiz = generateQuiz(allCards);
    for (const q of quiz) {
      expect(q.choices).toHaveLength(4);
    }
  });

  it("正解キーワードが選択肢に含まれていること", () => {
    const quiz = generateQuiz(allCards);
    for (const q of quiz) {
      expect(q.choices).toContain(q.correctKeyword);
    }
  });

  it("正解キーワードがカード自身のキーワードであること", () => {
    const quiz = generateQuiz(allCards);
    for (const q of quiz) {
      const orientation = q.isReversed ? "reversed" : "upright";
      expect(q.card.keywords[orientation]).toContain(q.correctKeyword);
    }
  });

  it("不正解キーワードがカード自身のキーワードと被らないこと", () => {
    const quiz = generateQuiz(allCards);
    for (const q of quiz) {
      const cardKeywords = new Set([
        ...q.card.keywords.upright,
        ...q.card.keywords.reversed,
      ]);
      const wrongChoices = q.choices.filter((c) => c !== q.correctKeyword);
      for (const wrong of wrongChoices) {
        expect(cardKeywords.has(wrong)).toBe(false);
      }
    }
  });

  it("isReversedがboolean型であること", () => {
    const quiz = generateQuiz(allCards);
    for (const q of quiz) {
      expect(typeof q.isReversed).toBe("boolean");
    }
  });
});
