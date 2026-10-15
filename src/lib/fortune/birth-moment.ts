// src/lib/fortune/birth-moment.ts
import { AKASHI, findPrefecture } from "./prefectures";
import { tokyoToUtc } from "./tokyo-time";
import type { BirthMoment, BirthProfile, BirthTime, TimeRange } from "./types";

/** 時刻を指定した入力(分まで、または分不明の時台) */
export type KnownBirthTime = Extract<BirthTime, { kind: "hour" | "minute" }>;

/** 時刻を指定したか(時柱・標準時の日付・ASC などを時刻で計算するか) */
export function isTimeKnown(time: BirthTime): time is KnownBirthTime {
  return time.kind === "hour" || time.kind === "minute";
}

/** 計算に使う日本時間の時刻。分が不明(時台)のときはその時の30分とする */
export function knownTime(time: KnownBirthTime): { hour: number; minute: number } {
  return time.kind === "minute" ? { hour: time.hour, minute: time.minute } : { hour: time.hour, minute: 30 };
}

/** 時刻が不明・午前午後のときの時の範囲 [開始, 終了)。終了の 24 は翌日0時 */
export function hourRange(time: Exclude<BirthTime, KnownBirthTime>): [number, number] {
  if (time.kind === "unknown") return [0, 24];
  return time.half === "am" ? [0, 12] : [12, 24];
}

const MINUTE = 60_000;

function birthRange(profile: BirthProfile): TimeRange {
  const { year, month, day } = profile.date;
  const { time } = profile;
  if (isTimeKnown(time)) {
    // 時刻を指定したときはその1分 [HH:MM, HH:MM+1分)
    const { hour, minute } = knownTime(time);
    const start = tokyoToUtc(year, month, day, hour, minute);
    return { start, end: new Date(start.getTime() + MINUTE) };
  }
  const [h0, h1] = hourRange(time);
  return {
    start: tokyoToUtc(year, month, day, h0, 0),
    // 終了は「最後の1時間の始まり + 60分」。サマータイムの切り替わる夜でも最後の枠を60分に保つ
    end: new Date(tokyoToUtc(year, month, day, h1 - 1, 0).getTime() + 60 * MINUTE),
  };
}

export function toBirthMoment(profile: BirthProfile): BirthMoment {
  const { year, month, day } = profile.date;
  const pref = profile.prefecture ? findPrefecture(profile.prefecture) : undefined;
  return {
    range: birthRange(profile),
    location: pref
      ? { lat: pref.lat, lon: pref.lon, label: pref.name, isDefault: false }
      : { ...AKASHI, isDefault: true },
    localDate: { year, month, day },
  };
}
