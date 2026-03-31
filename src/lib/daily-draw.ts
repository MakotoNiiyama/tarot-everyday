import type { TarotCard } from "@/data/types";

/** 1日の占い結果 */
export interface DailyDrawResult {
  cardId: string;
  isReversed: boolean;
  date: string; // YYYY-MM-DD
}

const STORAGE_KEY = "tarot-daily-draw";

/** 今日の日付文字列 (YYYY-MM-DD) */
export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** localStorageから今日の結果を取得。なければnull */
export function loadTodayDraw(): DailyDrawResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const result: DailyDrawResult = JSON.parse(raw);
    if (result.date === getTodayKey()) return result;
    return null;
  } catch {
    return null;
  }
}

/** 今日の結果をlocalStorageに保存 */
export function saveDraw(result: DailyDrawResult): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

/** 78枚からランダムに1枚引く + 正逆ランダム判定 */
export function drawRandomCard(cards: TarotCard[]): DailyDrawResult {
  const index = Math.floor(Math.random() * cards.length);
  return {
    cardId: cards[index].id,
    isReversed: Math.random() < 0.5,
    date: getTodayKey(),
  };
}
