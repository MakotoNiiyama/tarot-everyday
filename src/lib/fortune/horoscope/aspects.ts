export type AspectKind =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition"
  | "quincunx"
  | "semisextile"
  | "semisquare"
  | "quintile"
  | "sesquiquadrate"
  | "biquintile";

/** アスペクト。minor はマイナーアスペクト(画面の切り替えで表示)。orb は [太陽・月を含む, 含まない] */
export const ASPECTS: readonly { kind: AspectKind; name: string; angle: number; minor: boolean; orb: [number, number] }[] = [
  { kind: "conjunction", name: "コンジャンクション", angle: 0, minor: false, orb: [10, 8] },
  { kind: "sextile", name: "セクスタイル", angle: 60, minor: false, orb: [6, 4] },
  { kind: "square", name: "スクエア", angle: 90, minor: false, orb: [8, 6] },
  { kind: "trine", name: "トライン", angle: 120, minor: false, orb: [8, 6] },
  { kind: "opposition", name: "オポジション", angle: 180, minor: false, orb: [10, 8] },
  { kind: "quincunx", name: "クインカンクス", angle: 150, minor: false, orb: [3, 3] },
  { kind: "semisextile", name: "セミセクスタイル", angle: 30, minor: true, orb: [2, 2] },
  { kind: "semisquare", name: "セミスクエア", angle: 45, minor: true, orb: [2, 2] },
  { kind: "quintile", name: "クインタイル", angle: 72, minor: true, orb: [2, 2] },
  { kind: "sesquiquadrate", name: "セスキコードレート", angle: 135, minor: true, orb: [2, 2] },
  { kind: "biquintile", name: "バイクインタイル", angle: 144, minor: true, orb: [2, 2] },
];

const MAJOR5 = new Set<AspectKind>(["conjunction", "sextile", "square", "trine", "opposition"]);
const LUMINARIES = new Set(["sun", "moon"]);
/** 感受点(主要5種・オーブ3だけ) */
const SENSITIVE = new Set(["node", "chiron", "lilith", "asc", "mc"]);
const SENSITIVE_ORB = 3;
const AXES = new Set(["asc", "mc"]);

export interface Aspect {
  a: string;
  b: string;
  kind: AspectKind;
  /** 正確な角度からのずれ(度) */
  orb: number;
  minor: boolean;
}

/** 点の組ごとに、オーブの中で最も近いアスペクトを1つ返す(点の並びの順) */
export function findAspects(points: { key: string; lon: number }[]): Aspect[] {
  const result: Aspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i];
      const q = points[j];
      // ASC と MC はハウスの軸どうしなので組にしない
      if (AXES.has(p.key) && AXES.has(q.key)) continue;
      const sep = Math.abs(((q.lon - p.lon + 540) % 360) - 180);
      const sensitive = SENSITIVE.has(p.key) || SENSITIVE.has(q.key);
      const luminary = LUMINARIES.has(p.key) || LUMINARIES.has(q.key);
      let best: Aspect | null = null;
      for (const asp of ASPECTS) {
        if (sensitive && !MAJOR5.has(asp.kind)) continue;
        const limit = sensitive ? SENSITIVE_ORB : asp.orb[luminary ? 0 : 1];
        const orb = Math.abs(sep - asp.angle);
        if (orb <= limit && (!best || orb < best.orb)) best = { a: p.key, b: q.key, kind: asp.kind, orb, minor: asp.minor };
      }
      if (best) result.push(best);
    }
  }
  return result;
}
