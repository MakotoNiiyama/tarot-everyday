// src/lib/fortune/element-ids.ts
/**
 * 早見表の項目 id(1C の辞書データの id と一致させる)。
 * 計算結果の ElementRef.id はすべてここの関数で作り、ELEMENT_IDS に含まれる値だけを使う。
 */

/** 九星気学の方位(8方位) */
export type Direction = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
/** 九星気学の宮(8方位 + 中宮) */
export type Palace = Direction | "center";

export const DIRECTIONS: readonly Direction[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
const PALACES: readonly Palace[] = ["center", ...DIRECTIONS];

/** 数秘術の数(1〜9・11・22・33) */
export const numberId = (n: number) => `number-${n}`;

/** 九星(1 = 一白水星 … 9 = 九紫火星) */
export const starId = (n: number) => `star-${n}`;
export const palaceId = (p: Palace) => `palace-${p}`;
export const directionId = (d: Direction) => `direction-${d}`;

/** マヤ暦の紋章(1〜20)・銀河の音(1〜13)・13の月(1〜13。0 は時間をはずした日) */
export const sealId = (n: number) => `seal-${n}`;
export const toneId = (n: number) => `tone-${n}`;
export const moonId = (n: number) => `moon-${n}`;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** 占術ごとの早見表の項目 id の一覧 */
export const ELEMENT_IDS: Record<"numerology" | "kyusei" | "maya", readonly string[]> = {
  numerology: [...range(1, 9), 11, 22, 33].map(numberId),
  kyusei: [...range(1, 9).map(starId), ...PALACES.map(palaceId), ...DIRECTIONS.map(directionId)],
  maya: [...range(1, 20).map(sealId), ...range(1, 13).map(toneId), ...range(0, 13).map(moonId)],
};
