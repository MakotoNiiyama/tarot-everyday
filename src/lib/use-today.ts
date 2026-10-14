"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getTodayKey } from "@/lib/daily-draw";
import type { LocalDate } from "@/lib/fortune/local-date";

const subscribeNoop = () => () => {};

/**
 * 日本時間の今日(YYYY-MM-DD)。サーバー描画・ハイドレーション中は null。
 * 1dayタロットの抽選・運勢の計算と同じ「今日」を使う。
 */
export function useTodayKey(): string | null {
  // 文字列のスナップショットにして、描画ごとに値が変わらないようにする
  return useSyncExternalStore(subscribeNoop, getTodayKey, () => null);
}

function parseKey(key: string): LocalDate {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

/** 日本時間の今日を LocalDate で返す。日付が変わるまでは同じ参照を返す */
export function useTodayLocalDate(): LocalDate | null {
  const key = useTodayKey();
  return useMemo(() => (key ? parseKey(key) : null), [key]);
}

/** 日本時間の今日の0時(端末の時刻表示用の Date)。日付が変わるまでは同じ参照を返す */
export function useToday(): Date | null {
  const key = useTodayKey();
  return useMemo(() => {
    if (!key) return null;
    const { year, month, day } = parseKey(key);
    return new Date(year, month - 1, day);
  }, [key]);
}
