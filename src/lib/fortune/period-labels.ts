// src/lib/fortune/period-labels.ts
import type { Period } from "./types";

/** 運勢の見出しで期間を指す言葉 */
export const PERIOD_WORD: Record<Period, string> = { day: "今日", month: "今月", year: "今年" };

/** 期間の干支のチップの見出し */
export const GANSHI_LABEL: Record<Period, string> = { day: "日の干支", month: "月の干支", year: "年の干支" };
