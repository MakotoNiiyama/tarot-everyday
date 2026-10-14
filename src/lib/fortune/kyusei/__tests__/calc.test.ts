// src/lib/fortune/kyusei/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import {
  dayStar,
  keisha,
  kyuseiNatalAt,
  luckyDirections,
  monthStar,
  positionInBoard,
  yearStar,
} from "../calc";
import { tokyoToUtc } from "../../tokyo-time";

describe("yearStar(本命星・年盤の中宮)", () => {
  it.each([
    [1990, 1],
    [2000, 9],
    [1998, 2],
    [2024, 3],
    [2025, 2],
    [2026, 1],
  ])("%i年 → %i", (y, star) => {
    expect(yearStar(y)).toBe(star);
  });
});

describe("monthStar(月命星・月盤の中宮)", () => {
  it("グループごとの寅月の星から1つずつ減ること", () => {
    expect(monthStar(1, 0)).toBe(8);
    expect(monthStar(1, 1)).toBe(7);
    expect(monthStar(1, 10)).toBe(7);
    expect(monthStar(2, 0)).toBe(2);
    expect(monthStar(2, 11)).toBe(9);
    expect(monthStar(3, 0)).toBe(5);
  });
});

describe("positionInBoard", () => {
  it("定位盤(中宮が五黄)の配置", () => {
    expect(positionInBoard(5, 1)).toBe("n");
    expect(positionInBoard(5, 9)).toBe("s");
    expect(positionInBoard(5, 6)).toBe("nw");
    expect(positionInBoard(5, 5)).toBe("center");
  });
});

describe("keisha(傾斜宮)", () => {
  it("月命星を中宮に置いた盤で本命星が入る宮", () => {
    expect(keisha(1, 7)).toEqual(["ne"]);
  });

  it("中宮傾斜の表", () => {
    expect(keisha(1, 1)).toEqual(["s"]);
    expect(keisha(2, 2)).toEqual(["nw"]);
    expect(keisha(3, 3)).toEqual(["se"]);
    expect(keisha(4, 4)).toEqual(["e"]);
    expect(keisha(6, 6)).toEqual(["sw"]);
    expect(keisha(7, 7)).toEqual(["ne"]);
    expect(keisha(8, 8)).toEqual(["w"]);
    expect(keisha(9, 9)).toEqual(["n"]);
  });

  it("五黄同士は性別で分かれ、未入力なら両方", () => {
    expect(keisha(5, 5, "male")).toEqual(["w"]);
    expect(keisha(5, 5, "female")).toEqual(["nw"]);
    expect(keisha(5, 5)).toEqual(["w", "nw"]);
  });
});

describe("kyuseiNatalAt", () => {
  it("1990年3月29日は一白水星・七赤金星・艮宮傾斜", () => {
    expect(kyuseiNatalAt(tokyoToUtc(1990, 3, 29, 12, 0))).toEqual({ honmei: 1, getsumei: 7, keisha: ["ne"] });
  });

  it("立春前は前年の星", () => {
    expect(kyuseiNatalAt(tokyoToUtc(1990, 2, 3, 12, 0)).honmei).toBe(2);
    expect(kyuseiNatalAt(tokyoToUtc(1990, 2, 3, 12, 0)).getsumei).toBe(9);
  });
});

describe("dayStar(日家九星)", () => {
  it.each([
    [{ year: 2024, month: 12, day: 26 }, 1],
    [{ year: 2025, month: 1, day: 1 }, 7],
    [{ year: 2025, month: 6, day: 24 }, 9],
    [{ year: 2025, month: 6, day: 25 }, 8],
    [{ year: 2025, month: 12, day: 21 }, 1],
  ])("%o → %i", (d, star) => {
    expect(dayStar(d)).toBe(star);
  });
});

describe("luckyDirections", () => {
  it("定位盤・本命一白・子の破のとき", () => {
    // 本命殺=北、本命的殺=南、破=南(子の反対)。一白と相性のよい 3・4・6・7 が入る方位が吉
    expect(luckyDirections(5, 1, 0)).toEqual(["e", "se", "w", "nw"]);
  });

  it("五黄殺・暗剣殺・本命殺・本命的殺・破を除くこと", () => {
    // 中宮が一白の盤: 乾=二黒 兌=三碧 艮=四緑 離=五黄 坎=六白 坤=七赤 震=八白 巽=九紫
    // 五黄殺=南、暗剣殺=北、本命(九紫)殺=南東、本命的殺=北西、午の破=北
    // 残る 西(三碧)・北東(四緑)・南西(七赤)・東(八白) のうち、九紫と相性のよい 2・3・4・8 は 西・北東・東
    expect(luckyDirections(1, 9, 6)).toEqual(["ne", "e", "w"]);
  });
});
