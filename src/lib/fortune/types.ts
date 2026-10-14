// src/lib/fortune/types.ts
import type { LocalDate } from "./local-date";
import type { PrefectureCode } from "./prefectures";

export type SystemId = "numerology" | "kyusei" | "maya" | "shichu" | "sanmei" | "sukuyo" | "horoscope";
export type Period = "day" | "month" | "year";

export type BirthTime =
  | { kind: "unknown" }
  | { kind: "half"; half: "am" | "pm" }
  | { kind: "hour"; hour: number };

/** 端末に保存する入力(設計書 §4) */
export interface BirthProfile {
  version: 1;
  date: LocalDate;
  time: BirthTime;
  prefecture?: PrefectureCode;
  /** 大運の向きと五黄同士の中宮傾斜の判定にだけ使う */
  gender?: "male" | "female";
}

/** 瞬間の範囲。end は含まない */
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  label: string;
  /** 出生地未入力で明石を使っているとき true */
  isDefault: boolean;
}

export interface BirthMoment {
  range: TimeRange;
  location: GeoLocation;
  localDate: LocalDate;
}

export type Resolved<T> =
  | { kind: "fixed"; value: T }
  | { kind: "ambiguous"; options: { value: T; range: TimeRange }[] };

/** 早見表の項目への参照(1C の辞書データの id と一致させる) */
export interface ElementRef {
  system: SystemId | "tarot";
  id: string;
}

/** 表示用の事実。value は候補があれば「A(〜5:01) / B(5:01〜)」のように整形済み */
export interface Fact {
  /** 占術内で一意で、表記や順番が変わっても変わらない識別子(例: "honmei")。画面の key や項目の特定に使う */
  key: string;
  label: string;
  value: string;
  refs: ElementRef[];
  /** 出生時刻によって表記が分かれるときだけの候補(value の「A(〜5:01) / B(5:01〜)」を分けたもの) */
  candidates?: { value: string; rangeLabel: string }[];
}

export interface PeriodResult {
  period: Period;
  /** その占術での期間。例: 2026/2/4〜2027/2/3 */
  rangeLabel: string;
  /** 一文のまとめの材料。画面側で `${text}。${ref の項目の periodNote}` の形に組み立てる */
  headline: { text: string; ref: ElementRef };
  chips: Fact[];
  /** 出生時刻の曖昧さで計算の前提が分かれるときの注記。例: 本命星を二黒土星として計算(…) */
  note?: string;
}

export interface SystemReading {
  id: SystemId;
  name: string;
  nameEn: string;
  /** 総合鑑定プロンプトに書く採用方式 */
  method: string;
  natal: Fact[];
  periods: Record<Period, PeriodResult>;
  /** 出生時刻の曖昧さで人物像の結果が分かれたか */
  ambiguous: boolean;
}

export interface FortuneSystemModule {
  id: SystemId;
  name: string;
  nameEn: string;
  read(profile: BirthProfile, moment: BirthMoment, today: LocalDate): SystemReading;
}
