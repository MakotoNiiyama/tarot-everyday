// src/components/fortune/fortune-readings.tsx
"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { LocalDate } from "@/lib/fortune/local-date";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile, Period } from "@/lib/fortune/types";
import { useDailyDraw } from "@/lib/use-daily-draw";
import { NatalSection, type NatalHeading } from "./natal-section";
import { PeriodTabs } from "./period-tabs";
import { PromptCard } from "./prompt-card";
import { SystemPeriodCard } from "./system-period-card";

const PERIOD_HEADING: Record<Period, string> = { day: "今日の運勢", month: "今月の運勢", year: "今年の運勢" };

/**
 * 計算結果を使う運勢ページの本体。計算エンジンを含むので fortune-content から動的に読み込む。
 * 本文の幅が十分あるとき(PC 1280px〜で詳細パネルを閉じているとき)は、左に1dayタロット・タブ・運勢カード、
 * 右に人物像とプロンプトの2カラム。詳細パネルを開くと本文が縮むので、画面幅に加えて本文の幅(コンテナクエリ)も条件にする。
 * tarotSlot を渡さないとき(登録していない生年月日で占うとき)は、1dayタロットを表示せず、プロンプトにも入れない。
 */
export function FortuneReadings({
  profile,
  today,
  tarotSlot,
  natalHeading,
}: {
  profile: BirthProfile;
  today: LocalDate;
  tarotSlot?: ReactNode;
  natalHeading?: NatalHeading;
}) {
  const [period, setPeriod] = useState<Period>("day");
  const readings = useMemo(() => readAll(profile, today), [profile, today]);
  const { draw, card } = useDailyDraw();
  const tarot = draw && card ? { card, isReversed: draw.isReversed } : null;
  const tabIdBase = useId();
  const panelId = `${tabIdBase}-panel`;

  return (
    <div className="@container">
      <div className="flex flex-col gap-4 xl:@[56rem]:grid xl:@[56rem]:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] xl:@[56rem]:items-start xl:@[56rem]:gap-7">
        <div className="flex min-w-0 flex-col gap-4">
          {tarotSlot}
          <div className="sticky top-[env(safe-area-inset-top,0px)] z-[5] bg-background py-1.5">
            <PeriodTabs value={period} onChange={setPeriod} idBase={tabIdBase} panelId={panelId} />
          </div>
          <section id={panelId} role="tabpanel" aria-labelledby={`${tabIdBase}-${period}`} className="flex flex-col gap-4">
            <h2 className="sr-only">{PERIOD_HEADING[period]}</h2>
            {readings.map((r) => (
              <SystemPeriodCard key={r.id} reading={r} period={period} />
            ))}
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <NatalSection readings={readings} heading={natalHeading} />
          <PromptCard profile={profile} readings={readings} today={today} tarot={tarot} omitTarot={tarotSlot === undefined} />
        </div>
      </div>
    </div>
  );
}
