// src/lib/fortune/__tests__/element-ids.test.ts
import { describe, it, expect } from "vitest";
import { ELEMENT_IDS } from "../element-ids";

describe("ELEMENT_IDS", () => {
  it("占術ごとの項目 id を重複なく持つこと", () => {
    expect(ELEMENT_IDS.numerology).toHaveLength(12);
    expect(ELEMENT_IDS.numerology).toContain("number-33");
    expect(ELEMENT_IDS.kyusei).toHaveLength(9 + 9 + 8);
    expect(ELEMENT_IDS.kyusei).toContain("palace-center");
    expect(ELEMENT_IDS.kyusei).not.toContain("direction-center");
    expect(ELEMENT_IDS.maya).toHaveLength(20 + 13 + 14);
    expect(ELEMENT_IDS.maya).toContain("moon-0");
    for (const ids of Object.values(ELEMENT_IDS)) expect(new Set(ids).size).toBe(ids.length);
  });
});
