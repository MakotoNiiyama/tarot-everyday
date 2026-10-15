import { mod } from "../local-date";

/** 十二星座(0 = 牡羊座 … 11 = 魚座)。key は早見表の id と記号の名前に使う */
export const SIGNS = [
  { key: "aries", name: "牡羊座" },
  { key: "taurus", name: "牡牛座" },
  { key: "gemini", name: "双子座" },
  { key: "cancer", name: "蟹座" },
  { key: "leo", name: "獅子座" },
  { key: "virgo", name: "乙女座" },
  { key: "libra", name: "天秤座" },
  { key: "scorpio", name: "蠍座" },
  { key: "sagittarius", name: "射手座" },
  { key: "capricorn", name: "山羊座" },
  { key: "aquarius", name: "水瓶座" },
  { key: "pisces", name: "魚座" },
] as const;

export type SignKey = (typeof SIGNS)[number]["key"];

/** 天体(表示の順)。key は早見表の id と記号の名前に使う */
export const BODIES = [
  { key: "sun", name: "太陽" },
  { key: "moon", name: "月" },
  { key: "mercury", name: "水星" },
  { key: "venus", name: "金星" },
  { key: "mars", name: "火星" },
  { key: "jupiter", name: "木星" },
  { key: "saturn", name: "土星" },
  { key: "uranus", name: "天王星" },
  { key: "neptune", name: "海王星" },
  { key: "pluto", name: "冥王星" },
  { key: "node", name: "ドラゴンヘッド" },
  { key: "chiron", name: "キロン" },
  { key: "lilith", name: "リリス" },
] as const;

export type BodyKey = (typeof BODIES)[number]["key"];

export const signOf = (lon: number) => Math.floor(mod(lon, 360) / 30);

/** 星座の中の度数。例: 8°14′(分は切り捨て) */
export function formatDegree(lon: number): string {
  const inSign = mod(lon, 30);
  const deg = Math.floor(inSign);
  const min = Math.floor((inSign - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′`;
}
