"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { loadTodayDraw, type DailyDrawResult } from "@/lib/daily-draw";
import { getCardById } from "@/data/cards";
import {
  ScratchDivider,
  ScratchFrame,
  ScratchMoon,
  ScratchHeader,
} from "@/components/svg/scratch-decorations";
import { CardDetailSheet } from "@/components/card-detail-sheet";

export function HomeContent() {
  const [draw, setDraw] = useState<DailyDrawResult | null>(null);
  const [card, setCard] = useState<TarotCard | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadTodayDraw();
    if (saved) {
      const found = getCardById(saved.cardId);
      if (found) {
        setDraw(saved);
        setCard(found);
      }
    }
    setLoaded(true);
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-12">
      <main className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* ヘッダー装飾 */}
        <ScratchHeader className="text-gold" />

        {/* アプリタイトル */}
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-gold tracking-wide">
            Tarot Everyday
          </h1>
          <p className="mt-2 text-gold-dim text-sm font-accent">
            ― 毎日の一枚が、あなたの道を照らす ―
          </p>
        </div>

        <ScratchDivider className="text-gold" />

        {/* 今日の占いセクション */}
        {loaded && (draw && card ? (
          <TodayResult card={card} draw={draw} />
        ) : (
          <TodayCTA />
        ))}

        <ScratchDivider className="text-gold" />

        {/* クイックリンク */}
        <nav aria-label="メインメニュー" className="grid grid-cols-1 gap-4 w-full">
          <Link
            href="/cards"
            className="border border-gold/25 rounded-lg p-4 text-center hover:border-gold/50 transition-colors block"
          >
            <p className="text-gold font-heading text-lg">📖 早見表</p>
            <p className="text-gold-dim text-xs mt-1">全78枚のカード一覧</p>
          </Link>
          <Link
            href="/daily"
            className="border border-gold/25 rounded-lg p-4 text-center hover:border-gold/50 transition-colors block"
          >
            <p className="text-gold font-heading text-lg">🔮 1dayタロット</p>
            <p className="text-gold-dim text-xs mt-1">今日の運勢を占う</p>
          </Link>
        </nav>
      </main>
    </div>
  );
}

/** 占い未実施時のCTA */
function TodayCTA() {
  return (
    <Link href="/daily" aria-label="今日のカードを引く">
      <ScratchFrame className="w-40 h-56 text-gold">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <ScratchMoon className="text-gold mx-auto mb-3" />
            <p className="text-cream text-sm">今日のカードを</p>
            <p className="text-cream text-sm">引いてみましょう</p>
          </div>
        </div>
      </ScratchFrame>
    </Link>
  );
}

/** 占い済みの結果サマリー */
function TodayResult({
  card,
  draw,
}: {
  card: TarotCard;
  draw: DailyDrawResult;
}) {
  const orientation = draw.isReversed ? "逆位置" : "正位置";
  const orientationIcon = draw.isReversed ? "☽" : "☀";
  const orientationColor = draw.isReversed
    ? "text-terracotta"
    : "text-gold-light";
  const generalFortune = draw.isReversed
    ? card.fortune.general.reversed
    : card.fortune.general.upright;

  return (
    <section className="w-full flex flex-col items-center gap-4" aria-label="今日の占い結果">
      <p className="text-gold-dim text-xs font-heading">Today&apos;s Card</p>

      {/* カード画像 — タップでボトムシート */}
      <CardDetailSheet card={card}>
        <div className="w-32 h-auto rounded-lg overflow-hidden border border-gold/30 shadow-lg shadow-black/40">
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={128}
            height={213}
            className={`w-full h-auto ${draw.isReversed ? "rotate-180" : ""}`}
          />
        </div>
      </CardDetailSheet>

      {/* カード名・正逆 */}
      <div className="text-center">
        <p className="text-gold font-heading text-lg font-bold leading-tight">
          {card.name.ja}
        </p>
        <p className="text-gold-dim text-xs font-accent mt-0.5">
          {card.name.en}
        </p>
        <p className={`text-sm mt-1 font-heading ${orientationColor}`}>
          {orientationIcon} {orientation}
        </p>
      </div>

      {/* 総合運サマリー */}
      <div className="text-center max-w-xs">
        <p className="text-gold text-sm font-heading font-bold mb-1">⭐ 総合運</p>
        <p className="text-cream/85 text-xs leading-relaxed line-clamp-3">
          {generalFortune}
        </p>
      </div>

      <Link
        href="/daily"
        className="text-gold text-xs underline underline-offset-4 hover:text-gold-light transition-colors"
      >
        1dayタロットを見る →
      </Link>
    </section>
  );
}
