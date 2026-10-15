import type { AstroGlyphName } from "@/components/icons/astro-glyph";

/** 早見表の占術(タロットを含む) */
export type GuideSystemId = "tarot" | "numerology" | "kyusei" | "maya" | "shichu" | "sanmei" | "sukuyo" | "horoscope";

/** 画像枠の中身。glyph は漢字・数字のタイポグラフィ、astro は星座・天体の記号(SVG)、photo はカード画像など */
export type GuideImage =
  | { kind: "glyph"; text: string; color?: string }
  | { kind: "astro"; name: AstroGlyphName; color?: string }
  | { kind: "photo"; path: string; alt: string };

/** 早見表の項目に重ねて出す絵画・写真(Wikimedia Commons のパブリックドメイン。設計書 §7.2) */
export interface GuidePhoto {
  /** public からのパス(/guide-images/...)。scripts/download-guide-images.mjs でダウンロードする */
  path: string;
  alt: string;
  /** 作者・作品名・年(詳細ページの出典表示) */
  credit: string;
  /** 正方形に切り抜くときの位置(CSS の object-position) */
  focus: string;
  /** 余白・色見本などを切り落とすための拡大率(1より大きい数。focus を中心に拡大する)。なければ拡大しない */
  zoom?: number;
  /** タイルでは絵を暗くし、上に image の文字(漢字など)を重ねる。シート・詳細は絵だけ */
  tileOverlay?: boolean;
  /** タイルでは絵を出さず image の記号を出す(一覧で見分けやすくする)。シート・詳細は絵 */
  tileSymbol?: boolean;
}

/**
 * 項目の色(image.color)で塗る線画(CSS の mask-image に使う白黒の SVG。設計書 §7.2)。
 * マヤ暦の太陽の紋章に、古代マヤの日の文字(Wikimedia Commons の DaySign シリーズ。パブリックドメイン)を出す
 */
export interface GuideLineArt {
  /** public からのパス(/guide-images/...)。scripts/download-guide-images.mjs でダウンロードして線画に整える */
  path: string;
  /** 詳細ページの出典表示 */
  credit: string;
}

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
  /** 絵画・写真。あれば image の代わりに出し、読み込めなければ image に戻す */
  photo?: GuidePhoto;
  /** 線画。あれば image の代わりに image.color で塗って出し、読み込めなければ image に戻す */
  lineArt?: GuideLineArt;
  /** 同じ占術の関連項目の id */
  related?: string[];
}
