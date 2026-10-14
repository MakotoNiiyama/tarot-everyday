// src/components/fortune/fortune-readings.tsx
"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { LocalDate } from "@/lib/fortune/local-date";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile, Period } from "@/lib/fortune/types";
import { useDailyDraw } from "@/lib/use-daily-draw";
import { NatalSection } from "./natal-section";
import { PeriodTabs } from "./period-tabs";
import { PromptCard } from "./prompt-card";
import { SystemPeriodCard } from "./system-period-card";

/**
 * 計算結果を使う運勢ページの本体。計算エンジンを含むので fortune-content から動的に読み込む。
 * 本文の幅が十分あるとき(PC 1280px〜で詳細パネルを閉じているとき)は、左に1dayタロット・タブ・運勢カード、
 * 右に人物像とプロンプトの2カラム。詳細パネルを開くと本文が縮むので、画面幅に加えて本文の幅(コンテナクエリ)も条件にする。
 */
export function FortuneReadings({
  profile,
  today,
  tarotSlot,
}: {
  profile: BirthProfile;
  today: LocalDate;
  tarotSlot: ReactNode;
}) {
  const [period, setPeriod] = useState<Period>("day");
  const readings = useMemo(() => readAll(profile, today), [profile, today]);
  const { draw, card } = useDailyDraw();
  const tarot = draw && card ? { card, isReversed: draw.isReversed } : null;

  return (
    <div className="@container">
      <div className="flex flex-col gap-4 xl:@[56rem]:grid xl:@[56rem]:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] xl:@[56rem]:items-start xl:@[56rem]:gap-7">
        <div className="flex min-w-0 flex-col gap-4">
          {tarotSlot}
          <div className="sticky top-[env(safe-area-inset-top,0px)] z-[5] bg-background py-1.5">
            <PeriodTabs value={period} onChange={setPeriod} />
          </div>
          <section aria-label="運勢" className="flex flex-col gap-4">
            {readings.map((r) => (
              <SystemPeriodCard key={r.id} reading={r} period={period} />
            ))}
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <NatalSection readings={readings} />
          <PromptCard profile={profile} readings={readings} period={period} today={today} tarot={tarot} />
        </div>
      </div>
    </div>
  );
}
