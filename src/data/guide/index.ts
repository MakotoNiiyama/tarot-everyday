import type { ElementRef, PeriodResult } from "@/lib/fortune/types";
import { kyuseiEntries } from "./kyusei";
import { mayaEntries } from "./maya";
import { numerologyEntries } from "./numerology";
import { tarotEntries } from "./tarot";
import type { GuideEntry, GuideSystemId } from "./types";

export type { GuideEntry, GuideSystemId, GuideImage } from "./types";

export interface GuideGroup {
  name: string;
  entries: GuideEntry[];
}

export interface GuideSystem {
  id: GuideSystemId;
  label: string;
  groups: GuideGroup[];
}

/** 項目の並び順を保ったまま、グループ名の出現順でまとめる */
function groupEntries(entries: GuideEntry[]): GuideGroup[] {
  const groups: GuideGroup[] = [];
  for (const entry of entries) {
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

/** カタカナをひらがなにし、英字を小文字にそろえる */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .trim();
}

/** 名前・読み・英名・キーワードで全占術を横断して検索する */
export function searchGuide(query: string): GuideEntry[] {
  const q = normalize(query);
  if (!q) return [];
  return allEntries.filter((e) =>
    [e.name, e.reading, e.nameEn ?? "", ...e.keywords].some((field) => normalize(field).includes(q)),
  );
}

/** ElementRef が指す項目の「運勢として出たときの一文」 */
export function periodNoteOf(ref: ElementRef): string | undefined {
  return getGuideEntry(ref.system, ref.id)?.periodNote;
}

/** 運勢カードの一文のまとめ(設計書 §7): 「{見出しの文}。{periodNote}」 */
export function composeHeadline(result: PeriodResult): string {
  const note = periodNoteOf(result.headline.ref);
  return note ? `${result.headline.text}。${note}` : `${result.headline.text}。`;
}
