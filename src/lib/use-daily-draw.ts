"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { TarotCard } from "@/data/types";
import { allCards, getCardById } from "@/data/cards";
import {
  type DailyDrawResult,
  drawRandomCard,
  getTodayKey,
  loadTodayDraw,
  saveDraw,
} from "@/lib/daily-draw";

const STORAGE_KEY = "tarot-daily-draw";
const listeners = new Set<() => void>();

let cacheKey: string | null = null;
let cacheValue: DailyDrawResult | null = null;

/** localStorage の値と日付が変わらない限り同じ参照を返す(useSyncExternalStore の要件) */
function getSnapshot(): DailyDrawResult | null {
  const key = `${localStorage.getItem(STORAGE_KEY)}|${getTodayKey()}`;
  if (key !== cacheKey) {
    cacheKey = key;
    cacheValue = loadTodayDraw();
  }
  return cacheValue;
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
    saveDraw(drawRandomCard(allCards));
    listeners.forEach((l) => l());
  }, []);

  return { ready, draw: card ? draw : null, card, drawNow };
}
