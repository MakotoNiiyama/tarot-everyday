// src/lib/fortune/prefectures.ts
/** 都道府県(緯度経度は県庁所在地。小数第2位まで) */
export interface Prefecture {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export const prefectures = [
  { code: "01", name: "北海道", lat: 43.06, lon: 141.35 },
  { code: "02", name: "青森県", lat: 40.82, lon: 140.74 },
  { code: "03", name: "岩手県", lat: 39.7, lon: 141.15 },
  { code: "04", name: "宮城県", lat: 38.27, lon: 140.87 },
  { code: "05", name: "秋田県", lat: 39.72, lon: 140.1 },
  { code: "06", name: "山形県", lat: 38.24, lon: 140.36 },
  { code: "07", name: "福島県", lat: 37.75, lon: 140.47 },
  { code: "08", name: "茨城県", lat: 36.34, lon: 140.45 },
  { code: "09", name: "栃木県", lat: 36.57, lon: 139.88 },
  { code: "10", name: "群馬県", lat: 36.39, lon: 139.06 },
  { code: "11", name: "埼玉県", lat: 35.86, lon: 139.65 },
  { code: "12", name: "千葉県", lat: 35.61, lon: 140.12 },
  { code: "13", name: "東京都", lat: 35.69, lon: 139.69 },
  { code: "14", name: "神奈川県", lat: 35.45, lon: 139.64 },
  { code: "15", name: "新潟県", lat: 37.9, lon: 139.02 },
  { code: "16", name: "富山県", lat: 36.7, lon: 137.21 },
  { code: "17", name: "石川県", lat: 36.59, lon: 136.63 },
  { code: "18", name: "福井県", lat: 36.07, lon: 136.22 },
  { code: "19", name: "山梨県", lat: 35.66, lon: 138.57 },
  { code: "20", name: "長野県", lat: 36.65, lon: 138.18 },
  { code: "21", name: "岐阜県", lat: 35.39, lon: 136.72 },
  { code: "22", name: "静岡県", lat: 34.98, lon: 138.38 },
  { code: "23", name: "愛知県", lat: 35.18, lon: 136.91 },
  { code: "24", name: "三重県", lat: 34.73, lon: 136.51 },
  { code: "25", name: "滋賀県", lat: 35.0, lon: 135.87 },
  { code: "26", name: "京都府", lat: 35.02, lon: 135.76 },
  { code: "27", name: "大阪府", lat: 34.69, lon: 135.52 },
  { code: "28", name: "兵庫県", lat: 34.69, lon: 135.18 },
  { code: "29", name: "奈良県", lat: 34.69, lon: 135.83 },
  { code: "30", name: "和歌山県", lat: 34.23, lon: 135.17 },
  { code: "31", name: "鳥取県", lat: 35.5, lon: 134.24 },
  { code: "32", name: "島根県", lat: 35.47, lon: 133.05 },
  { code: "33", name: "岡山県", lat: 34.66, lon: 133.93 },
  { code: "34", name: "広島県", lat: 34.4, lon: 132.46 },
  { code: "35", name: "山口県", lat: 34.19, lon: 131.47 },
  { code: "36", name: "徳島県", lat: 34.07, lon: 134.56 },
  { code: "37", name: "香川県", lat: 34.34, lon: 134.04 },
  { code: "38", name: "愛媛県", lat: 33.84, lon: 132.77 },
  { code: "39", name: "高知県", lat: 33.56, lon: 133.53 },
  { code: "40", name: "福岡県", lat: 33.61, lon: 130.42 },
  { code: "41", name: "佐賀県", lat: 33.25, lon: 130.3 },
  { code: "42", name: "長崎県", lat: 32.74, lon: 129.87 },
  { code: "43", name: "熊本県", lat: 32.79, lon: 130.74 },
  { code: "44", name: "大分県", lat: 33.24, lon: 131.61 },
  { code: "45", name: "宮崎県", lat: 31.91, lon: 131.42 },
  { code: "46", name: "鹿児島県", lat: 31.56, lon: 130.56 },
  { code: "47", name: "沖縄県", lat: 26.21, lon: 127.68 },
] as const satisfies readonly Prefecture[];

export type PrefectureCode = (typeof prefectures)[number]["code"];

/** 出生地未入力のときの基準(日本標準時子午線の明石) */
export const AKASHI = { lat: 34.65, lon: 135.0, label: "明石(出生地未入力)" } as const;

export function findPrefecture(code: string): Prefecture | undefined {
  return prefectures.find((p) => p.code === code);
}

export function isPrefectureCode(code: unknown): code is PrefectureCode {
  return typeof code === "string" && prefectures.some((p) => p.code === code);
}
