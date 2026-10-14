"use client";

import { useSyncExternalStore } from "react";
import { getTodayKey } from "@/lib/daily-draw";

const subscribeNoop = () => () => {};

/** 今日の0時の Date(サーバー描画・ハイドレーション中は null) */
export function useToday(): Date | null {
  // 文字列のスナップショットにして、描画ごとに値が変わらないようにする(YYYY-MM-DD)
  const key = useSyncExternalStore(subscribeNoop, getTodayKey, () => null);
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
