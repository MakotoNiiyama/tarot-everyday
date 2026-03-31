import { describe, it, expect } from "vitest";
import {
  shuffleDeck,
  cutDeck,
  drawCards,
  generatePrompt,
} from "@/lib/spread-reading";
import { spreadDefinitions } from "@/lib/spread";
import type { TarotCard } from "@/data/types";
import type { SpreadReading, DrawnCard } from "@/lib/spread";

/** テスト用のミニマルカードデータ */
function makeCard(id: string, name: string): TarotCard {
  return {
    id,
    number: 0,
    name: { en: name, ja: name },
    arcana: "major",
    keywords: { upright: ["希望", "冒険"], reversed: ["無謀", "停滞"] },
    meaning: { upright: "意味U", reversed: "意味R" },
    fortune: {
      general: { upright: "総合U", reversed: "総合R" },
      love: { upright: "恋愛U", reversed: "恋愛R" },
      work: { upright: "仕事U", reversed: "仕事R" },
      money: { upright: "金運U", reversed: "金運R" },
      health: { upright: "健康U", reversed: "健康R" },
      advice: { upright: "助言U", reversed: "助言R" },
    },
    imagePath: "/cards/test.jpg",
  };
}

const testDeck = Array.from({ length: 10 }, (_, i) =>
  makeCard(`card-${i}`, `Card ${i}`),
);

describe("shuffleDeck", () => {
  it("元の配列を変更せず同じ長さの新配列を返すこと", () => {
    const original = [...testDeck];
    const shuffled = shuffleDeck(testDeck);
    expect(shuffled).toHaveLength(testDeck.length);
    expect(testDeck).toEqual(original);
  });

  it("全てのカードが含まれること", () => {
    const shuffled = shuffleDeck(testDeck);
    const ids = shuffled.map((c) => c.id).sort();
    const originalIds = testDeck.map((c) => c.id).sort();
    expect(ids).toEqual(originalIds);
  });
});

describe("cutDeck", () => {
  it("選んだ山が先頭になること", () => {
    const deck = Array.from({ length: 9 }, (_, i) =>
      makeCard(`c-${i}`, `C${i}`),
    );
    // 山0=[c-0,c-1,c-2], 山1=[c-3,c-4,c-5], 山2=[c-6,c-7,c-8]

    const cut1 = cutDeck(deck, 1);
    expect(cut1[0].id).toBe("c-3");

    const cut2 = cutDeck(deck, 2);
    expect(cut2[0].id).toBe("c-6");
  });

  it("全カードが保持されること", () => {
    const result = cutDeck(testDeck, 0);
    expect(result).toHaveLength(testDeck.length);
  });
});

describe("drawCards", () => {
  it("指定枚数を引くこと", () => {
    const drawn = drawCards(testDeck, 3);
    expect(drawn).toHaveLength(3);
  });

  it("各カードにpositionIndexが付与されること", () => {
    const drawn = drawCards(testDeck, 5);
    drawn.forEach((dc, i) => {
      expect(dc.positionIndex).toBe(i);
    });
  });

  it("isReversedがboolean値であること", () => {
    const drawn = drawCards(testDeck, 3);
    drawn.forEach((dc) => {
      expect(typeof dc.isReversed).toBe("boolean");
    });
  });
});

describe("generatePrompt", () => {
  it("スプレッド名・質問・カード情報を含むプロンプトを生成すること", () => {
    const spread = spreadDefinitions["three-card"];
    const cards: DrawnCard[] = spread.positions.map((_, i) => ({
      card: testDeck[i],
      isReversed: i === 1,
      positionIndex: i,
    }));
    const reading: SpreadReading = {
      spread,
      question: "転職すべきか",
      cards,
      timestamp: Date.now(),
    };

    const prompt = generatePrompt(reading);

    expect(prompt).toContain("スリーカード");
    expect(prompt).toContain("転職すべきか");
    expect(prompt).toContain("過去");
    expect(prompt).toContain("現在");
    expect(prompt).toContain("未来");
    expect(prompt).toContain("Card 0");
    expect(prompt).toContain("逆位置");
    expect(prompt).toContain("正位置");
    expect(prompt).toContain("停滞"); // 逆位置キーワード
  });
});
