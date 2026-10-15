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
    expect(ELEMENT_IDS.shichu).toHaveLength(10 + 12 + 10 + 12 + 5);
    expect(ELEMENT_IDS.shichu).toContain("stem-10");
    expect(ELEMENT_IDS.shichu).toContain("branch-12");
    expect(ELEMENT_IDS.shichu).toContain("tsuhen-10");
    expect(ELEMENT_IDS.shichu).toContain("unsei-12");
    expect(ELEMENT_IDS.shichu).toContain("element-water");
    expect(ELEMENT_IDS.sanmei).toHaveLength(10 + 12 + 6 + 5 + 13 + 7);
    expect(ELEMENT_IDS.sanmei).toContain("main-10");
    expect(ELEMENT_IDS.sanmei).toContain("sub-12");
    expect(ELEMENT_IDS.sanmei).toContain("tenchu-6");
    expect(ELEMENT_IDS.sanmei).toContain("shukumei-nikkyo");
    expect(ELEMENT_IDS.sanmei).toContain("ijo-11");
    expect(ELEMENT_IDS.sanmei).toContain("isou-ha");
    expect(ELEMENT_IDS.sukuyo).toHaveLength(27 + 11);
    expect(ELEMENT_IDS.sukuyo).toContain("mansion-1");
    expect(ELEMENT_IDS.sukuyo).toContain("mansion-27");
    expect(ELEMENT_IDS.sukuyo).toContain("relation-tai");
    for (const ids of Object.values(ELEMENT_IDS)) expect(new Set(ids).size).toBe(ids.length);
  });

  it("異常干支の id は干支番号(甲子 = 1)で、通常6種と暗合7種", () => {
    expect(ELEMENT_IDS.sanmei.filter((id) => id.startsWith("ijo-"))).toEqual(
      [11, 12, 35, 37, 48, 54, 18, 19, 23, 24, 25, 30, 36].map((n) => `ijo-${n}`),
    );
  });
});
