// src/lib/fortune/__tests__/daiun.test.ts
import { describe, it, expect } from "vitest";
import { ageOn, daiunAt, daiunPlan } from "../daiun";
import { cycleName, monthCycleIndex, yearCycleIndex } from "../sexagenary";
import { tokyoToUtc } from "../tokyo-time";

describe("daiunPlan", () => {
  it("陰年の女性は順行し、次の節入り日までの日数÷3を四捨五入すること", () => {
    // 1985/12/15 生まれ(乙丑年・戊子月)。次の節入りは 1986/1/6 で 22日 → 7歳運
    const plan = daiunPlan(tokyoToUtc(1985, 12, 15, 12, 0), yearCycleIndex(1985), monthCycleIndex(1985, 10), "female");
    expect(plan).toEqual({ forward: true, startAge: 7, monthCycle: monthCycleIndex(1985, 10) });
  });

  it("陽年の男性は順行、陽年の女性は逆行すること", () => {
    const at = tokyoToUtc(1990, 3, 29, 14, 0); // 庚午年・己卯月。次の節入り 4/5 まで7日、前の節入り 3/6 から23日
    const month = monthCycleIndex(1990, 1);
    expect(daiunPlan(at, yearCycleIndex(1990), month, "male")).toEqual({ forward: true, startAge: 2, monthCycle: month });
    expect(daiunPlan(at, yearCycleIndex(1990), month, "female")).toEqual({ forward: false, startAge: 8, monthCycle: month });
  });

  it("日数が少なくても1歳運、多くても10歳運に収めること", () => {
    // 1990/4/4 は清明(4/5)の前日 → 順行で1日 → 0 を 1 にする
    const plan = daiunPlan(tokyoToUtc(1990, 4, 4, 12, 0), yearCycleIndex(1990), monthCycleIndex(1990, 1), "male");
    expect(plan.startAge).toBe(1);
  });
});

describe("daiunAt", () => {
  const plan = { forward: true, startAge: 2, monthCycle: monthCycleIndex(1990, 1) }; // 己卯

  it("立運前は null", () => {
    expect(daiunAt(plan, 1)).toBeNull();
  });

  it("立運から10年ごとに月柱から1つずつ進むこと", () => {
    expect(daiunAt(plan, 2)).toEqual({ cycle: monthCycleIndex(1990, 1) + 1, fromAge: 2, toAge: 11 });
    const at36 = daiunAt(plan, 36)!;
    expect(cycleName(at36.cycle)).toBe("癸未");
    expect([at36.fromAge, at36.toAge]).toEqual([32, 41]);
  });

  it("逆行は月柱から1つずつ戻ること", () => {
    const back = daiunAt({ ...plan, forward: false, startAge: 8 }, 36)!;
    expect(cycleName(back.cycle)).toBe("丙子");
    expect([back.fromAge, back.toAge]).toEqual([28, 37]);
  });
});

describe("ageOn", () => {
  it("満年齢を返すこと", () => {
    const birth = { year: 1990, month: 3, day: 29 };
    expect(ageOn(birth, { year: 2026, month: 3, day: 28 })).toBe(35);
    expect(ageOn(birth, { year: 2026, month: 3, day: 29 })).toBe(36);
    expect(ageOn(birth, { year: 2026, month: 10, day: 14 })).toBe(36);
  });
});
