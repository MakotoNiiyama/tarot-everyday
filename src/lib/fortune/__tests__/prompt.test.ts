// src/lib/fortune/__tests__/prompt.test.ts
import { describe, it, expect } from "vitest";
import { generateFortunePrompt } from "../prompt";
import { readAll } from "../registry";
import { getCardById } from "@/data/cards";
import type { BirthProfile } from "../types";

const today = { year: 2026, month: 10, day: 14 };
const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };

describe("generateFortunePrompt", () => {
  const readings = readAll(profile, today);
  const prompt = generateFortunePrompt({
    profile,
    readings,
    period: "day",
    today,
    question: "",
    tarot: { card: getCardById("major-17")!, isReversed: false },
  });

  it("設計書 §8 の見出しと順番で構成すること", () => {
    const order = ["■ 生年月日", "■ 鑑定日", "■ 相談内容", "── 人物像 ──", "── 今日の運勢 ──", "── 今日の1dayタロット ──", "── 採用している方式 ──", "── 依頼 ──"];
    const positions = order.map((h) => prompt.indexOf(h));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("基本情報と相談内容(未入力)", () => {
    expect(prompt).toContain("■ 生年月日: 1990年3月29日 / 出生時刻: 14時台(14:30として計算) / 出生地: 東京都 / 性別: 回答なし");
    expect(prompt).toContain("■ 鑑定日: 2026年10月14日 / 対象期間: 今日");
    expect(prompt).toContain("■ 相談内容: 特になし(総合的な鑑定)");
  });

  it("各占術の人物像・運勢・方式を含むこと", () => {
    for (const r of readings) {
      expect(prompt).toContain(`【${r.name}】`);
      expect(prompt).toContain(r.method);
      expect(prompt).toContain(r.periods.day.rangeLabel);
    }
    expect(prompt).toContain("ライフパス: 33");
  });

  it("午前・午後で入力した出生時刻は時刻の範囲も書くこと", () => {
    const am: BirthProfile = { ...profile, time: { kind: "half", half: "am" } };
    const pm: BirthProfile = { ...profile, time: { kind: "half", half: "pm" } };
    const gen = (p: BirthProfile) => generateFortunePrompt({ profile: p, readings: readAll(p, today), period: "day", today, question: "", tarot: null });
    expect(gen(am)).toContain("出生時刻: 午前(0:00〜11:59) /");
    expect(gen(pm)).toContain("出生時刻: 午後(12:00〜23:59) /");
  });

  it("西洋占星術で出生時刻を仮に置いたときは、その印と注記をプロンプトにも書くこと", () => {
    const unknown: BirthProfile = { ...profile, time: { kind: "unknown" } };
    const gen = (period: "day" | "year") =>
      generateFortunePrompt({ profile: unknown, readings: readAll(unknown, today), period, today, question: "", tarot: null });
    const natalLine = gen("day").split("\n").find((l) => l.startsWith("【西洋占星術】"))!;
    expect(natalLine).toMatch(/ASC: [^ ]+座\(仮\) \/ MC: [^ ]+座\(仮\)/);
    expect(natalLine).toContain("天体の位置: 出生時刻不明のため正午で仮計算: 太陽 ");
    expect(gen("day")).toContain("注記: ハウスは出生時刻不明のため正午で仮計算");
    expect(gen("year")).toContain("注記: ハウスは出生時刻不明のため正午で仮計算");
    // 分不明の時台は 30分で計算した印を付ける
    expect(prompt).toContain("ASC: 獅子座(仮)");
    expect(prompt).toContain("注記: ハウスは分が不明のため14時30分で計算");
  });

  it("分まで指定した出生時刻はその時刻を書き、仮の印を付けないこと", () => {
    const minute: BirthProfile = { ...profile, time: { kind: "minute", hour: 14, minute: 35 } };
    const p = generateFortunePrompt({ profile: minute, readings: readAll(minute, today), period: "day", today, question: "", tarot: null });
    expect(p).toContain("■ 生年月日: 1990年3月29日 / 出生時刻: 14:35 / 出生地: 東京都");
    expect(p).not.toContain("(仮)");
    const early: BirthProfile = { ...profile, time: { kind: "minute", hour: 9, minute: 5 } };
    expect(generateFortunePrompt({ profile: early, readings: readAll(early, today), period: "day", today, question: "", tarot: null })).toContain(
      "出生時刻: 9:05 /",
    );
  });

  it("1dayタロットの結果", () => {
    expect(prompt).toContain("星(正位置) キーワード:");
  });

  it("相談内容・未抽選・期間の切り替え", () => {
    const p = generateFortunePrompt({ profile, readings, period: "year", today, question: "転職すべき?", tarot: null });
    expect(p).toContain("■ 相談内容: 転職すべき?");
    expect(p).toContain("── 今年の運勢 ──");
    expect(p).toContain("対象期間: 今年");
    expect(p).toContain("未抽選");
  });

  it("候補がある項目は「A または B(出生時刻が曖昧なため候補)」と書くこと", () => {
    const amb: BirthProfile = { version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } };
    const p = generateFortunePrompt({ profile: amb, readings: readAll(amb, today), period: "day", today, question: "", tarot: null });
    expect(p).toContain("本命星: 二黒土星 または 一白水星(出生時刻が曖昧なため候補)");
    expect(p).toContain("出生地: 未入力(明石を基準に計算)");
  });

  it("絵文字を含まないこと", () => {
    expect(prompt).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
