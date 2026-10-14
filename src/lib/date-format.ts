const JA_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** 例: 2026年10月14日 */
export function formatJaDate(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 例: 水曜日 */
export function formatJaWeekday(d: Date): string {
  return `${JA_WEEKDAYS[d.getDay()]}曜日`;
}

/** 例: Wednesday */
export function formatEnWeekday(d: Date): string {
  return EN_WEEKDAYS[d.getDay()];
}
