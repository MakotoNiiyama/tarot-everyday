// src/lib/fortune/fact.ts
import { describeCandidates, describeResolved, resolvedValues } from "./ambiguity";
import type { ElementRef, Fact, Resolved } from "./types";

/**
 * 出生時刻で分かれうる計算結果から表示用の事実を作る。
 * 表記が分かれるときだけ candidates を付け、参照は候補の順に重複を除いて並べる
 */
export function resolvedFact<T>(
  resolved: Resolved<T>,
  key: string,
  label: string,
  format: (v: T) => string,
  refsOf: (v: T) => ElementRef[],
): Fact {
  const candidates = describeCandidates(resolved, format);
  const seen = new Set<string>();
  const refs = resolvedValues(resolved)
    .flatMap(refsOf)
    .filter((r) => {
      const k = `${r.system}:${r.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  return { key, label, value: describeResolved(resolved, format), refs, ...(candidates ? { candidates } : {}) };
}
