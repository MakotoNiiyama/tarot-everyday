// src/lib/fortune/__tests__/registry.test.ts
import { describe, it, expect } from "vitest";
import { fortuneSystems, readAll } from "../registry";
import type { BirthProfile } from "../types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("registry", () => {
  it("実装済みの占術を設計書の順(数秘術・九星気学・マヤ暦)で持つこと", () => {
    expect(fortuneSystems.map((s) => s.id)).toEqual(["numerology", "kyusei", "maya"]);
  });

  it("readAll で全占術の結果を返すこと", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    expect(readings.map((r) => r.id)).toEqual(["numerology", "kyusei", "maya"]);
    for (const r of readings) {
      expect(r.natal.length).toBeGreaterThan(0);
      for (const period of ["day", "month", "year"] as const) {
        expect(r.periods[period].period).toBe(period);
        expect(r.periods[period].rangeLabel).not.toBe("");
        expect(r.periods[period].chips.length).toBeGreaterThan(0);
      }
    }
  });

  it("すべての参照 id が占術ごとの命名規則に従うこと", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    const patterns: Record<string, RegExp> = {
      numerology: /^number-(\d|11|22|33)$/,
      kyusei: /^(star-[1-9]|palace-(center|n|ne|e|se|s|sw|w|nw)|direction-(n|ne|e|se|s|sw|w|nw))$/,
      maya: /^(seal-([1-9]|1\d|20)|tone-([1-9]|1[0-3])|moon-([0-9]|1[0-3]))$/,
    };
    for (const r of readings) {
      const refs = [
        ...r.natal.flatMap((f) => f.refs),
        ...Object.values(r.periods).flatMap((p) => [p.headline.ref, ...p.chips.flatMap((c) => c.refs)]),
      ];
      for (const ref of refs) {
        expect(ref.system).toBe(r.id);
        expect(ref.id).toMatch(patterns[r.id]);
      }
    }
  });
});
