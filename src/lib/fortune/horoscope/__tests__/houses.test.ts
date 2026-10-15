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

  it.each([
    ["沖縄", { lat: 26.2, lon: 127.68 }],
    ["札幌", { lat: 43.06, lon: 141.35 }],
  ] as const)("%s でも Placidus・Koch のカスプが正しく並ぶこと", (_, place) => {
    const width = (a: number, b: number) => (((b - a) % 360) + 360) % 360;
    for (const system of ["placidus", "koch"] as const) {
      // 1日を3時間ごとに調べる(RAMC が一周する)
      for (let h = 0; h < 24; h += 3) {
        const at = new Date(Date.UTC(1990, 2, 29, h, 0));
        const c = cusps(system, at, place);
        const a = angles(at, place);
        const widths = c.map((v, i) => width(v, c[(i + 1) % 12]));
        for (const w of widths) {
          expect(w).toBeGreaterThan(0);
          expect(w).toBeLessThanOrEqual(90);
        }
        expect(widths.reduce((s, w) => s + w, 0)).toBeCloseTo(360, 9);
        for (let i = 0; i < 6; i++) expect(diff(c[i + 6], c[i] + 180)).toBeLessThan(1e-9);
        expect(diff(c[0], a.asc)).toBeLessThan(1e-9);
        expect(diff(c[9], a.mc)).toBeLessThan(1e-9);
      }
    }
  });

  it("Koch は sinA が ±1 を超える緯度(極圏)でも NaN にしないこと", () => {
    // 緯度が 90 - 黄道傾斜角 を超えると sin(MC)·sin(ε)/cos(緯度) の絶対値が 1 を超えることがある
    for (const lat of [70, -70]) {
      for (let h = 0; h < 24; h += 1) {
        const c = cusps("koch", new Date(Date.UTC(2000, 0, 1, h, 0)), { lat, lon: 0 });
        for (const v of c) expect(Number.isFinite(v)).toBe(true);
      }
    }
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
