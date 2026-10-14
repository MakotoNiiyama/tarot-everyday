/** 早見表の占術(タロットを含む) */
export type GuideSystemId = "tarot" | "numerology" | "kyusei" | "maya";

/** 画像枠の中身。glyph は漢字・数字のタイポグラフィ、photo はカード画像など */
export type GuideImage =
  | { kind: "glyph"; text: string; color?: string }
  | { kind: "photo"; path: string; alt: string };

/** 早見表の1項目(設計書 §7) */
export interface GuideEntry {
  system: GuideSystemId;
  /** ElementRef.id と同じ。URL にも使う */
  id: string;
  /** グループ名(一覧の見出し。例「九星」) */
  group: string;
  name: string;
  /** 読み(ひらがな)。タロットは空文字 */
  reading: string;
  nameEn?: string;
  keywords: string[];
  /** 人物像・意味の説明(2〜3文) */
  summary: string;
  /** 運勢として出たときの一文(期間を表す語を含めない)。タロットは持たない */
  periodNote?: string;
  image: GuideImage;
  /** 同じ占術の関連項目の id */
  related?: string[];
}
