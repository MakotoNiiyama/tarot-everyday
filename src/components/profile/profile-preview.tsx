"use client";

import { useMemo } from "react";
import { readAll } from "@/lib/fortune/registry";
import { todayInTokyo } from "@/lib/fortune/tokyo-time";
import type { BirthProfile } from "@/lib/fortune/types";

/** PC の「この入力で分かること」。入力中の値で人物像を計算して見せる(計算エンジンを含むので動的に読み込む) */
export function ProfilePreview({ profile }: { profile: BirthProfile }) {
  const readings = useMemo(() => readAll(profile, todayInTokyo()), [profile]);
  return (
    <section aria-label="この入力で分かること" className="flex flex-col gap-3.5">
      <p className="text-xs tracking-[0.1em] text-gold-dim">この入力で分かること</p>
      <div className="flex flex-col gap-3.5 rounded-[20px] border border-gold/20 bg-popover p-[22px]">
        {readings.map((r) => (
          <div key={r.id} className="flex flex-col gap-1.5">
            <p className="font-heading text-[15px] text-gold-light">{r.name}</p>
            <ul className="flex flex-wrap gap-1.5">
              {r.natal.slice(0, 3).map((f) => (
                <li key={f.key} className={`rounded-full border px-2.5 py-1 text-xs ${f.candidates ? "border-terracotta/50 text-terracotta" : "border-gold/30"}`}>
                  <span className="text-gold-dim">{f.label}</span> {f.value}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {readings.some((r) => r.ambiguous) && (
          <p className="text-[13px] leading-[1.8]">出生時刻によって結果が分かれる項目は、候補として時刻範囲付きで表示されます。</p>
        )}
      </div>
    </section>
  );
}
