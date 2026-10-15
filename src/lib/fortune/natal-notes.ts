// src/lib/fortune/natal-notes.ts
/**
 * 人物像の説明に「また、…」と続ける一文(特殊な配置に当たる人だけ)。
 * 説明しすぎず、早見表の説明に自然につながる短い文にする
 */

/** 説明文に続ける。2つ目からは「さらに、」で始めて「また、」が続かないようにする */
export function joinNatalNotes(summary: string | undefined, notes: string[] = []): string {
  return [summary ?? "", ...notes.map((n, i) => (i === 0 ? n : n.replace(/^また、/, "さらに、")))].join("");
}

/** 数秘術: ライフパスがマスターナンバー */
const MASTER_NUMBER: Record<number, string> = {
  11: "また、ライフパスはマスターナンバーの11で、鋭い直感とひらめきを人のために生かせる人です。",
  22: "また、ライフパスはマスターナンバーの22で、大きな理想を現実の形にしていく力を備えています。",
  33: "また、ライフパスはマスターナンバーの33で、見返りを求めない深い愛情で周りを包み込む人です。",
};

export function masterNumberNote(lifePath: number): string | undefined {
  return MASTER_NUMBER[lifePath];
}

/** 九星気学: 本命星と月命星が同じ(五黄同士は別の文) */
export function sameStarNote(star: number, starName: string): string {
  return star === 5
    ? "また、本命星も月命星も五黄土星で、帝王の星の強さを二重に持つ、存在感のある人です。"
    : `また、本命星と月命星がどちらも${starName}で、この星の持ち味がまっすぐに表れやすい人です。`;
}

/** マヤ暦: 黒KIN */
export const BLACK_KIN_NOTE = "また、黒KIN(銀河の活性化の門)の日の生まれで、思いを形にする力が強いといわれます。";

/** 算命学: 宿命中殺(1つのときはその種類の文、複数のときはまとめた文) */
const SHUKUMEI_NOTE: Record<string, string> = {
  生年中殺: "また、生年中殺を持ち、生まれた家の流れから離れて自分の道を切り開いていく人といわれます。",
  生月中殺: "また、生月中殺を持ち、身近な縁に頼りすぎず、自分の力で居場所をつくっていく人です。",
  生日中殺: "また、生日中殺を持ち、型にはまらない感性を生かして独自の道を歩みやすい人です。",
  日座中殺: "また、日座中殺を持ち、常識にとらわれない発想で自分の人生を動かしていく強さがあります。",
  日居中殺: "また、日居中殺を持ち、身近な人との関わりの中で自分らしさを磨いていく人といわれます。",
};

export function shukumeiNote(names: string[]): string | undefined {
  if (names.length === 0) return undefined;
  if (names.length === 1) return SHUKUMEI_NOTE[names[0]];
  return `また、${names.join("と")}を持ち、与えられた枠を超えて自分の力で道を開いていく人といわれます。`;
}

/** 算命学: 異常干支。where は「日柱の癸巳」のような柱と干支、angou はすべて暗合異常干支か */
export function ijoNote(where: string[], angou: boolean): string | undefined {
  if (where.length === 0) return undefined;
  const kind = angou ? "暗合異常干支" : "異常干支";
  const tail = angou
    ? "表には見えない豊かな内面と、独特の感性を秘めています。"
    : "人とは違う個性や才能が光りやすい人です。";
  return `また、${where.join("と")}が${kind}で、${tail}`;
}
