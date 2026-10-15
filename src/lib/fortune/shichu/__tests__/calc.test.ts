// src/lib/fortune/shichu/__tests__/calc.test.ts
import { describe, it, expect } from "vitest";
import { STEMS, cycleName } from "../../sexagenary";
import { tokyoToUtc } from "../../tokyo-time";
import { elementCounts, hourBoundariesWithin, localMeanTime, sameShichuNatal, shichuNatalAt, zokan } from "../calc";

const date = { year: 1990, month: 3, day: 29 };

describe("zokan(月律分野蔵干)", () => {
  it("節入り日を1日目とする日数で1つに絞ること", () => {
    const name = (branch: number, day: number) => STEMS[zokan(branch, day)];
    expect(name(6, 24)).toBe("丁"); // 午: 丙10・己9・丁
    expect(name(6, 10)).toBe("丙");
    expect(name(6, 11)).toBe("己");
    expect(name(3, 24)).toBe("乙"); // 卯: 甲10・乙
    expect(name(5, 24)).toBe("丙"); // 巳: 戊5・庚9・丙
    expect(name(5, 5)).toBe("戊");
    expect(name(5, 14)).toBe("庚");
    expect(name(7, 24)).toBe("己"); // 未: 丁9・乙3・己
    expect(name(8, 1)).toBe("戊"); // 申の余気は戊
    expect(name(0, 31)).toBe("癸");
  });
});

describe("localMeanTime", () => {
  it("経度135度では日本標準時と同じ壁時計になること", () => {
    const lmt = localMeanTime(tokyoToUtc(1990, 3, 29, 14, 0), 135);
    expect([lmt.getUTCHours(), lmt.getUTCMinutes()]).toEqual([14, 0]);
  });

  it("東京(139.69度)では約19分進むこと", () => {
    const lmt = localMeanTime(tokyoToUtc(1990, 3, 29, 14, 0), 139.69);
    expect([lmt.getUTCHours(), lmt.getUTCMinutes()]).toEqual([14, 18]);
  });
});

describe("shichuNatalAt", () => {
  it("時刻を指定したときは4柱を出すこと(明石基準)", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 14, 30), { lon: 135, hourKnown: true, localDate: date });
    expect([n.year, n.month, n.day].map(cycleName)).toEqual(["庚午", "己卯", "癸巳"]);
    expect(n.hour === null ? null : cycleName(n.hour)).toBe("己未");
    expect(n.dayNumber).toBe(24);
  });

  it("時刻が分からないときは時柱を出さず、日柱は日本時間の暦日で出すこと", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 23, 50), { lon: 141.35, hourKnown: false, localDate: date });
    expect(cycleName(n.day)).toBe("癸巳");
    expect(n.hour).toBeNull();
  });

  it("23時台は日柱をその日のまま、時柱だけ翌日の子の刻にすること", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 23, 30), { lon: 135, hourKnown: true, localDate: date });
    expect(cycleName(n.day)).toBe("癸巳");
    // 翌日 甲午 の子の刻 → 甲子
    expect(n.hour === null ? null : cycleName(n.hour)).toBe("甲子");
  });

  it("経度補正で0時をまたぐと日柱も変わること", () => {
    // 福岡(130.42度)の 0:10 は地方平均時で前日 23:51 → 日柱は前日(3/29)の 癸巳。
    // 23時台なので時柱は翌日(3/30 甲午)の子の刻 → 甲子
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 30, 0, 10), {
      lon: 130.42,
      hourKnown: true,
      localDate: { year: 1990, month: 3, day: 30 },
    });
    expect(cycleName(n.day)).toBe("癸巳");
    expect(n.hour === null ? null : cycleName(n.hour)).toBe("甲子");
  });
});

describe("hourBoundariesWithin", () => {
  it("地方平均時の奇数時ちょうどと0時を、範囲の内側だけ返すこと", () => {
    const range = { start: tokyoToUtc(1990, 3, 29, 14, 0), end: tokyoToUtc(1990, 3, 29, 15, 0) };
    // 東京: 地方平均時 15:00 = 日本時間 14:41 ごろ
    const b = hourBoundariesWithin(range, 139.69);
    expect(b).toHaveLength(1);
    expect(b[0].getTime()).toBeCloseTo(tokyoToUtc(1990, 3, 29, 15, 0).getTime() - 18.76 * 60_000, -3);
    // 明石: 15:00 は範囲の端なので含めない
    expect(hourBoundariesWithin(range, 135)).toEqual([]);
  });

  it("0時(日付の境目)も含めること", () => {
    const range = { start: tokyoToUtc(1990, 3, 29, 23, 0), end: tokyoToUtc(1990, 3, 30, 0, 0) };
    // 札幌(141.35度): 地方平均時 0:00 = 日本時間 23:35 ごろ
    expect(hourBoundariesWithin(range, 141.35)).toHaveLength(1);
  });
});

describe("elementCounts", () => {
  it("天干と地支の五行を数え、時柱がなければ3柱で数えること", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 14, 30), { lon: 135, hourKnown: true, localDate: date });
    // 庚(金) 己(土) 癸(水) 己(土) / 午(火) 卯(木) 巳(火) 未(土)
    expect(elementCounts(n)).toEqual([1, 2, 3, 1, 1]);
    expect(elementCounts({ ...n, hour: null })).toEqual([1, 2, 1, 1, 1]);
  });
});

describe("sameShichuNatal", () => {
  it("4柱と日数がすべて同じときだけ同じとみなすこと", () => {
    const n = shichuNatalAt(tokyoToUtc(1990, 3, 29, 14, 30), { lon: 135, hourKnown: true, localDate: date });
    expect(sameShichuNatal(n, { ...n })).toBe(true);
    expect(sameShichuNatal(n, { ...n, hour: null })).toBe(false);
    expect(sameShichuNatal(n, { ...n, dayNumber: 25 })).toBe(false);
  });
});
