// src/lib/fortune/__tests__/ambiguity.test.ts
import { describe, it, expect } from "vitest";
import { describeResolved, isAmbiguous, representative, resolveOverRange } from "../ambiguity";
import { tokyoToUtc } from "../tokyo-time";

const range = { start: tokyoToUtc(2026, 2, 4, 0, 0), end: tokyoToUtc(2026, 2, 4, 24, 0) };
const boundary = tokyoToUtc(2026, 2, 4, 5, 2);

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
});
