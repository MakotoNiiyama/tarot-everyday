// src/lib/fortune/__tests__/ambiguity.test.ts
import { describe, it, expect } from "vitest";
import { describeCandidates, describeResolved, isAmbiguous, representative, resolveOverRange } from "../ambiguity";
import { tokyoToUtc } from "../tokyo-time";

const range = { start: tokyoToUtc(2026, 2, 4, 0, 0), end: tokyoToUtc(2026, 2, 4, 24, 0) };
const boundary = tokyoToUtc(2026, 2, 4, 5, 2);
const later = tokyoToUtc(2026, 2, 4, 18, 30);
/** 境界ごとに内部の値は変わるが、表記は前半2区間が同じ(A / A / B)になる結果 */
const aab = () =>
  resolveOverRange(
    range,
    [boundary, later],
    (at) => (at < boundary ? { label: "A", n: 1 } : at < later ? { label: "A", n: 2 } : { label: "B", n: 3 }),
    (x, y) => x.n === y.n,
  );

describe("resolveOverRange", () => {
  it("境界がなければ確定値を返すこと", () => {
    const r = resolveOverRange(range, [], () => "A", (a, b) => a === b);
    expect(r).toEqual({ kind: "fixed", value: "A" });
  });

  it("境界の前後で値が変われば候補にすること", () => {
    const r = resolveOverRange(range, [boundary], (at) => (at < boundary ? "前" : "後"), (a, b) => a === b);
    expect(r.kind).toBe("ambiguous");
    if (r.kind !== "ambiguous") return;
    expect(r.options.map((o) => o.value)).toEqual(["前", "後"]);
    expect(r.options[0].range.end.getTime()).toBe(boundary.getTime());
    expect(isAmbiguous(r)).toBe(true);
    expect(representative(r)).toBe("前");
  });

  it("境界があっても値が同じなら確定値にまとめること", () => {
    const r = resolveOverRange(range, [boundary], () => "同じ", (a, b) => a === b);
    expect(r).toEqual({ kind: "fixed", value: "同じ" });
  });
});

describe("describeResolved", () => {
  it("候補を時刻範囲付きで表記すること", () => {
    const r = resolveOverRange(range, [boundary], (at) => (at < boundary ? "二黒土星" : "一白水星"), (a, b) => a === b);
    expect(describeResolved(r, (v) => v)).toBe("二黒土星(〜5:02) / 一白水星(5:02〜)");
  });

  it("表記が同じ候補は1つにまとめること", () => {
    const r = resolveOverRange(range, [boundary], (at) => ({ a: 1, b: at < boundary ? 1 : 2 }), (x, y) => x.a === y.a && x.b === y.b);
    expect(describeResolved(r, (v) => String(v.a))).toBe("1");
  });

  it("隣り合う同じ表記の候補は範囲をつなげて1つにすること", () => {
    expect(describeResolved(aab(), (v) => v.label)).toBe("A(〜18:30) / B(18:30〜)");
  });
});

describe("describeCandidates", () => {
  it("確定値なら候補を返さないこと", () => {
    expect(describeCandidates({ kind: "fixed", value: "A" }, (v) => v)).toBeUndefined();
  });

  it("表記がすべて同じなら候補を返さないこと", () => {
    const r = resolveOverRange(range, [boundary], (at) => (at < boundary ? 1 : 2), (a, b) => a === b);
    expect(describeCandidates(r, () => "同じ")).toBeUndefined();
  });

  it("表記が分かれれば、隣り合う同じ表記をまとめた候補を返すこと", () => {
    expect(describeCandidates(aab(), (v) => v.label)).toEqual([
      { value: "A", rangeLabel: "〜18:30" },
      { value: "B", rangeLabel: "18:30〜" },
    ]);
  });
});
