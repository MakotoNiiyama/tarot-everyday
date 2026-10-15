// src/lib/fortune/__tests__/registry.test.ts
import { describe, it, expect } from "vitest";
import { ELEMENT_IDS } from "../element-ids";
import { fortuneSystems, readAll } from "../registry";
import { FORTUNE_SYSTEM_NAMES } from "../system-names";
import type { BirthProfile } from "../types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("registry", () => {
  it("実装済みの占術を設計書の順(数秘術・九星気学・マヤ暦・四柱推命・算命学・宿曜)で持つこと", () => {
    expect(fortuneSystems.map((s) => s.id)).toEqual(["numerology", "kyusei", "maya", "shichu", "sanmei", "sukuyo"]);
  });

  it("readAll で全占術の結果を返すこと", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    expect(readings.map((r) => r.id)).toEqual(["numerology", "kyusei", "maya", "shichu", "sanmei", "sukuyo"]);
    for (const r of readings) {
      expect(r.natal.length).toBeGreaterThan(0);
      for (const period of ["day", "month", "year"] as const) {
        expect(r.periods[period].period).toBe(period);
        expect(r.periods[period].rangeLabel).not.toBe("");
        expect(r.periods[period].chips.length).toBeGreaterThan(0);
      }
    }
  });

  it("事実の key は人物像・各期間のチップの中で一意であること", () => {
    const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
    for (const r of readings) {
      const lists = [r.natal, ...Object.values(r.periods).map((p) => p.chips)];
      for (const facts of lists) {
        const keys = facts.map((f) => f.key);
        expect(keys.every((k) => k !== "")).toBe(true);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it("FORTUNE_SYSTEM_NAMES が fortuneSystems と一致すること", () => {
    expect(FORTUNE_SYSTEM_NAMES).toEqual(fortuneSystems.map((s) => ({ id: s.id, name: s.name })));
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

  it("図のセルの参照 id は早見表にあり、factKeys は人物像の事実を指すこと", () => {
    for (const gender of [undefined, "male", "female"] as const) {
      const readings = readAll({ ...profile, gender }, { year: 2026, month: 10, day: 14 });
      for (const r of readings) {
        if (!r.chart) continue;
        const cells =
          r.chart.kind === "pillars"
            ? r.chart.rows.flatMap((row) => row.cells)
            : r.chart.kind === "horoscope"
              ? r.chart.bodies.map((b) => b.fact)
              : r.chart.cells.map((c) => c?.fact ?? null);
        for (const cell of cells) {
          if (!cell) continue;
          for (const ref of cell.refs) expect(ELEMENT_IDS[r.id as keyof typeof ELEMENT_IDS]).toContain(ref.id);
        }
        for (const key of r.chart.factKeys) expect(r.natal.map((f) => f.key)).toContain(key);
      }
    }
  });
});
