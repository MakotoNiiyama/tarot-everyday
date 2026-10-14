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
 * localStorage が使えない(Safari のプライベートモード、セキュリティ制限など)か、
 * 書き込みに失敗したときの代わりにメモリに持つ結果。直近に引いた結果をこのセッションの間だけ保持し、
 * ページを読み込み直すと消える。
 */
let memoryDraw: DailyDrawResult | null = null;
/** memoryDraw を変えるたびに増やし、キャッシュのキーで変更を検知できるようにする */
let memoryDrawSeq = 0;

/**
 * 今日の抽選結果を返す。localStorage の中身か日付が変わるまでは同じ参照を返す。
 * localStorage が例外を投げても(Safari のプライベートモードなど)画面が壊れないよう try/catch で囲み、
 * その場合はメモリの結果を使う。
 */
function getSnapshot(): DailyDrawResult | null {
  try {
    const rawStorage = localStorage.getItem(DAILY_DRAW_STORAGE_KEY);
    const today = getTodayKey();
    // drawNow がメモリの結果を更新したときにキャッシュが外れるよう memoryDrawSeq もキーに含める
    const key = `${rawStorage}|${today}|${memoryDrawSeq}`;
    if (key !== cacheKey) {
      cacheKey = key;
      const fromStorage = loadTodayDraw();
      // localStorage に今日の結果がなければ、今日引いたメモリの結果を使う。
      // 前日の結果が残ったまま saveDraw が失敗した場合も、引いた結果を表示できるようにするため
      const fromMemory = memoryDraw?.date === today ? memoryDraw : null;
      cacheValue = fromStorage ?? fromMemory;
    }
    return cacheValue;
  } catch {
    // localStorage がまったく使えない。このセッションでメモリに持っている結果を返す
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
    // 保存に失敗しても(プライベートブラウズ、容量超過など)結果を表示できるよう、先にメモリに持つ
    memoryDraw = result;
    memoryDrawSeq++;
    try {
      saveDraw(result);
    } catch {
      // 保存できない。結果はこのセッションの間だけメモリに残る
    }
    listeners.forEach((l) => l());
  }, []);

  return { ready, draw: card ? draw : null, card, drawNow };
}

/**
 * モジュール内の状態をすべて初期化する。テストの beforeEach で呼び、
 * memoryDraw やスナップショットのキャッシュがテスト間で持ち越されないようにする。本番では使わない。
 */
export function _resetModuleStateForTest(): void {
  cacheKey = null;
  cacheValue = null;
  memoryDraw = null;
  memoryDrawSeq = 0;
}
