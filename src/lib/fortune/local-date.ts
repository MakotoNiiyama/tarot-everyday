// src/lib/fortune/local-date.ts
/** タイムゾーンを持たない年月日(日本時間の暦日として扱う) */
export interface LocalDate {
  year: number;
  month: number;
  day: number;
}

/** 負の数でも 0〜n-1 を返す剰余 */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidLocalDate(d: LocalDate): boolean {
  if (![d.year, d.month, d.day].every(Number.isInteger)) return false;
  if (d.month < 1 || d.month > 12) return false;
  return d.day >= 1 && d.day <= daysInMonth(d.year, d.month);
}

/** グレゴリオ暦の年月日 → ユリウス日(正午基準の通日) */
export function toJdn({ year, month, day }: LocalDate): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

const JDN_1970_01_01 = 2440588;

export function fromJdn(jdn: number): LocalDate {
  const d = new Date((jdn - JDN_1970_01_01) * 86_400_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function addDays(d: LocalDate, days: number): LocalDate {
  return fromJdn(toJdn(d) + days);
}

/** a が後なら正、同じなら0、前なら負 */
export function compareLocalDate(a: LocalDate, b: LocalDate): number {
  return toJdn(a) - toJdn(b);
}

/** 例: 2026/2/4 */
export function formatSlash(d: LocalDate): string {
  return `${d.year}/${d.month}/${d.day}`;
}
