import { MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import { mod } from "../local-date";

export type HouseSystem = "placidus" | "koch" | "whole";
export const HOUSE_SYSTEMS: readonly HouseSystem[] = ["placidus", "koch", "whole"];
export const HOUSE_SYSTEM_NAMES: Record<HouseSystem, string> = { placidus: "プラシーダス", koch: "コッホ", whole: "ホールサイン" };

export interface Place {
  /** 緯度(度、北がプラス) */
  lat: number;
  /** 経度(度、東がプラス) */
  lon: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

interface Sky {
  /** 地方恒星時(度) */
  ramc: number;
  /** 真の黄道傾斜角(度) */
  eps: number;
  /** 緯度(度) */
  lat: number;
}

function skyAt(at: Date, place: Place): Sky {
  return { ramc: mod(SiderealTime(at) * 15 + place.lon, 360), eps: e_tilt(MakeTime(at)).tobl, lat: place.lat };
}

/** 東の地平線の赤経が x 度のときに昇る黄経(x = RAMC + 90 で ASC。swehouse.c の Asc1 と同じ) */
function ascendantFor(x: number, sky: Sky): number {
  return mod(
    deg(Math.atan2(Math.sin(rad(x)), Math.cos(rad(x)) * Math.cos(rad(sky.eps)) - Math.tan(rad(sky.lat)) * Math.sin(rad(sky.eps)))),
    360,
  );
}

/** 赤経 ra(度)の黄道上の点の黄経 */
const eclipticOfRa = (ra: number, sky: Sky) =>
  mod(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(sky.eps)) * Math.cos(rad(ra)))), 360);

export function angles(at: Date, place: Place): { asc: number; mc: number } {
  const sky = skyAt(at, place);
  return { asc: ascendantFor(sky.ramc + 90, sky), mc: eclipticOfRa(sky.ramc, sky) };
}

/** Placidus の中間カスプ。fraction は半昼弧(above)または半夜弧を何分割した位置か */
function placidusCusp(sky: Sky, above: boolean, fraction: number): number {
  const tanEps = Math.tan(rad(sky.eps));
  const tanLat = Math.tan(rad(sky.lat));
  // 初期値: 11室 RAMC + 30、12室 RAMC + 60、2室 RAMC + 120、3室 RAMC + 150(反復で収束する)
  let ra = sky.ramc + (above ? (fraction < 0.5 ? 30 : 60) : fraction < 0.5 ? 150 : 120);
  for (let i = 0; i < 50; i++) {
    const tanDec = tanEps * Math.sin(rad(ra));
    const next = above
      ? sky.ramc + deg(Math.acos(Math.max(-1, Math.min(1, -tanLat * tanDec)))) * fraction
      : sky.ramc + 180 - deg(Math.acos(Math.max(-1, Math.min(1, tanLat * tanDec)))) * fraction;
    if (Math.abs(next - ra) < 1e-9) {
      ra = next;
      break;
    }
    ra = next;
  }
  return eclipticOfRa(ra, sky);
}

/** 12室のカスプ(黄経、1室から順に)。7〜12室は1〜6室の反対側 */
export function cusps(system: HouseSystem, at: Date, place: Place): number[] {
  const sky = skyAt(at, place);
  const asc = ascendantFor(sky.ramc + 90, sky);
  const mc = eclipticOfRa(sky.ramc, sky);
  if (system === "whole") {
    const first = Math.floor(asc / 30) * 30;
    return Array.from({ length: 12 }, (_, i) => mod(first + i * 30, 360));
  }
  let c11: number, c12: number, c2: number, c3: number;
  if (system === "placidus") {
    c11 = placidusCusp(sky, true, 1 / 3);
    c12 = placidusCusp(sky, true, 2 / 3);
    c2 = placidusCusp(sky, false, 2 / 3);
    c3 = placidusCusp(sky, false, 1 / 3);
  } else {
    // Koch(Swiss Ephemeris の swehouse.c と同じ式)
    const sinA = Math.min(1, (Math.sin(rad(mc)) * Math.sin(rad(sky.eps))) / Math.cos(rad(sky.lat)));
    const cosA = Math.sqrt(1 - sinA * sinA);
    const c = deg(Math.atan(Math.tan(rad(sky.lat)) / cosA));
    const ad3 = deg(Math.asin(Math.sin(rad(c)) * sinA)) / 3;
    c11 = ascendantFor(sky.ramc + 30 - 2 * ad3, sky);
    c12 = ascendantFor(sky.ramc + 60 - ad3, sky);
    c2 = ascendantFor(sky.ramc + 120 + ad3, sky);
    c3 = ascendantFor(sky.ramc + 150 + 2 * ad3, sky);
  }
  const first = [asc, c2, c3, mod(mc + 180, 360), mod(c11 + 180, 360), mod(c12 + 180, 360)];
  return [...first, ...first.map((v) => mod(v + 180, 360))];
}

/** 黄経 lon が入るハウス(1〜12) */
export function houseOf(lon: number, cuspList: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cuspList[i];
    const width = mod(cuspList[(i + 1) % 12] - start, 360);
    if (mod(lon - start, 360) < width) return i + 1;
  }
  return 12;
}
