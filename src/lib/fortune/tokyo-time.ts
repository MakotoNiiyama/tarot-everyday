// src/lib/fortune/tokyo-time.ts
import type { LocalDate } from "./local-date";

/**
 * 日本時間(Asia/Tokyo)と UTC の変換。
 * Intl のタイムゾーンデータを使うので、1948〜1951年のサマータイム(UTC+10)も正しく扱える。
 */
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
  timeZoneName: "shortOffset",
});

export interface TokyoParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** UTC からのずれ(分)。通常 540、サマータイム中は 600 */
  offsetMinutes: number;
}

export function tokyoParts(at: Date): TokyoParts {
  const parts = Object.fromEntries(formatter.formatToParts(at).map((p) => [p.type, p.value]));
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(parts.timeZoneName ?? "");
  const hours = match ? Number(match[1]) : 9;
  const minutes = match?.[2] ? Number(match[2]) : 0;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    offsetMinutes: hours * 60 + Math.sign(hours) * minutes,
  };
}

/** 日本時間の壁時計の時刻 → UTC の瞬間。hour は 24(翌日0時)まで受け付ける */
export function tokyoToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const guess = naive - 9 * 3_600_000;
  const offset = tokyoParts(new Date(guess)).offsetMinutes;
  return new Date(naive - offset * 60_000);
}

export function jstLocalDate(at: Date): LocalDate {
  const p = tokyoParts(at);
  return { year: p.year, month: p.month, day: p.day };
}

/** 標準時(UTC+9 固定。サマータイムは1時間戻す)の暦日 */
export function standardDate(at: Date): LocalDate {
  const t = new Date(at.getTime() + 9 * 3_600_000);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

/** 例: 5:01 */
export function formatTokyoHm(at: Date): string {
  const p = tokyoParts(at);
  return `${p.hour}:${String(p.minute).padStart(2, "0")}`;
}

/** 日本時間の「今日」 */
export function todayInTokyo(now: Date = new Date()): LocalDate {
  return jstLocalDate(now);
}
