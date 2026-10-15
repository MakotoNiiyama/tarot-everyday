// src/lib/fortune/registry.ts
import { toBirthMoment } from "./birth-moment";
import type { LocalDate } from "./local-date";
import { kyusei } from "./kyusei";
import { maya } from "./maya";
import { numerology } from "./numerology";
import { sanmei } from "./sanmei";
import { shichu } from "./shichu";
import type { BirthProfile, FortuneSystemModule, SystemReading } from "./types";

/** 実装済みの占術(設計書 §11.2 の表示順)。未実装の占術はここに登録しない */
export const fortuneSystems: readonly FortuneSystemModule[] = [numerology, kyusei, maya, shichu, sanmei];

/** プロフィールと今日の日付から、全占術の結果を計算する */
export function readAll(profile: BirthProfile, today: LocalDate): SystemReading[] {
  const moment = toBirthMoment(profile);
  return fortuneSystems.map((system) => system.read(profile, moment, today));
}
