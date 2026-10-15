import { describe, it, expect } from "vitest";
import { toBirthMoment } from "../birth-moment";
import { kyusei } from "../kyusei";
import { maya } from "../maya";
import { BLACK_KIN_NOTE, ijoNote, joinNatalNotes, masterNumberNote, sameStarNote, shukumeiNote } from "../natal-notes";
import { numerology } from "../numerology";
import { sanmei } from "../sanmei";
import type { BirthProfile, FortuneSystemModule } from "../types";

const today = { year: 2026, month: 10, day: 14 };
const profile = (year: number, month: number, day: number, time: BirthProfile["time"] = { kind: "unknown" }): BirthProfile => ({
  version: 1,
  date: { year, month, day },
  time,
});
const highlights = (m: FortuneSystemModule, p: BirthProfile) => m.read(p, toBirthMoment(p), today).highlights;

describe("人物像の「また、…」の一文", () => {
  it("どの文も「また、」で始まり、短く、絵文字や記号の文字を使わないこと", () => {
    const all = [
      ...[11, 22, 33].map((n) => masterNumberNote(n)!),
      sameStarNote(1, "一白水星"),
      sameStarNote(5, "五黄土星"),
      BLACK_KIN_NOTE,
      ...["生年中殺", "生月中殺", "生日中殺", "日座中殺", "日居中殺"].map((n) => shukumeiNote([n])!),
      shukumeiNote(["生年中殺", "生月中殺"])!,
      ijoNote(["日柱の癸巳"], true)!,
      ijoNote(["年柱の甲戌", "日柱の癸巳"], false)!,
    ];
    for (const text of all) {
      expect(text).toMatch(/^また、.+。$/);
      expect([...text].length).toBeLessThanOrEqual(70);
      expect(text).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    }
  });

  it("数秘術はライフパスがマスターナンバーのときだけ", () => {
    expect(highlights(numerology, profile(1990, 3, 29))).toEqual([masterNumberNote(33)]);
    expect(highlights(numerology, profile(1987, 7, 26))).toBeUndefined();
  });

  it("九星気学は本命星と月命星が同じときだけ(五黄同士は別の文)", () => {
    expect(highlights(kyusei, profile(1995, 8, 20, { kind: "hour", hour: 12 }))).toEqual([sameStarNote(5, "五黄土星")]);
    expect(highlights(kyusei, profile(1990, 3, 29))).toBeUndefined();
  });

  it("マヤ暦は黒KINのときだけ", () => {
    expect(highlights(maya, profile(1988, 3, 29))).toEqual([BLACK_KIN_NOTE]);
    expect(highlights(maya, profile(1990, 3, 29))).toBeUndefined();
  });

  it("算命学は宿命中殺・異常干支があるときだけ", () => {
    // 1990/3/29: 生年中殺、日柱 癸巳 は暗合異常干支
    expect(highlights(sanmei, profile(1990, 3, 29))).toEqual([shukumeiNote(["生年中殺"]), ijoNote(["日柱の癸巳"], true)]);
  });

  it("出生時刻の候補で結果が分かれるときは出さないこと", () => {
    // 1990/3/6 は啓蟄(5:19)の日。時刻不明だと月柱が候補に分かれる
    const r = sanmei.read(profile(1990, 3, 6), toBirthMoment(profile(1990, 3, 6)), today);
    expect(r.ambiguous).toBe(true);
    for (const text of r.highlights ?? []) expect(text).toMatch(/^また、/);
  });

  it("説明文に続けるとき、2つ目からは「さらに、」で始めること", () => {
    expect(joinNatalNotes("説明。", ["また、一つ目。", "また、二つ目。"])).toBe("説明。また、一つ目。さらに、二つ目。");
    expect(joinNatalNotes(undefined, [])).toBe("");
  });
});
