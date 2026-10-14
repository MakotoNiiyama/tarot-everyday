import { describe, it, expect } from "vitest";
import { ELEMENT_IDS } from "@/lib/fortune/element-ids";
import { numerologyEntries } from "../numerology";
import { kyuseiEntries } from "../kyusei";
import { mayaEntries } from "../maya";
import type { GuideEntry } from "../types";

const EMOJI_OR_SYMBOL = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}]/u;
const PERIOD_WORDS = /今日|今月|今年|本日|この日|この月|この年/;
/** 全角換算の文字数(半角は0.5) */
const width = (s: string) => [...s].reduce((n, c) => n + (/[\x20-\x7E]/.test(c) ? 0.5 : 1), 0);

const cases: [keyof typeof ELEMENT_IDS, GuideEntry[]][] = [
  ["numerology", numerologyEntries],
  ["kyusei", kyuseiEntries],
  ["maya", mayaEntries],
];

describe.each(cases)("%s の辞書データ", (system, entries) => {
  it("ELEMENT_IDS と過不足なく一致すること", () => {
    expect(entries.map((e) => e.id).sort()).toEqual([...ELEMENT_IDS[system]].sort());
  });

  it("system と id が重複しないこと", () => {
    expect(entries.every((e) => e.system === system)).toBe(true);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it.each(entries.map((e) => [e.id, e] as const))("%s の文章が決まりを満たすこと", (_id, e) => {
    expect(e.name).not.toBe("");
    expect(e.reading).toMatch(/^[ぁ-んー\s]+$/);
    expect(e.group).not.toBe("");
    expect(e.keywords.length).toBeGreaterThanOrEqual(3);
    expect(e.keywords.length).toBeLessThanOrEqual(5);
    for (const k of e.keywords) expect([...k].length).toBeLessThanOrEqual(8);
    expect(width(e.summary)).toBeGreaterThanOrEqual(80);
    expect(width(e.summary)).toBeLessThanOrEqual(160);
    expect(e.periodNote).toBeDefined();
    expect(width(e.periodNote ?? "")).toBeGreaterThanOrEqual(30);
    expect(width(e.periodNote ?? "")).toBeLessThanOrEqual(80);
    expect(e.periodNote).not.toMatch(PERIOD_WORDS);
    const text = [e.name, e.reading, e.summary, e.periodNote, ...e.keywords].join("");
    expect(text).not.toMatch(EMOJI_OR_SYMBOL);
    expect(e.image.kind).toBe("glyph");
  });

  it("related が同じ占術に実在する id だけを指すこと", () => {
    const ids = new Set(entries.map((e) => e.id));
    for (const e of entries) {
      for (const r of e.related ?? []) {
        expect(ids.has(r)).toBe(true);
        expect(r).not.toBe(e.id);
      }
    }
  });
});
