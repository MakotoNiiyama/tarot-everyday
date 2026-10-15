import type { ElementRef, PeriodResult } from "@/lib/fortune/types";
import { horoscopeEntries } from "./horoscope";
import { kyuseiEntries } from "./kyusei";
import { mayaEntries } from "./maya";
import { numerologyEntries } from "./numerology";
import { sanmeiEntries } from "./sanmei";
import { shichuEntries } from "./shichu";
import { sukuyoEntries } from "./sukuyo";
import { tarotEntries } from "./tarot";
import mayaGlyphs from "./maya-glyphs.json";
import photos from "./photos.json";
import type { GuideEntry, GuideLineArt, GuidePhoto, GuideSystemId } from "./types";

export type { GuideEntry, GuideSystemId, GuideImage, GuidePhoto, GuideLineArt } from "./types";

/** 画像の一覧(photos.json)。ダウンロードのスクリプトと共有する */
export interface GuidePhotoSource extends GuidePhoto {
  system: GuideSystemId;
  id: string;
  /** Wikimedia Commons のファイル名 */
  file: string;
}

export const guidePhotos = photos as GuidePhotoSource[];

const photoByKey = new Map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- file はダウンロードにだけ使う
  guidePhotos.map(({ system, id, file, ...photo }): [string, GuidePhoto] => [`${system}:${id}`, photo]),
);

/** マヤ暦の太陽の紋章の線画の一覧(maya-glyphs.json)。どの版をダウンロードするかも記録する */
export interface MayaGlyphSource {
  /** 太陽の紋章の id(seal-1〜20) */
  id: string;
  /** 日の名前(ユカテク語。Imix〜Ahau) */
  sign: string;
  /** Wikimedia Commons のファイル名 */
  file: string;
  path: string;
  /** ダウンロードする版(作者・日時・URL・SHA-1) */
  revision: { user: string; timestamp: string; url: string; sha1: string };
}

export const mayaGlyphSources = mayaGlyphs as MayaGlyphSource[];

export const MAYA_GLYPH_CREDIT = "古代マヤの日の文字(Wikimedia Commons の DaySign シリーズ)";

const lineArtByKey = new Map(
  mayaGlyphSources.map(({ id, path }): [string, GuideLineArt] => [`maya:${id}`, { path, credit: MAYA_GLYPH_CREDIT }]),
);

/** photos.json にある項目に photo を、maya-glyphs.json にある項目に lineArt を付ける */
function withImages(entries: GuideEntry[]): GuideEntry[] {
  return entries.map((e) => {
    const key = `${e.system}:${e.id}`;
    const photo = photoByKey.get(key);
    const lineArt = lineArtByKey.get(key);
    return { ...e, ...(photo && { photo }), ...(lineArt && { lineArt }) };
  });
}

export interface GuideGroup {
  name: string;
  entries: GuideEntry[];
}

export interface GuideSystem {
  id: GuideSystemId;
  label: string;
  groups: GuideGroup[];
}

/** 項目の並び順を保ったまま、グループ名の出現順でまとめる(画像のある項目には photo・lineArt を付ける) */
function groupEntries(entries: GuideEntry[]): GuideGroup[] {
  const groups: GuideGroup[] = [];
  for (const entry of withImages(entries)) {
    const group = groups.find((g) => g.name === entry.group);
    if (group) group.entries.push(entry);
    else groups.push({ name: entry.group, entries: [entry] });
  }
  return groups;
}

/** 早見表のタブの順(設計書 §11.5。フェーズ2以降の占術はここに追加する) */
export const guideSystems: GuideSystem[] = [
  { id: "tarot", label: "タロット", groups: groupEntries(tarotEntries) },
  { id: "numerology", label: "数秘術", groups: groupEntries(numerologyEntries) },
  { id: "kyusei", label: "九星気学", groups: groupEntries(kyuseiEntries) },
  { id: "maya", label: "マヤ暦", groups: groupEntries(mayaEntries) },
  { id: "shichu", label: "四柱推命", groups: groupEntries(shichuEntries) },
  { id: "sanmei", label: "算命学", groups: groupEntries(sanmeiEntries) },
  { id: "sukuyo", label: "宿曜", groups: groupEntries(sukuyoEntries) },
  { id: "horoscope", label: "西洋占星術", groups: groupEntries(horoscopeEntries) },
];

const allEntries: GuideEntry[] = guideSystems.flatMap((s) => s.groups.flatMap((g) => g.entries));
const byKey = new Map(allEntries.map((e) => [`${e.system}:${e.id}`, e]));

export function isGuideSystemId(v: string): v is GuideSystemId {
  return guideSystems.some((s) => s.id === v);
}

export function getGuideEntry(system: string, id: string): GuideEntry | undefined {
  return byKey.get(`${system}:${id}`);
}

export function guideHref(system: GuideSystemId, id: string): string {
  return `/guide/${system}/${id}`;
}

/** 互換文字をそろえ(NFKC: 全角英数・半角カナなど)、英字を小文字に、カタカナをひらがなにする */
function normalizeSearchText(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** 検索対象の文字列(名前・読み・英名・キーワード)を項目ごとに正規化しておく。欄の境目をまたいで一致しないよう改行で区切る */
const haystacks: { entry: GuideEntry; text: string }[] = allEntries.map((entry) => ({
  entry,
  text: normalizeSearchText([entry.name, entry.reading, entry.nameEn ?? "", ...entry.keywords].join("\n")),
}));

/** 名前・読み・英名・キーワードで全占術を横断して検索する。空白で区切った語はすべて含むもの(AND)に絞る */
export function searchGuide(query: string): GuideEntry[] {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return haystacks.filter(({ text }) => terms.every((t) => text.includes(t))).map(({ entry }) => entry);
}

/** ElementRef が指す項目の「運勢として出たときの一文」 */
export function periodNoteOf(ref: ElementRef): string | undefined {
  return getGuideEntry(ref.system, ref.id)?.periodNote;
}

/**
 * 運勢カードの一文のまとめ(設計書 §7): 「{見出しの文}。{periodNote}」。
 * 見出し({ text, ref })か PeriodResult を受け取る。見出しの文の末尾の「。」は重ねない
 */
export function composeHeadline(source: PeriodResult["headline"] | PeriodResult): string {
  const { text, ref } = "headline" in source ? source.headline : source;
  const body = text.replace(/。$/, "");
  const note = periodNoteOf(ref);
  return note ? `${body}。${note}` : `${body}。`;
}
