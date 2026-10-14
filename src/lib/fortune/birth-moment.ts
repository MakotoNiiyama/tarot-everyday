// src/lib/fortune/birth-moment.ts
import { AKASHI, findPrefecture } from "./prefectures";
import { tokyoToUtc } from "./tokyo-time";
import type { BirthMoment, BirthProfile, BirthTime } from "./types";

/** 入力方式ごとの時の範囲 [開始, 終了)。終了の 24 は翌日0時 */
export function hourRange(time: BirthTime): [number, number] {
  switch (time.kind) {
    case "unknown":
      return [0, 24];
    case "half":
      return time.half === "am" ? [0, 12] : [12, 24];
    case "hour":
      return [time.hour, time.hour + 1];
  }
}

export function toBirthMoment(profile: BirthProfile): BirthMoment {
  const { year, month, day } = profile.date;
  const [h0, h1] = hourRange(profile.time);
  const pref = profile.prefecture ? findPrefecture(profile.prefecture) : undefined;
  return {
    range: {
      start: tokyoToUtc(year, month, day, h0, 0),
      // 終了は「最後の1時間の始まり + 60分」。サマータイムの切り替わる夜でも最後の枠を60分に保つ
      end: new Date(tokyoToUtc(year, month, day, h1 - 1, 0).getTime() + 60 * 60_000),
    },
    location: pref
      ? { lat: pref.lat, lon: pref.lon, label: pref.name, isDefault: false }
      : { ...AKASHI, isDefault: true },
    localDate: { year, month, day },
  };
}
