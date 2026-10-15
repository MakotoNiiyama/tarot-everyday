// src/lib/fortune/sukuyo/__tests__/sukuyo.test.ts
import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../../birth-moment";
import type { BirthProfile } from "../../types";
import { sukuyo } from "../index";

const today = { year: 2026, month: 10, day: 14 };
const read = (p: BirthProfile) => sukuyo.read(p, toBirthMoment(p), today);
const p: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } };

describe("sukuyo.read 人物像", () => {
  it("本命宿・業宿・胎宿・旧暦の誕生日を返すこと", () => {
    const r = read(p);
    expect(r.id).toBe("sukuyo");
    expect(r.natal).toEqual([
      { key: "honmei", label: "本命宿", value: "畢宿", refs: [{ system: "sukuyo", id: "mansion-2" }] },
      { key: "gyo", label: "業宿", value: "軫宿", refs: [{ system: "sukuyo", id: "mansion-11" }] },
      { key: "tai", label: "胎宿", value: "女宿", refs: [{ system: "sukuyo", id: "mansion-20" }] },
      { key: "lunar-birthday", label: "旧暦の誕生日", value: "3月3日", refs: [] },
    ]);
    expect(r.ambiguous).toBe(false);
  });

  it("閏月は「閏」を付けること", () => {
    const r = read({ ...p, date: { year: 2023, month: 3, day: 22 } });
    expect(r.natal.find((f) => f.key === "lunar-birthday")?.value).toBe("閏2月1日");
    expect(r.natal[0].value).toBe("奎宿");
  });

  it("サマータイム中の0時台は標準時の前日で引くこと", () => {
    // 1949/7/1 0時台(サマータイム)は標準時で 6/30 23時台
    const at0 = read({ version: 1, date: { year: 1949, month: 7, day: 1 }, time: { kind: "hour", hour: 0 } });
    const prev = read({ version: 1, date: { year: 1949, month: 6, day: 30 }, time: { kind: "unknown" } });
    expect(at0.natal[0].value).toBe(prev.natal[0].value);
  });
});

describe("sukuyo.read 運勢", () => {
  it("今日は日の宿と本命宿からの関係", () => {
    const day = read(p).periods.day;
    expect(day.rangeLabel).toBe("2026/10/14");
    expect(day.headline).toEqual({ text: "今日の宿は尾宿。本命宿との関係は「壊」", ref: { system: "sukuyo", id: "relation-kai" } });
    expect(day.chips.map((c) => [c.key, c.label, c.value])).toEqual([
      ["mansion", "今日の宿", "尾宿"],
      ["relation", "本命宿との関係", "壊"],
    ]);
  });

  it("今月は旧暦の月の宿", () => {
    const month = read(p).periods.month;
    expect(month.rangeLabel).toBe("2026/10/11〜2026/11/8");
    expect(month.headline.text).toBe("今月は氐宿の月。本命宿との関係は「安」");
    expect(month.chips.map((c) => c.value)).toEqual(["氐宿", "安"]);
  });

  it("今年は旧暦の年の宿で、関係は年の宿から数えること", () => {
    const year = read(p).periods.year;
    expect(year.rangeLabel).toBe("2026/2/17〜2027/2/6");
    expect(year.headline).toEqual({ text: "今年は星宿の年。本命宿との関係は「安」", ref: { system: "sukuyo", id: "relation-an" } });
    expect(year.chips.map((c) => [c.label, c.value])).toEqual([
      ["今年の宿", "星宿"],
      ["本命宿との関係", "安"],
    ]);
  });

  it("旧正月の前は前の年の宿", () => {
    const r = sukuyo.read(p, toBirthMoment(p), { year: 2026, month: 2, day: 16 });
    expect(r.periods.year.chips[0].value).toBe("柳宿"); // 2025年 = (19 + 14) mod 27 = 6
    expect(r.periods.year.rangeLabel).toBe("2025/1/29〜2026/2/16");
  });
});
