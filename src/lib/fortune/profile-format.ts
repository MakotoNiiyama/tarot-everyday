// src/lib/fortune/profile-format.ts
import { findPrefecture } from "./prefectures";
import type { BirthProfile, BirthTime } from "./types";

export function formatBirthTime(time: BirthTime): string {
  if (time.kind === "unknown") return "時刻不明";
  if (time.kind === "half") return time.half === "am" ? "午前" : "午後";
  return `${time.hour}時台`;
}

export function formatPrefecture(code: BirthProfile["prefecture"]): string {
  return (code && findPrefecture(code)?.name) || "出生地未入力";
}

export function formatGender(gender: BirthProfile["gender"]): string {
  if (gender === "male") return "男性";
  if (gender === "female") return "女性";
  return "回答なし";
}

/** 例: 1990/3/29 生 · 14時台 · 東京都(出生地未入力なら省く) */
export function formatProfileSummary(profile: BirthProfile): string {
  const { year, month, day } = profile.date;
  const parts = [`${year}/${month}/${day} 生`, formatBirthTime(profile.time)];
  if (profile.prefecture) parts.push(formatPrefecture(profile.prefecture));
  return parts.join(" · ");
}
