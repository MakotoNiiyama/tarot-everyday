// src/lib/fortune/ambiguity.ts
import { formatTokyoHm } from "./tokyo-time";
import type { Resolved, TimeRange } from "./types";

/** 範囲の中央の瞬間 */
export function midpoint(range: TimeRange): Date {
  return new Date((range.start.getTime() + range.end.getTime()) / 2);
}

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
    const value = compute(midpoint(segment));
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

/** 表記ごとの候補。隣り合う同じ表記の候補は範囲をつなげて1つにする */
function labelGroups<T>(
  options: { value: T; range: TimeRange }[],
  format: (v: T) => string,
): { value: string; range: TimeRange }[] {
  const groups: { value: string; range: TimeRange }[] = [];
  for (const o of options) {
    const value = format(o.value);
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.range = { start: last.range.start, end: o.range.end };
    else groups.push({ value, range: o.range });
  }
  return groups;
}

/**
 * 表記が分かれるときの候補(表記と時刻の範囲)。確定、または表記がすべて同じなら undefined。
 * 表記のまとめ方は describeResolved と同じ。
 */
export function describeCandidates<T>(
  r: Resolved<T>,
  format: (v: T) => string,
): { value: string; rangeLabel: string }[] | undefined {
  if (r.kind === "fixed") return undefined;
  const groups = labelGroups(r.options, format);
  if (groups.length === 1) return undefined;
  return groups.map((g, i) => ({ value: g.value, rangeLabel: rangeLabel(g.range, i, groups.length) }));
}

/** 表示用の文字列。候補は「A(〜5:02) / B(5:02〜)」。隣り合う同じ表記の候補は1つにまとめる */
export function describeResolved<T>(r: Resolved<T>, format: (v: T) => string): string {
  if (r.kind === "fixed") return format(r.value);
  const candidates = describeCandidates(r, format);
  if (!candidates) return format(r.options[0].value);
  return candidates.map((c) => `${c.value}(${c.rangeLabel})`).join(" / ");
}
