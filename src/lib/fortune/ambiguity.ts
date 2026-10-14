// src/lib/fortune/ambiguity.ts
import { formatTokyoHm } from "./tokyo-time";
import type { Resolved, TimeRange } from "./types";

/**
 * 範囲を境界時刻で区切り、各区間の中央で compute した結果をまとめる。
 * 結果が1つなら確定、複数なら区間付きの候補にする(設計書 §5)。
 */
export function resolveOverRange<T>(
  range: TimeRange,
  boundaries: Date[],
  compute: (at: Date) => T,
  equals: (a: T, b: T) => boolean,
): Resolved<T> {
  const cuts = boundaries
    .filter((b) => b > range.start && b < range.end)
    .sort((a, b) => a.getTime() - b.getTime());
  const edges = [range.start, ...cuts, range.end];

  const options: { value: T; range: TimeRange }[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const segment = { start: edges[i], end: edges[i + 1] };
    const mid = new Date((segment.start.getTime() + segment.end.getTime()) / 2);
    const value = compute(mid);
    const last = options[options.length - 1];
    if (last && equals(last.value, value)) {
      last.range = { start: last.range.start, end: segment.end };
    } else {
      options.push({ value, range: segment });
    }
  }
  return options.length === 1 ? { kind: "fixed", value: options[0].value } : { kind: "ambiguous", options };
}

export function isAmbiguous<T>(r: Resolved<T>): boolean {
  return r.kind === "ambiguous";
}

/** 運勢の計算に使う代表値(候補があれば最初の候補) */
export function representative<T>(r: Resolved<T>): T {
  return r.kind === "fixed" ? r.value : r.options[0].value;
}

export function resolvedValues<T>(r: Resolved<T>): T[] {
  return r.kind === "fixed" ? [r.value] : r.options.map((o) => o.value);
}

function rangeLabel(range: TimeRange, index: number, count: number): string {
  if (index === 0) return `〜${formatTokyoHm(range.end)}`;
  if (index === count - 1) return `${formatTokyoHm(range.start)}〜`;
  return `${formatTokyoHm(range.start)}〜${formatTokyoHm(range.end)}`;
}

/** 表示用の文字列。候補は「A(〜5:02) / B(5:02〜)」。表記が同じ候補は1つにまとめる */
export function describeResolved<T>(r: Resolved<T>, format: (v: T) => string): string {
  if (r.kind === "fixed") return format(r.value);
  const labels = r.options.map((o) => format(o.value));
  if (labels.every((l) => l === labels[0])) return labels[0];
  return r.options.map((o, i) => `${labels[i]}(${rangeLabel(o.range, i, r.options.length)})`).join(" / ");
}
