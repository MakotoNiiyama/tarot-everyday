"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** 今日の0時の Date(サーバー描画・ハイドレーション中は null) */
export function useToday(): Date | null {
  const key = useSyncExternalStore(subscribeNoop, () => new Date().toDateString(), () => null);
  return key ? new Date(key) : null;
}
