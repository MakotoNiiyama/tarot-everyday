"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/icon";
import { DailyTarotCard } from "@/components/daily-tarot-card";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import { PageContainer } from "@/components/page-container";
import { SignupCard } from "@/components/fortune/signup-card";
import { primaryButton } from "@/lib/button-styles";
import { formatEnWeekday, formatJaDate, formatJaWeekday } from "@/lib/date-format";
import { useBirthProfile } from "@/lib/fortune/profile-storage";
import { useToday, useTodayLocalDate } from "@/lib/use-today";

const HomeFortuneChips = dynamic(() => import("./home-fortune-chips").then((m) => m.HomeFortuneChips), { ssr: false });

const entries: { href: string; icon: IconName; title: string; sub: string }[] = [
  { href: "/tarot/reading", icon: "chat", title: "相談したいことがある", sub: "タロット占い" },
  { href: "/tarot/quiz", icon: "quiz", title: "タロットクイズ", sub: "カードの意味を練習する" },
  { href: "/guide", icon: "guide", title: "早見表", sub: "タロットと7占術の要素を調べる" },
];

export function HomeContent() {
  const today = useToday();
  const { ready, profile } = useBirthProfile();
  const todayLocal = useTodayLocalDate();

  return (
    <DetailPanelLayout>
      <PageContainer>
        <header className="flex flex-col gap-0.5 px-1">
          <h1 className="font-accent text-[30px] leading-none text-gold lg:sr-only">tarot-everyday</h1>
          {today && (
            <>
              <p className="text-xs text-gold-dim lg:hidden">
                {formatJaDate(today)} {formatJaWeekday(today)}
              </p>
              <p className="hidden font-accent text-[26px] leading-none text-gold lg:block">{formatEnWeekday(today)}</p>
              <p className="hidden font-heading text-[30px] lg:block">{formatJaDate(today)}</p>
            </>
          )}
        </header>

        <section
          aria-label="今日の運勢"
          className="flex flex-col gap-3.5 rounded-[22px] border border-gold/30 bg-surface p-[18px] lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-7 lg:rounded-3xl lg:p-7"
        >
          <div className="flex flex-col gap-3.5 lg:gap-3">
            <div className="flex items-baseline justify-between lg:justify-start lg:gap-2.5">
              <h2 className="font-heading text-[19px] lg:text-[22px]">今日の運勢</h2>
              <span className="font-accent text-base text-gold-dark lg:text-[17px]">Today&apos;s fortune</span>
            </div>
            <DailyTarotCard variant="home" />
            {ready && profile && todayLocal && <HomeFortuneChips profile={profile} today={todayLocal} />}
            {ready && !profile && <SignupCard className="border-t border-gold/15 pt-3.5" />}
          </div>
          {ready && profile && (
            <Link href="/fortune" className={`${primaryButton} lg:px-[22px]`}>
              詳しく見る
              <Icon name="right" size={16} strokeWidth={2} />
            </Link>
          )}
        </section>

        <section aria-label="メニュー">
          <ul className="flex flex-col gap-2.5 lg:grid lg:grid-cols-3 lg:gap-4">
            {entries.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="flex min-h-[76px] items-center gap-3.5 rounded-[18px] border border-gold/25 bg-surface p-4 text-cream transition-colors hover:border-gold/50 lg:min-h-[150px] lg:flex-col lg:items-start lg:rounded-[20px] lg:p-[22px]"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gold/12 text-gold-light lg:h-12 lg:w-12 lg:rounded-[14px]">
                    <Icon name={e.icon} size={22} />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5 lg:gap-1">
                    <span className="font-heading text-base lg:text-[17px]">{e.title}</span>
                    <span className="text-xs text-gold-dim">{e.sub}</span>
                  </span>
                  <Icon name="right" size={18} className="text-gold-dark lg:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageContainer>
    </DetailPanelLayout>
  );
}
