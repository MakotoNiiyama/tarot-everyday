import {
  Body,
  GeoMoon,
  GeoMoonState,
  GeoVector,
  Rotation_EQJ_ECT,
  RotateVector,
  SphereFromVector,
  MakeTime,
  Vector,
} from "astronomy-engine";
import { mod } from "../local-date";
import { CHIRON_MILLIDEG, CHIRON_START_JD, CHIRON_STEP_DAYS } from "./chiron-table";
import type { BodyKey } from "./zodiac";

const PLANETS: Partial<Record<BodyKey, Body>> = {
  sun: Body.Sun,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

/** J2000 赤道座標のベクトルを、その日の真の黄道座標の黄経(度)にする */
function eclipticLongitudeOfDate(vec: Vector, at: Date): number {
  return SphereFromVector(RotateVector(Rotation_EQJ_ECT(at), vec)).lon;
}

/** 真のドラゴンヘッド: 月の位置と速度から求めた接触軌道の昇交点 */
function trueNode(at: Date): number {
  const state = GeoMoonState(at);
  const rot = Rotation_EQJ_ECT(at);
  const r = RotateVector(rot, new Vector(state.x, state.y, state.z, state.t));
  const v = RotateVector(rot, new Vector(state.vx, state.vy, state.vz, state.t));
  // 角運動量 h = r × v。昇交点の方向は z 軸 × h = (-hy, hx)
  const hx = r.y * v.z - r.z * v.y;
  const hy = r.z * v.x - r.x * v.z;
  return mod((Math.atan2(hx, -hy) * 180) / Math.PI, 360);
}

/** 平均リリス(月の平均遠地点)。Meeus『Astronomical Algorithms』47章の月の平均近地点 + 180度 */
function meanLilith(at: Date): number {
  const T = MakeTime(at).tt / 36525;
  return mod(263.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + T ** 4 / 18999000, 360);
}

/** キロンの黄経(表の4点ラグランジュ補間)。表の範囲外は null */
export function chironLongitude(at: Date): number | null {
  const jd = at.getTime() / 86_400_000 + 2440587.5;
  const x = (jd - CHIRON_START_JD) / CHIRON_STEP_DAYS;
  const i = Math.floor(x) - 1;
  if (i < 0 || i + 3 >= CHIRON_MILLIDEG.length) return null;
  // 360度の折り返しをまたがないように、最初の点の近くへそろえる
  const base = CHIRON_MILLIDEG[i] / 1000;
  const ys = [0, 1, 2, 3].map((k) => base + (((CHIRON_MILLIDEG[i + k] / 1000 - base + 540) % 360) - 180));
  const t = x - i;
  let sum = 0;
  for (let k = 0; k < 4; k++) {
    let w = 1;
    for (let m = 0; m < 4; m++) if (m !== k) w *= (t - m) / (k - m);
    sum += w * ys[k];
  }
  return mod(sum, 360);
}

function longitudeAt(body: BodyKey, at: Date): number | null {
  if (body === "moon") return eclipticLongitudeOfDate(GeoMoon(at), at);
  if (body === "node") return trueNode(at);
  if (body === "lilith") return meanLilith(at);
  if (body === "chiron") return chironLongitude(at);
  return eclipticLongitudeOfDate(GeoVector(PLANETS[body]!, at, true), at);
}

export interface BodyPosition {
  /** 黄経(度) */
  lon: number;
  /** 1日あたりの黄経の変化がマイナス */
  retrograde: boolean;
}

/** 天体の視黄経(その日の真の黄道)と逆行。キロンが表の範囲外なら null */
export function bodyPosition(body: BodyKey, at: Date): BodyPosition | null {
  const lon = longitudeAt(body, at);
  if (lon === null) return null;
  const before = longitudeAt(body, new Date(at.getTime() - 43_200_000));
  const after = longitudeAt(body, new Date(at.getTime() + 43_200_000));
  if (before === null || after === null) return null;
  const speed = ((after - before + 540) % 360) - 180;
  return { lon, retrograde: speed < 0 };
}
