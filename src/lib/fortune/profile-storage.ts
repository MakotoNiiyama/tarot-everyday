"use client";

// src/lib/fortune/profile-storage.ts
import { useSyncExternalStore } from "react";
import { isValidLocalDate, type LocalDate } from "./local-date";
import { isPrefectureCode } from "./prefectures";
import { todayInTokyo } from "./tokyo-time";
import type { BirthProfile, BirthTime } from "./types";

export const BIRTH_PROFILE_STORAGE_KEY = "tarot-birth-profile";
const MIN_YEAR = 1900;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseDate(v: unknown): LocalDate | null {
  if (!isRecord(v)) return null;
  const d = { year: v.year, month: v.month, day: v.day } as LocalDate;
  if (!isValidLocalDate(d) || d.year < MIN_YEAR) return null;
  const today = todayInTokyo();
  const isFuture =
    d.year > today.year ||
    (d.year === today.year && (d.month > today.month || (d.month === today.month && d.day > today.day)));
  return isFuture ? null : d;
}

function parseTime(v: unknown): BirthTime | null {
  if (!isRecord(v)) return null;
  if (v.kind === "unknown") return { kind: "unknown" };
  if (v.kind === "half" && (v.half === "am" || v.half === "pm")) return { kind: "half", half: v.half };
  if (v.kind === "hour" && Number.isInteger(v.hour) && (v.hour as number) >= 0 && (v.hour as number) <= 23) {
    return { kind: "hour", hour: v.hour as number };
  }
  return null;
}

/** 保存された文字列を検証してプロフィールにする。不正なら null */
export function parseBirthProfile(raw: string | null): BirthProfile | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1) return null;
  const date = parseDate(data.date);
  const time = parseTime(data.time);
  if (!date || !time) return null;
  if (data.prefecture !== undefined && !isPrefectureCode(data.prefecture)) return null;
  if (data.gender !== undefined && data.gender !== "male" && data.gender !== "female") return null;

  const profile: BirthProfile = { version: 1, date, time };
  if (data.prefecture !== undefined) profile.prefecture = data.prefecture as BirthProfile["prefecture"];
  if (data.gender !== undefined) profile.gender = data.gender as BirthProfile["gender"];
  return profile;
}

const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheValue: BirthProfile | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(BIRTH_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 文字列が変わらない限り同じ参照を返す(useSyncExternalStore の要件) */
function getSnapshot(): BirthProfile | null {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheValue = parseBirthProfile(raw);
  }
  return cacheValue;
}

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 保存できたら true。プロフィールが不正、または localStorage が使えない環境では false */
export function saveBirthProfile(profile: BirthProfile): boolean {
  // 読み込み時と同じ検証を通るものだけを保存する(保存したのに読めない状態を作らない)
  const raw = JSON.stringify(profile);
  if (!parseBirthProfile(raw)) return false;
  try {
    localStorage.setItem(BIRTH_PROFILE_STORAGE_KEY, raw);
    notify();
    return true;
  } catch {
    return false;
  }
}

export function clearBirthProfile(): void {
  try {
    localStorage.removeItem(BIRTH_PROFILE_STORAGE_KEY);
  } catch {
    // 保存できない環境では何もしない
  }
  notify();
}

const subscribeNoop = () => () => {};

/** 登録済みプロフィール。ready はクライアントで読み込み終えたか */
export function useBirthProfile(): { ready: boolean; profile: BirthProfile | null } {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const profile = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return { ready, profile };
}
