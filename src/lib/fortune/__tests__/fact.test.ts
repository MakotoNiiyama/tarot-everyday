// src/lib/fortune/__tests__/fact.test.ts
import { describe, it, expect } from "vitest";
import { resolvedFact } from "../fact";
import type { Resolved } from "../types";

const at = (h: number) => new Date(Date.UTC(2026, 0, 1, h));
const ref = (id: string) => ({ system: "shichu" as const, id });

describe("resolvedFact", () => {
  it("確定なら候補を付けないこと", () => {
    const r: Resolved<number> = { kind: "fixed", value: 1 };
    expect(resolvedFact(r, "k", "ラベル", (v) => `値${v}`, (v) => [ref(`x-${v}`)])).toEqual({
      key: "k",
      label: "ラベル",
      value: "値1",
      refs: [ref("x-1")],
    });
  });

  it("候補で表記が分かれるときは candidates を付け、参照の重複を除くこと", () => {
    const r: Resolved<number> = {
      kind: "ambiguous",
      options: [
        { value: 1, range: { start: at(0), end: at(5) } },
        { value: 2, range: { start: at(5), end: at(10) } },
      ],
    };
    const f = resolvedFact(r, "k", "ラベル", (v) => `値${v}`, () => [ref("same")]);
    expect(f.value).toMatch(/^値1\(〜\d+:\d\d\) \/ 値2\(\d+:\d\d〜\)$/);
    expect(f.candidates).toHaveLength(2);
    expect(f.refs).toEqual([ref("same")]);
  });

  it("候補があっても表記が同じなら candidates を付けないこと", () => {
    const r: Resolved<number> = {
      kind: "ambiguous",
      options: [
        { value: 1, range: { start: at(0), end: at(5) } },
        { value: 2, range: { start: at(5), end: at(10) } },
      ],
    };
    const f = resolvedFact(r, "k", "ラベル", () => "同じ", () => []);
    expect(f).toEqual({ key: "k", label: "ラベル", value: "同じ", refs: [] });
  });
});
