"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TarotCard } from "@/data/types";
import { allCards, getCardById } from "@/data/cards";
import {
  type DailyDrawResult,
  DAILY_DRAW_STORAGE_KEY,
  drawRandomCard,
  getTodayKey,
  loadTodayDraw,
  saveDraw,
} from "@/lib/daily-draw";

const listeners = new Set<() => void>();

let cacheKey: string | null = null;
let cacheValue: DailyDrawResult | null = null;

/**
 * In-memory fallback for when localStorage is unavailable (Safari private mode,
 * security restrictions, etc.) or when a write fails. Holds the most recent
 * draw result for this session only — not persisted across page loads.
 */
let memoryDraw: DailyDrawResult | null = null;
/** Incremented each time memoryDraw changes so the cache key detects the update. */
let memoryDrawSeq = 0;

/**
 * Returns today's draw result, stable by reference until localStorage or the date changes.
 * Wrapped in try/catch so a throwing localStorage (e.g. Safari private mode) never
 * crashes the component tree — it falls back to the in-memory draw instead.
 */
function getSnapshot(): DailyDrawResult | null {
  try {
    const rawStorage = localStorage.getItem(DAILY_DRAW_STORAGE_KEY);
    const today = getTodayKey();
    // Include memoryDrawSeq so the cache busts when drawNow sets a memory fallback.
    const key = `${rawStorage}|${today}|${memoryDrawSeq}`;
    if (key !== cacheKey) {
      cacheKey = key;
      const fromStorage = loadTodayDraw();
      // Use the in-memory result only when storage is completely empty (rawStorage === null),
      // which happens when saveDraw threw and nothing was persisted. If storage has any
      // value (even an outdated one) we trust storage so that cleared storage reads as null.
      const fromMemory =
        rawStorage === null && memoryDraw?.date === today ? memoryDraw : null;
      cacheValue = fromStorage ?? fromMemory;
    }
    return cacheValue;
  } catch {
    // Storage completely unavailable — return whatever we drew in memory this session.
    const today = getTodayKey();
    return memoryDraw?.date === today ? memoryDraw : null;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

const subscribeNoop = () => () => {};

export interface DailyDrawState {
  /** クライアントで localStorage を読み終えたか(サーバー描画・ハイドレーション中は false) */
  ready: boolean;
  draw: DailyDrawResult | null;
  card: TarotCard | null;
  drawNow: () => void;
}

/** 今日の1dayタロット。ホームと運勢ページで同じ結果を共有する */
export function useDailyDraw(): DailyDrawState {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const draw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const card = draw ? getCardById(draw.cardId) ?? null : null;

  const drawNow = useCallback(() => {
    const result = drawRandomCard(allCards);
    // Set the in-memory fallback first so the result is always visible even if
    // the storage write fails (e.g. private browsing, quota exceeded).
    memoryDraw = result;
    memoryDrawSeq++;
    try {
      saveDraw(result);
    } catch {
      // Storage unavailable; result is held in memory for this session only.
    }
    listeners.forEach((l) => l());
  }, []);

  return { ready, draw: card ? draw : null, card, drawNow };
}

/**
 * Resets all module-level state. Call from `beforeEach` in tests to prevent
 * memoryDraw and the snapshot cache from leaking across test cases.
 * Not intended for production use.
 */
export function _resetModuleStateForTest(): void {
  cacheKey = null;
  cacheValue = null;
  memoryDraw = null;
  memoryDrawSeq = 0;
}
