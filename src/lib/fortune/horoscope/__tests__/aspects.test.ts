import { describe, it, expect } from "vitest";
import { ASPECTS, findAspects } from "../aspects";

describe("findAspects", () => {
  it("オーブの中にある角度だけを、近い順ではなく点の順に返すこと", () => {
    const points = [
      { key: "sun", lon: 0 },
      { key: "moon", lon: 125 }, // 太陽とトライン(オーブ5、太陽・月を含むので8まで)
      { key: "mars", lon: 186 }, // 太陽とオポジション(6、10まで)、月と 61 度でセクスタイル(1、6まで)
      { key: "venus", lon: 46 }, // 太陽とセミスクエア(1、マイナー2まで)
    ];
    const result = findAspects(points);
    expect(result.map((a) => [a.a, a.b, a.kind, Math.round(a.orb * 10) / 10])).toEqual([
      ["sun", "moon", "trine", 5],
      ["sun", "mars", "opposition", 6],
      ["sun", "venus", "semisquare", 1],
      ["moon", "mars", "sextile", 1],
    ]);
    expect(result.find((a) => a.kind === "semisquare")?.minor).toBe(true);
  });

  it("太陽・月を含まない組はオーブを狭くすること", () => {
    expect(findAspects([{ key: "mars", lon: 0 }, { key: "jupiter", lon: 127 }])).toEqual([]); // トライン 7 > 6
    expect(findAspects([{ key: "sun", lon: 0 }, { key: "jupiter", lon: 127 }])).toHaveLength(1); // 7 <= 8
  });

  it("感受点を含む組は主要5種・オーブ3だけ", () => {
    expect(findAspects([{ key: "node", lon: 0 }, { key: "sun", lon: 4 }])).toEqual([]);
    expect(findAspects([{ key: "asc", lon: 0 }, { key: "sun", lon: 92 }]).map((a) => a.kind)).toEqual(["square"]);
    expect(findAspects([{ key: "mc", lon: 0 }, { key: "sun", lon: 150 }])).toEqual([]);
  });

  it("アスペクトは11種", () => {
    expect(ASPECTS.map((a) => [a.kind, a.angle])).toEqual([
      ["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180], ["quincunx", 150],
      ["semisextile", 30], ["semisquare", 45], ["quintile", 72], ["sesquiquadrate", 135], ["biquintile", 144],
    ]);
  });
});
