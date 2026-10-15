// src/lib/fortune/system-names.ts
import type { SystemId } from "./types";

/** 実装済みの占術の名前(registry の順)。計算エンジンを読み込まずに占術名だけ使いたい画面向け */
export const FORTUNE_SYSTEM_NAMES: readonly { id: SystemId; name: string }[] = [
  { id: "numerology", name: "数秘術" },
  { id: "kyusei", name: "九星気学" },
  { id: "maya", name: "マヤ暦" },
  { id: "shichu", name: "四柱推命" },
  { id: "sanmei", name: "算命学" },
];
