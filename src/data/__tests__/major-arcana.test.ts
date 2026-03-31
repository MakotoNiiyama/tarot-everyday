import { describe, it, expect } from "vitest";
import { allCards, getCardById, getCardsByArcana, getCardsBySuit, majorArcana } from "@/data/cards";
import type { TarotCard } from "@/data/types";

describe("大アルカナデータ", () => {
  it("大アルカナが22枚あること", () => {
    expect(majorArcana).toHaveLength(22);
  });

  it("allCardsに78枚が含まれること", () => {
    expect(allCards).toHaveLength(78);
  });

  it("番号が0〜21で連続していること", () => {
    const numbers = majorArcana.map((c) => c.number);
    for (let i = 0; i <= 21; i++) {
      expect(numbers).toContain(i);
    }
  });

  it("IDがすべてユニークであること", () => {
    const ids = majorArcana.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('IDがすべて "major-" で始まること', () => {
    for (const card of majorArcana) {
      expect(card.id).toMatch(/^major-\d{2}$/);
    }
  });

  it("すべてのカードのarcanaが major であること", () => {
    for (const card of majorArcana) {
      expect(card.arcana).toBe("major");
    }
  });

  it("すべてのカードにsuitが設定されていないこと（大アルカナ）", () => {
    for (const card of majorArcana) {
      expect(card.suit).toBeUndefined();
    }
  });
});

describe("各カードの必須フィールド", () => {
  it.each(majorArcana.map((c) => [c.name.ja, c] as [string, TarotCard]))(
    "%s — 必須フィールドが全て存在すること",
    (_name, card) => {
      // 基本情報
      expect(card.id).toBeTruthy();
      expect(card.name.en).toBeTruthy();
      expect(card.name.ja).toBeTruthy();
      expect(typeof card.number).toBe("number");
      expect(card.imagePath).toBeTruthy();

      // キーワード（それぞれ最低3つ）
      expect(card.keywords.upright.length).toBeGreaterThanOrEqual(3);
      expect(card.keywords.reversed.length).toBeGreaterThanOrEqual(3);

      // 意味（最低50文字）
      expect(card.meaning.upright.length).toBeGreaterThanOrEqual(50);
      expect(card.meaning.reversed.length).toBeGreaterThanOrEqual(50);

      // 運勢6ジャンル
      const fortuneKeys = ["general", "love", "work", "money", "health", "advice"] as const;
      for (const key of fortuneKeys) {
        expect(card.fortune[key].upright.length).toBeGreaterThanOrEqual(20);
        expect(card.fortune[key].reversed.length).toBeGreaterThanOrEqual(20);
      }
    }
  );
});

describe("正位置と逆位置の差別化", () => {
  it.each(majorArcana.map((c) => [c.name.ja, c] as [string, TarotCard]))(
    "%s — 正位置と逆位置のキーワードが異なること",
    (_name, card) => {
      const uprightSet = new Set(card.keywords.upright);
      const reversedSet = new Set(card.keywords.reversed);
      // 少なくとも半分以上は異なるキーワードであること
      const overlap = card.keywords.upright.filter((k) => reversedSet.has(k));
      expect(overlap.length).toBeLessThan(card.keywords.upright.length / 2);
    }
  );

  it.each(majorArcana.map((c) => [c.name.ja, c] as [string, TarotCard]))(
    "%s — 正位置と逆位置の意味が異なること",
    (_name, card) => {
      expect(card.meaning.upright).not.toBe(card.meaning.reversed);
    }
  );
});

describe("getCardById", () => {
  it("存在するIDでカードを取得できること", () => {
    const card = getCardById("major-00");
    expect(card).toBeDefined();
    expect(card!.name.ja).toBe("愚者");
  });

  it("存在しないIDでundefinedが返ること", () => {
    expect(getCardById("nonexistent")).toBeUndefined();
  });
});

describe("getCardsByArcana", () => {
  it("majorで22枚取得できること", () => {
    expect(getCardsByArcana("major")).toHaveLength(22);
  });

  it("minorで56枚が取得できること", () => {
    expect(getCardsByArcana("minor")).toHaveLength(56);
  });

  it("各スーツが14枚ずつであること", () => {
    expect(getCardsBySuit("wands")).toHaveLength(14);
    expect(getCardsBySuit("cups")).toHaveLength(14);
    expect(getCardsBySuit("swords")).toHaveLength(14);
    expect(getCardsBySuit("pentacles")).toHaveLength(14);
  });

  it("全78枚のIDがユニークであること", () => {
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(78);
  });
});
