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
/** マヤ暦の黒KIN(銀河の活性化の門) */
export const BLACK_KIN_ID = "black-kin";

/** 四柱推命の十干(1 = 甲 … 10 = 癸)・十二支(1 = 子 … 12 = 亥)・通変星(1 = 比肩 … 10 = 印綬)・十二運(1 = 長生 … 12 = 養) */
export const stemId = (n: number) => `stem-${n}`;
export const branchId = (n: number) => `branch-${n}`;
export const tsuhenId = (n: number) => `tsuhen-${n}`;
export const unseiId = (n: number) => `unsei-${n}`;

/** 五行(sexagenary.ts の ELEMENT_NAMES と同じ順) */
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export const FIVE_ELEMENTS: readonly FiveElement[] = ["wood", "fire", "earth", "metal", "water"];
export const elementId = (e: FiveElement) => `element-${e}`;

/** 算命学の十大主星(1 = 貫索星 … 10 = 玉堂星。通変星と同じ順)・十二大従星(1 = 天貴星 … 12 = 天印星。十二運と同じ順) */
export const mainStarId = (n: number) => `main-${n}`;
export const subStarId = (n: number) => `sub-${n}`;
/** 天中殺(1 = 子丑 … 6 = 戌亥) */
export const tenchuId = (n: number) => `tenchu-${n}`;

/** 宿命中殺の種類(生年・生月・生日・日座・日居) */
export type ShukumeiKind = "year" | "month" | "day" | "nichiza" | "nikkyo";
export const SHUKUMEI_KINDS: readonly ShukumeiKind[] = ["year", "month", "day", "nichiza", "nikkyo"];
export const shukumeiId = (k: ShukumeiKind) => `shukumei-${k}`;

/** 異常干支の干支番号(甲子 = 1)。通常異常干支6種のあとに暗合異常干支7種 */
export const IJO_NORMAL = [11, 12, 35, 37, 48, 54] as const;
export const IJO_ANGOU = [18, 19, 23, 24, 25, 30, 36] as const;
export const ijoId = (cycleNumber: number) => `ijo-${cycleNumber}`;

/** 位相法の種類(支合・半会・方三位・対冲・刑・害・破) */
export type IsouKind = "shigo" | "hankai" | "hosani" | "taichu" | "kei" | "gai" | "ha";
export const ISOU_KINDS: readonly IsouKind[] = ["shigo", "hankai", "hosani", "taichu", "kei", "gai", "ha"];
export const isouId = (k: IsouKind) => `isou-${k}`;

/** 宿曜の27宿(1 = 昴宿 … 27 = 胃宿)と三九の関係 */
export const mansionId = (n: number) => `mansion-${n}`;
export type RelationKind = "mei" | "ei" | "sui" | "an" | "ki" | "sei" | "kai" | "yu" | "shin" | "gyo" | "tai";
/** 三九の関係(命・栄・衰・安・危・成・壊・友・親・業・胎の順) */
export const RELATION_KINDS: readonly RelationKind[] = ["mei", "ei", "sui", "an", "ki", "sei", "kai", "yu", "shin", "gyo", "tai"];
export const relationId = (k: RelationKind) => `relation-${k}`;

/** 西洋占星術の十二星座・天体・ハウス(1〜12)・アスペクト・エレメント */
export const signId = (key: string) => `sign-${key}`;
export const bodyId = (key: string) => `body-${key}`;
export const houseId = (n: number) => `house-${n}`;
export const aspectId = (kind: string) => `aspect-${kind}`;
export type AstroElement = "fire" | "earth" | "air" | "water";
export const ASTRO_ELEMENTS: readonly AstroElement[] = ["fire", "earth", "air", "water"];
export const astroElementId = (e: AstroElement) => `element-${e}`;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** 早見表の項目を持つ実装済みの占術 */
export type ElementSystemId = "numerology" | "kyusei" | "maya" | "shichu" | "sanmei" | "sukuyo" | "horoscope";

/** 占術ごとの早見表の項目 id の一覧 */
export const ELEMENT_IDS: Record<ElementSystemId, readonly string[]> = {
  numerology: [...range(1, 9), 11, 22, 33].map(numberId),
  kyusei: [...range(1, 9).map(starId), ...PALACES.map(palaceId), ...DIRECTIONS.map(directionId)],
  maya: [...range(1, 20).map(sealId), ...range(1, 13).map(toneId), ...range(0, 13).map(moonId), BLACK_KIN_ID],
  shichu: [
    ...range(1, 10).map(stemId),
    ...range(1, 12).map(branchId),
    ...range(1, 10).map(tsuhenId),
    ...range(1, 12).map(unseiId),
    ...FIVE_ELEMENTS.map(elementId),
  ],
  sanmei: [
    ...range(1, 10).map(mainStarId),
    ...range(1, 12).map(subStarId),
    ...range(1, 6).map(tenchuId),
    ...SHUKUMEI_KINDS.map(shukumeiId),
    ...[...IJO_NORMAL, ...IJO_ANGOU].map(ijoId),
    ...ISOU_KINDS.map(isouId),
  ],
  sukuyo: [...range(1, 27).map(mansionId), ...RELATION_KINDS.map(relationId)],
  // 星座・天体・アスペクトの key は horoscope/zodiac.ts・aspects.ts の順と同じ
  horoscope: [
    ...["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"].map(signId),
    ...["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron", "lilith"].map(bodyId),
    ...range(1, 12).map(houseId),
    ...["conjunction", "sextile", "square", "trine", "opposition", "quincunx", "semisextile", "semisquare", "quintile", "sesquiquadrate", "biquintile"].map(aspectId),
    ...ASTRO_ELEMENTS.map(astroElementId),
  ],
};
