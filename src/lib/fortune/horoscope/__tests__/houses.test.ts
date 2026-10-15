import { describe, it, expect } from "vitest";
import { angles, cusps, houseOf } from "../houses";

const birth = new Date(Date.UTC(1990, 2, 29, 5, 0));
const tokyo = { lat: 35.69, lon: 139.69 };
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe("angles", () => {
  it("ASC と MC(Swiss Ephemeris との比較)", () => {
    const a = angles(birth, tokyo);
    expect(diff(a.asc, 139.65546)).toBeLessThan(0.05);
    expect(diff(a.mc, 43.48916)).toBeLessThan(0.05);
  });
});

describe("cusps", () => {
  it.each([
    ["placidus", [162.92729, 190.87885, 77.9672, 110.53274]],
    ["koch", [167.51863, 195.68153, 81.81378, 111.91252]],
  ] as const)("%s の2・3・11・12室", (system, [c2, c3, c11, c12]) => {
    const c = cusps(system, birth, tokyo);
    expect(c).toHaveLength(12);
    expect(diff(c[0], 139.65546)).toBeLessThan(0.05);
    expect(diff(c[9], 43.48916)).toBeLessThan(0.05);
    expect(diff(c[1], c2)).toBeLessThan(0.05);
    expect(diff(c[2], c3)).toBeLessThan(0.05);
    expect(diff(c[10], c11)).toBeLessThan(0.05);
    expect(diff(c[11], c12)).toBeLessThan(0.05);
    for (let i = 0; i < 6; i++) expect(diff(c[i + 6], c[i] + 180)).toBeLessThan(1e-9);
  });

  it("ホールサインは ASC の星座の0度から30度ずつ", () => {
    expect(cusps("whole", birth, tokyo)).toEqual([120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90]);
  });
});

describe("houseOf", () => {
  it("カスプの間にある天体のハウス(1始まり)", () => {
    const c = cusps("placidus", birth, tokyo);
    expect(houseOf(8.24777, c)).toBe(8); // 太陽
    expect(houseOf(41.61299, c)).toBe(9); // 月
    expect(houseOf(139.7, c)).toBe(1);
    expect(houseOf(139.6, c)).toBe(12);
  });
});
