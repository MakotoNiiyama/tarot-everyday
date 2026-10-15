import { describe, it, expect } from "vitest";
import {
  MAYA_GLYPH_CREDIT,
  composeHeadline,
  getGuideEntry,
  guideHref,
  guidePhotos,
  guideSystems,
  mayaGlyphSources,
  searchGuide,
} from "../index";
import type { PeriodResult } from "@/lib/fortune/types";

describe("guideSystems", () => {
  it("タブの順は タロット・数秘術・九星気学・マヤ暦・四柱推命・算命学・宿曜・西洋占星術", () => {
    expect(guideSystems.map((s) => [s.id, s.label])).toEqual([
      ["tarot", "タロット"],
      ["numerology", "数秘術"],
      ["kyusei", "九星気学"],
      ["maya", "マヤ暦"],
      ["shichu", "四柱推命"],
      ["sanmei", "算命学"],
      ["sukuyo", "宿曜"],
      ["horoscope", "西洋占星術"],
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
      ["黒KIN", 1],
    ]);
    expect(byId.shichu.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["十干", 10],
      ["十二支", 12],
      ["通変星", 10],
      ["十二運", 12],
      ["五行", 5],
    ]);
    expect(byId.sanmei.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["十大主星", 10],
      ["十二大従星", 12],
      ["天中殺", 6],
      ["宿命中殺", 5],
      ["異常干支", 13],
      ["位相法", 7],
    ]);
    expect(byId.sukuyo.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["二十七宿", 27],
      ["三九の関係", 11],
    ]);
    expect(byId.horoscope.groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["十二星座", 12],
      ["天体", 13],
      ["ハウス", 12],
      ["アスペクト", 11],
      ["エレメント", 4],
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
  it("四柱推命・算命学の項目も読みで検索できること", () => {
    expect(searchGuide("きのえ").map((e) => `${e.system}:${e.id}`)).toContain("shichu:stem-1");
    expect(searchGuide("てんちゅうさつ").filter((e) => e.system === "sanmei")).toHaveLength(6);
    expect(searchGuide("ひつしゅく").map((e) => `${e.system}:${e.id}`)).toContain("sukuyo:mansion-2");
    expect(searchGuide("おひつじざ").map((e) => `${e.system}:${e.id}`)).toContain("horoscope:sign-aries");
  });

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

describe("guidePhotos(早見表の画像)", () => {
  it("34件すべてが実在する項目を指し、重複しないこと", () => {
    expect(guidePhotos).toHaveLength(34);
    expect(new Set(guidePhotos.map((p) => `${p.system}:${p.id}`)).size).toBe(34);
    for (const p of guidePhotos) expect(getGuideEntry(p.system, p.id), `${p.system}:${p.id}`).toBeDefined();
  });

  it("十二星座・太陽〜冥王星・十二支に付き、ドラゴンヘッド・キロン・リリスには付かないこと", () => {
    const ids = (system: string) => guidePhotos.filter((p) => p.system === system).map((p) => p.id);
    expect(ids("horoscope").filter((id) => id.startsWith("sign-"))).toHaveLength(12);
    expect(ids("horoscope").filter((id) => id.startsWith("body-"))).toHaveLength(10);
    expect(ids("shichu")).toEqual(Array.from({ length: 12 }, (_, i) => `branch-${i + 1}`));
    for (const id of ["body-node", "body-chiron", "body-lilith"]) expect(getGuideEntry("horoscope", id)?.photo).toBeUndefined();
  });

  it("項目に path・alt・出典・切り抜きの位置が付き、path は system と id から決まること", () => {
    for (const p of guidePhotos) {
      expect(p.path).toBe(`/guide-images/${p.system}/${p.id}.jpg`);
      expect(p.file).not.toBe("");
      const photo = getGuideEntry(p.system, p.id)?.photo;
      expect(photo).toEqual({
        path: p.path,
        alt: p.alt,
        credit: p.credit,
        focus: p.focus,
        zoom: p.zoom,
        tileOverlay: p.tileOverlay,
      });
      expect(photo?.focus).not.toBe("");
      if (photo?.zoom !== undefined) expect(photo.zoom).toBeGreaterThan(1);
      expect(photo?.alt).not.toBe("");
      expect(photo?.credit).not.toBe("");
    }
  });

  it("タロットの項目には photo を付けないこと(カード画像は image のまま)", () => {
    const tarot = guideSystems.find((s) => s.id === "tarot")!;
    for (const e of tarot.groups.flatMap((g) => g.entries)) {
      expect(e.photo).toBeUndefined();
      expect(e.image.kind).toBe("photo");
    }
  });

  it("十二支の12件だけ、タイルで絵に文字を重ねること(tileOverlay)", () => {
    const overlay = guidePhotos.filter((p) => p.tileOverlay).map((p) => `${p.system}:${p.id}`);
    expect(overlay).toEqual(Array.from({ length: 12 }, (_, i) => `shichu:branch-${i + 1}`));
    for (const p of guidePhotos) if (p.tileOverlay !== undefined) expect(p.tileOverlay).toBe(true);
  });
});

describe("mayaGlyphSources(太陽の紋章の線画)", () => {
  const SIGNS = ["Imix", "Ik", "Akbal", "Kan", "Chiccan", "Cimi", "Manik", "Lamat", "Muluc", "Oc", "Chuen", "Eb", "Ben", "Ix", "Men", "Cib", "Caban", "Etznab", "Cauac", "Ahau"];
  /** 現在の版が Kilom691 による描き直しのもの。Ekwoman の元の版(2008年)を使う */
  const REDRAWN = new Set(["Ahau", "Ben", "Chiccan", "Chuen", "Etznab", "Ik", "Ix", "Kan", "Lamat", "Muluc"]);

  it("seal-1〜20 が Imix〜Ahau の DaySign に順に対応すること", () => {
    expect(mayaGlyphSources.map((g) => [g.id, g.sign, g.file, g.path])).toEqual(
      SIGNS.map((sign, i) => [`seal-${i + 1}`, sign, `DaySign ${sign}.svg`, `/guide-images/maya/seal-${i + 1}.svg`]),
    );
  });

  it("どの版を使うかを記録し、描き直された10件は Ekwoman の元の版を使うこと", () => {
    for (const g of mayaGlyphSources) {
      expect(g.revision.url).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
      expect(g.revision.sha1).toMatch(/^[0-9a-f]{40}$/);
      if (REDRAWN.has(g.sign)) {
        expect(g.revision.user, g.sign).toBe("Ekwoman");
        expect(g.revision.timestamp.startsWith("2008-")).toBe(true);
        expect(g.revision.url).toContain("/archive/");
      } else {
        expect(g.revision.user, g.sign).toBe("Vanisaac");
      }
    }
  });

  it("太陽の紋章の20件すべてに線画が付き、ほかの項目には付かないこと", () => {
    const maya = guideSystems.find((s) => s.id === "maya")!.groups.flatMap((g) => g.entries);
    const seals = maya.filter((e) => e.group === "太陽の紋章");
    expect(seals).toHaveLength(20);
    for (const e of seals) {
      expect(e.lineArt).toEqual({ path: `/guide-images/maya/${e.id}.svg`, credit: MAYA_GLYPH_CREDIT });
      expect(e.image.kind === "glyph" && e.image.color).toBeTruthy();
    }
    const others = guideSystems.flatMap((s) => s.groups.flatMap((g) => g.entries)).filter((e) => !seals.includes(e));
    for (const e of others) expect(e.lineArt).toBeUndefined();
  });
});
