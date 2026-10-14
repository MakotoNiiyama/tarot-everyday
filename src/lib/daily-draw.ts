import type { TarotCard } from "@/data/types";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";

/** 1日の占い結果 */
export interface DailyDrawResult {
  cardId: string;
  isReversed: boolean;
  date: string; // YYYY-MM-DD
}

export const DAILY_DRAW_STORAGE_KEY = "tarot-daily-draw";

/**
 * 今日の日付文字列 (YYYY-MM-DD)。端末のタイムゾーンによらず日本時間の日付にし、
 * 運勢の計算(todayInTokyo)と同じ日に1dayタロットが切り替わるようにする
 */
export function getTodayKey(): string {
  const d = todayInTokyo();
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/** localStorageから今日の結果を取得。なければnull */
export function loadTodayDraw(): DailyDrawResult | null {
  const raw = localStorage.getItem(DAILY_DRAW_STORAGE_KEY);
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
  localStorage.setItem(DAILY_DRAW_STORAGE_KEY, JSON.stringify(result));
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
