"use client";

import { DailyTarotCard } from "@/components/daily-tarot-card";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import { PageContainer } from "@/components/page-container";
import { formatJaDate, formatJaWeekday } from "@/lib/date-format";
import { useToday } from "@/lib/use-today";

/**
 * 運勢ページ。フェーズ0では1dayタロットのみ。
 * フェーズ1でプロフィールの要約・期間タブ・7占術の運勢カード・人物像・総合鑑定プロンプトを追加する。
 */
export function FortuneContent() {
  const today = useToday();

  return (
    <DetailPanelLayout>
      <PageContainer>
        <h1 className="sr-only">運勢</h1>
        <header className="flex flex-col gap-1 px-1">
          <p className="font-accent text-[22px] leading-none text-gold lg:text-[26px]">Today</p>
          {today && (
            <p className="font-heading text-[22px] leading-tight lg:text-[30px]">
              <span>{formatJaDate(today)}</span>
              <span className="ml-2 text-[13px] text-gold-dim lg:ml-2.5 lg:text-[15px]">{formatJaWeekday(today)}</span>
            </p>
          )}
        </header>

        <section
          aria-label="今日の1dayタロット"
          className="rounded-[20px] border border-gold/25 bg-surface p-4 lg:p-5"
        >
          <DailyTarotCard variant="fortune" />
        </section>
      </PageContainer>
    </DetailPanelLayout>
  );
}
