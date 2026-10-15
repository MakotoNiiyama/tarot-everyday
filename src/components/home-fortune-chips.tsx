"use client";

import { useMemo } from "react";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile, Fact } from "@/lib/fortune/types";
import type { LocalDate } from "@/lib/fortune/local-date";

/** ホームに出す今日の要点(設計書 §11.1): 数秘のパーソナルデー・九星の位置と吉方位・今日のKIN(黒KINの日はそのチップも)・宿曜の関係 */
const HOME_KEYS: Record<string, string[]> = {
  numerology: ["personal-day"],
  kyusei: ["position", "lucky"],
  maya: ["today-kin", "black-kin"],
  sukuyo: ["relation"],
};

export function HomeFortuneChips({ profile, today }: { profile: BirthProfile; today: LocalDate }) {
  const chips = useMemo<Fact[]>(() => {
    return readAll(profile, today).flatMap((r) =>
      (HOME_KEYS[r.id] ?? []).flatMap((key) => r.periods.day.chips.filter((c) => c.key === key)),
    );
  }, [profile, today]);
  return (
    <ul className="flex flex-wrap gap-2" aria-label="今日の運勢の要点">
      {chips.map((c) => (
        <li
          key={c.key}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 text-[13px]"
        >
          <span className="text-[11px] text-gold-dim">{c.label}</span>
          <span className="font-bold">{c.value}</span>
        </li>
      ))}
    </ul>
  );
}
