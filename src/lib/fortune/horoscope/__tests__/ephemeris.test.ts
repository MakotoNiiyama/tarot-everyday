import { describe, it, expect } from "vitest";
import { bodyPosition, chironLongitude } from "../ephemeris";
import { BODIES, formatDegree, signOf } from "../zodiac";

const birth = new Date(Date.UTC(1990, 2, 29, 5, 0));
const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0));

/** 360度の折り返しを考えた差 */
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("bodyPosition(Swiss Ephemeris との比較)", () => {
  it.each([
    ["sun", 8.24777, 0.02],
    ["moon", 41.61299, 0.03],
    ["mercury", 18.52027, 0.02],
    ["venus", 321.79518, 0.02],
    ["mars", 313.03284, 0.02],
    ["jupiter", 92.47263, 0.02],
    ["saturn", 294.25338, 0.02],
    ["uranus", 279.48349, 0.02],
    ["neptune", 284.4821, 0.02],
    ["pluto", 227.38624, 0.05],
    ["node", 315.05188, 0.05],
    ["lilith", 226.17984, 0.05],
    ["chiron", 100.71488, 0.02],
  ] as const)("1990-03-29 05:00 UT の %s は %f 度", (body, expected, tolerance) => {
    expect(diff(bodyPosition(body, birth)!.lon, expected)).toBeLessThan(tolerance);
  });

  it("冥王星とドラゴンヘッドは逆行、太陽は順行", () => {
    expect(bodyPosition("pluto", birth)!.retrograde).toBe(true);
    expect(bodyPosition("node", birth)!.retrograde).toBe(true);
    expect(bodyPosition("sun", birth)!.retrograde).toBe(false);
  });

  it.each([
    ["sun", 280.36892],
    ["moon", 223.32375],
    ["mars", 327.9633],
    ["jupiter", 25.25309],
    ["chiron", 251.6175],
  ] as const)("2000-01-01 12:00 UT の %s は %f 度", (body, expected) => {
    expect(diff(bodyPosition(body, j2000)!.lon, expected)).toBeLessThan(0.03);
  });

  it("キロンは表の範囲外なら null", () => {
    expect(chironLongitude(new Date(Date.UTC(1899, 0, 1)))).toBeNull();
    expect(chironLongitude(new Date(Date.UTC(2101, 0, 1)))).toBeNull();
    expect(bodyPosition("chiron", new Date(Date.UTC(2101, 0, 1)))).toBeNull();
  });

  it("BODIES は13天体", () => {
    expect(BODIES.map((b) => b.key)).toEqual([
      "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron", "lilith",
    ]);
  });
});

describe("zodiac", () => {
  it("星座と度数の表記", () => {
    expect(signOf(8.24777)).toBe(0);
    expect(signOf(359.99)).toBe(11);
    expect(formatDegree(8.24777)).toBe("8°14′");
    expect(formatDegree(41.61299)).toBe("11°36′");
    expect(formatDegree(29.9999)).toBe("29°59′");
  });
});
