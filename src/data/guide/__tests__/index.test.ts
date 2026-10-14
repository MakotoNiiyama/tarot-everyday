import { describe, it, expect } from "vitest";
import { composeHeadline, getGuideEntry, guideHref, guideSystems, searchGuide } from "../index";
import type { PeriodResult } from "@/lib/fortune/types";

describe("guideSystems", () => {
  it("タブの順は タロット・数秘術・九星気学・マヤ暦", () => {
    expect(guideSystems.map((s) => [s.id, s.label])).toEqual([
      ["tarot", "タロット"],
      ["numerology", "数秘術"],
      ["kyusei", "九星気学"],
      ["maya", "マヤ暦"],
    ]);
  });

  it("グループの順と項目数", () => {
    const byId = Object.fromEntries(guideSystems.map((s) => [s.id, s]));
    expect(byId.tarot.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["大アルカナ", 22],
      ["ワンド", 14],
      ["カップ", 14],
      ["ソード", 14],
      ["ペンタクル", 14],
    ]);
    expect(byId.numerology.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["ルートナンバー", 9],
      ["マスターナンバー", 3],
    ]);
    expect(byId.kyusei.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["九星", 9],
      ["宮", 9],
      ["方位", 8],
    ]);
    expect(byId.maya.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["太陽の紋章", 20],
      ["銀河の音", 13],
      ["13の月", 14],
    ]);
  });
});

describe("getGuideEntry / guideHref", () => {
  it("占術と id から項目を引けること", () => {
    expect(getGuideEntry("kyusei", "star-1")?.name).toBe("一白水星");
    expect(getGuideEntry("tarot", "major-00")?.name).toBe("愚者");
    expect(getGuideEntry("maya", "seal-99")).toBeUndefined();
  });

  it("リンク先", () => {
    expect(guideHref("maya", "seal-14")).toBe("/guide/maya/seal-14");
    expect(guideHref("tarot", "major-00")).toBe("/guide/tarot/major-00");
  });
});

describe("searchGuide", () => {
  it("名前・読み・英名・キーワードで全占術を横断して検索できること", () => {
    expect(searchGuide("一白").map((e) => e.id)).toContain("star-1");
    expect(searchGuide("いっぱく").map((e) => e.id)).toContain("star-1");
    expect(searchGuide("wizard").map((e) => e.id)).toContain("seal-14");
    expect(searchGuide("愚者").map((e) => e.id)).toContain("major-00");
    expect(searchGuide("Fool").map((e) => e.id)).toContain("major-00");
  });

  it("カタカナでひらがなの読みに一致すること", () => {
    expect(searchGuide("イッパク").map((e) => e.id)).toContain("star-1");
  });

  it("全角英字・半角カナも正規化して一致すること", () => {
    expect(searchGuide("Ｆｏｏｌ").map((e) => e.id)).toContain("major-00");
    expect(searchGuide("ｲｯﾊﾟｸ").map((e) => e.id)).toContain("star-1");
  });

  it("空白で区切った語をすべて含む項目だけを返すこと", () => {
    expect(searchGuide("一白 水星").map((e) => e.id)).toEqual(["star-1"]);
    expect(searchGuide("一白　水星").map((e) => e.id)).toEqual(["star-1"]);
    expect(searchGuide("一白 存在しない言葉")).toEqual([]);
  });

  it("空の検索語は空の結果", () => {
    expect(searchGuide("  ")).toEqual([]);
  });
});

describe("composeHeadline", () => {
  const result: PeriodResult = {
    period: "day",
    rangeLabel: "2026/10/14",
    headline: { text: "パーソナルデー7", ref: { system: "numerology", id: "number-7" } },
    chips: [],
  };

  it("見出しの文と、参照先の periodNote をつなげること", () => {
    const note = getGuideEntry("numerology", "number-7")?.periodNote;
    expect(composeHeadline(result)).toBe(`パーソナルデー7。${note}`);
  });

  it("見出し({ text, ref })だけを渡しても組み立てられること", () => {
    const note = getGuideEntry("numerology", "number-7")?.periodNote;
    expect(composeHeadline(result.headline)).toBe(`パーソナルデー7。${note}`);
  });

  it("見出しの文の末尾の「。」を重ねないこと", () => {
    const note = getGuideEntry("numerology", "number-7")?.periodNote;
    expect(composeHeadline({ text: "パーソナルデー7。", ref: result.headline.ref })).toBe(`パーソナルデー7。${note}`);
    expect(composeHeadline({ text: "X。", ref: { system: "numerology", id: "nothing" } })).toBe("X。");
  });

  it("参照先が見つからなければ見出しの文だけ", () => {
    expect(composeHeadline({ ...result, headline: { text: "X", ref: { system: "numerology", id: "nothing" } } })).toBe("X。");
  });
});
