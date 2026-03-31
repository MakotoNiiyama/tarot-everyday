import { describe, it, expect } from "vitest";
import {
  spreadDefinitions,
  spreadList,
  type SpreadType,
} from "@/lib/spread";

describe("spreadDefinitions", () => {
  const types: SpreadType[] = ["three-card", "choice", "hexagram", "celtic-cross"];

  it("4種類のスプレッドが定義されていること", () => {
    expect(Object.keys(spreadDefinitions)).toHaveLength(4);
    types.forEach((t) => {
      expect(spreadDefinitions[t]).toBeDefined();
    });
  });

  it.each(types)("%s のpositions数がcardCountと一致すること", (type) => {
    const def = spreadDefinitions[type];
    expect(def.positions).toHaveLength(def.cardCount);
  });

  it("スリーカードが3枚であること", () => {
    expect(spreadDefinitions["three-card"].cardCount).toBe(3);
  });

  it("二者択一が5枚であること", () => {
    expect(spreadDefinitions["choice"].cardCount).toBe(5);
  });

  it("ヘキサグラムが7枚であること", () => {
    expect(spreadDefinitions["hexagram"].cardCount).toBe(7);
  });

  it("ケルト十字が10枚であること", () => {
    expect(spreadDefinitions["celtic-cross"].cardCount).toBe(10);
  });
});

describe("spreadList", () => {
  it("4つのスプレッドが含まれること", () => {
    expect(spreadList).toHaveLength(4);
  });

  it("全スプレッドにname・description・positionsがあること", () => {
    spreadList.forEach((s) => {
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.positions.length).toBeGreaterThan(0);
    });
  });
});
