"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { DailyTarotCard } from "@/components/daily-tarot-card";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import { Icon } from "@/components/icons/icon";
import { PageContainer } from "@/components/page-container";
import { formatJaDate, formatJaWeekday } from "@/lib/date-format";
import { formatProfileSummary } from "@/lib/fortune/profile-format";
import { useBirthProfile } from "@/lib/fortune/profile-storage";
import { useToday } from "@/lib/use-today";
import { SignupCard } from "./signup-card";

/** 計算エンジン(astronomy-engine を含む)はこのページでだけ読み込む */
const FortuneReadings = dynamic(() => import("./fortune-readings").then((m) => m.FortuneReadings), {
  ssr: false,
  loading: () => <div className="h-40 rounded-[20px] bg-surface/40" aria-busy="true" aria-label="運勢を計算しています" />,
});

/** 運勢ページ(設計書 §11.2) */
export function FortuneContent() {
  const todayDate = useToday();
  const { ready, profile } = useBirthProfile();
  const today = useMemo(
    () => (todayDate ? { year: todayDate.getFullYear(), month: todayDate.getMonth() + 1, day: todayDate.getDate() } : null),
    [todayDate],
  );

  const tarot = (
    <section aria-label="今日の1dayタロット" className="rounded-[20px] border border-gold/25 bg-surface p-4 lg:p-5">
      <DailyTarotCard variant="fortune" />
    </section>
  );

  return (
    <DetailPanelLayout>
      <PageContainer className="xl:max-w-[1100px]">
        <h1 className="sr-only">運勢</h1>
        <header className="flex items-start justify-between gap-3 px-1">
          <div className="flex flex-col gap-1">
            <p className="font-accent text-[22px] leading-none text-gold lg:text-[26px]">Today</p>
            {todayDate && (
              <p className="font-heading text-[22px] leading-tight lg:text-[30px]">
                <span>{formatJaDate(todayDate)}</span>
                <span className="ml-2 text-[13px] text-gold-dim lg:ml-2.5 lg:text-[15px]">{formatJaWeekday(todayDate)}</span>
              </p>
            )}
            {profile && <p className="text-xs text-gold-dim lg:text-[13px]">{formatProfileSummary(profile)}</p>}
          </div>
          {profile && (
            <Link
              href="/fortune/profile"
              className="flex min-h-9 flex-none items-center gap-1 rounded-full border border-gold/30 px-2.5 text-xs text-gold-light lg:px-4 lg:text-[13px]"
            >
              <Icon name="edit" size={14} />
              <span className="lg:hidden">編集</span>
              <span className="hidden lg:inline">プロフィールを編集</span>
            </Link>
          )}
        </header>

        {ready && profile && today ? (
          <FortuneReadings profile={profile} today={today} tarotSlot={tarot} />
        ) : (
          <>
            {tarot}
            {ready && !profile && <SignupCard className="rounded-[20px] border border-gold/25 bg-surface p-4" />}
          </>
        )}
      </PageContainer>
    </DetailPanelLayout>
  );
}
