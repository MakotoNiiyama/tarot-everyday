// src/lib/fortune/__tests__/registry.test.ts
import { describe, it, expect } from "vitest";
import { ELEMENT_IDS } from "../element-ids";
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

  it("すべての参照 id が早見表の項目 id の一覧に含まれること", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    for (const r of readings) {
      const refs = [
        ...r.natal.flatMap((f) => f.refs),
        ...Object.values(r.periods).flatMap((p) => [p.headline.ref, ...p.chips.flatMap((c) => c.refs)]),
      ];
      for (const ref of refs) {
        expect(ref.system).toBe(r.id);
        expect(ELEMENT_IDS[r.id as keyof typeof ELEMENT_IDS]).toContain(ref.id);
      }
    }
  });
});
