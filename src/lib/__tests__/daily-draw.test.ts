import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTodayKey,
  loadTodayDraw,
  saveDraw,
  drawRandomCard,
  type DailyDrawResult,
} from "../daily-draw";
import type { TarotCard } from "@/data/types";

const mockCard = (id: string): TarotCard => ({
  id,
  number: 0,
  name: { en: "Test", ja: "テスト" },
  arcana: "major",
  keywords: { upright: ["a"], reversed: ["b"] },
  meaning: { upright: "u", reversed: "r" },
  fortune: {
    general: { upright: "u", reversed: "r" },
    love: { upright: "u", reversed: "r" },
    work: { upright: "u", reversed: "r" },
    money: { upright: "u", reversed: "r" },
    health: { upright: "u", reversed: "r" },
    advice: { upright: "u", reversed: "r" },
  },
  imagePath: "",
});

// localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
};

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
});

describe("daily-draw", () => {
  describe("getTodayKey", () => {
    it("YYYY-MM-DD形式の文字列を返すこと", () => {
      const key = getTodayKey();
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("drawRandomCard", () => {
    it("カード配列からDailyDrawResultを返すこと", () => {
      const cards = [mockCard("a"), mockCard("b"), mockCard("c")];
      const result = drawRandomCard(cards);
      expect(result).toHaveProperty("cardId");
      expect(result).toHaveProperty("isReversed");
      expect(result).toHaveProperty("date");
      expect(cards.map((c) => c.id)).toContain(result.cardId);
      expect(typeof result.isReversed).toBe("boolean");
    });

    it("dateが今日の日付であること", () => {
      const cards = [mockCard("x")];
      const result = drawRandomCard(cards);
      expect(result.date).toBe(getTodayKey());
    });
  });

  describe("saveDraw / loadTodayDraw", () => {
    it("保存した結果を正しく読み込めること", () => {
      const draw: DailyDrawResult = {
        cardId: "major-00",
        isReversed: false,
        date: getTodayKey(),
      };
      saveDraw(draw);
      const loaded = loadTodayDraw();
      expect(loaded).toEqual(draw);
    });

    it("日付が異なる場合はnullを返すこと", () => {
      const draw: DailyDrawResult = {
        cardId: "major-00",
        isReversed: false,
        date: "1999-01-01",
      };
      saveDraw(draw);
      const loaded = loadTodayDraw();
      expect(loaded).toBeNull();
    });

    it("localStorageが空の場合はnullを返すこと", () => {
      expect(loadTodayDraw()).toBeNull();
    });

    it("不正なJSONの場合はnullを返すこと", () => {
      store["tarot-daily-draw"] = "not-json";
      expect(loadTodayDraw()).toBeNull();
    });
  });
});
