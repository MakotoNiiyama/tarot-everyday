"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import {
  type DailyDrawResult,
  loadTodayDraw,
  saveDraw,
  drawRandomCard,
} from "@/lib/daily-draw";
import { allCards, getCardById } from "@/data/cards";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { CardDetailSheet } from "@/components/card-detail-sheet";
import { fortuneLabels } from "@/lib/tarot-utils";

type Phase = "ready" | "flipping" | "result";

export function DailyTarot() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [draw, setDraw] = useState<DailyDrawResult | null>(null);
  const [card, setCard] = useState<TarotCard | null>(null);

  // 起動時に今日の結果を復元
  useEffect(() => {
    const saved = loadTodayDraw();
    if (saved) {
      const foundCard = getCardById(saved.cardId);
      if (foundCard) {
        setDraw(saved);
        setCard(foundCard);
        setPhase("result");
      }
    }
  }, []);

  const handleDraw = useCallback(() => {
    const result = drawRandomCard(allCards);
    const foundCard = getCardById(result.cardId);
    if (!foundCard) return;

    setDraw(result);
    setCard(foundCard);
    setPhase("flipping");
    saveDraw(result);

    // フリップ演出後に結果表示へ
    setTimeout(() => setPhase("result"), 1200);
  }, []);

  return (
    <div className="flex flex-col items-center px-4 py-6 pb-20 gap-6 max-w-lg mx-auto">
      <header className="text-center">
        <h1 className="font-heading text-2xl font-bold text-gold">
          1dayタロット占い
        </h1>
        <p className="text-gold-dim text-xs mt-1">今日の運勢を一枚引きで</p>
      </header>

      <ScratchDivider className="text-gold" />

      {/* ── カード領域 ── */}
      <div className="relative w-48 h-72" aria-live="polite">
        <AnimatePresence mode="wait">
          {phase === "ready" && <CardBack key="back" onDraw={handleDraw} />}
          {phase === "flipping" && <CardFlip key="flip" />}
          {phase === "result" && draw && card && (
            <CardFace key="face" card={card} isReversed={draw.isReversed} />
          )}
        </AnimatePresence>
      </div>

      {/* ── 結果テキスト ── */}
      {phase === "result" && draw && card && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full flex flex-col gap-4"
        >
          {/* カード名 */}
          <div className="text-center">
            <p className="text-gold text-lg font-heading font-bold">
              {card.name.ja}
            </p>
            <p className="text-gold-dim text-xs font-accent">
              {card.name.en}
            </p>
            <p
              className={`text-sm mt-1 font-heading ${draw.isReversed ? "text-terracotta" : "text-gold-light"}`}
            >
              {draw.isReversed ? "☽ 逆位置" : "☀ 正位置"}
            </p>
          </div>

          <ScratchDivider className="text-gold-dark" />

          {/* 運勢一覧 */}
          <div className="flex flex-col gap-3">
            {fortuneLabels.map(({ key, label, emoji }) => {
              const text = draw.isReversed
                ? card.fortune[key].reversed
                : card.fortune[key].upright;
              return (
                <section key={key} className="flex flex-col gap-1">
                  <h2 className="text-gold text-sm font-heading font-bold">
                    {emoji} {label}
                  </h2>
                  <p className="text-cream/85 text-sm leading-relaxed">
                    {text}
                  </p>
                </section>
              );
            })}
          </div>

          <ScratchDivider className="text-gold-dark" />

          {/* 詳細ボタン */}
          <div className="text-center">
            <CardDetailSheet card={card}>
              <span className="inline-flex items-center gap-1 bg-gold/15 border border-gold/30 rounded-lg px-5 py-2.5 text-gold text-sm font-heading hover:bg-gold/25 transition-colors">
                {card.name.ja}の詳細を見る
              </span>
            </CardDetailSheet>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ──────────── サブコンポーネント ──────────── */

/** カード裏面（タップで引く） */
function CardBack({ onDraw }: { onDraw: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onDraw}
      className="absolute inset-0 cursor-pointer"
      aria-label="カードを引く"
    >
      <svg
        viewBox="0 0 192 288"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-gold"
      >
        {/* 外枠 */}
        <rect
          x="4"
          y="4"
          width="184"
          height="280"
          rx="12"
          stroke="currentColor"
          strokeWidth="2"
          fill="#130C06"
        />
        {/* 内枠 */}
        <rect
          x="14"
          y="14"
          width="164"
          height="260"
          rx="8"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6 3"
          opacity="0.5"
          fill="none"
        />
        {/* 中央の星 */}
        <path
          d="M96 80 L102 110 L130 110 L107 128 L115 158 L96 140 L77 158 L85 128 L62 110 L90 110 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        {/* 上下の三日月 */}
        <path
          d="M96 40 A12 12 0 1 0 96 64 A8 8 0 1 1 96 40"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M96 224 A12 12 0 1 0 96 248 A8 8 0 1 1 96 224"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
          transform="rotate(180 96 236)"
        />
        {/* テキスト */}
        <text
          x="96"
          y="200"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12"
          fontFamily="serif"
          opacity="0.6"
        >
          TAP TO DRAW
        </text>
      </svg>
    </motion.button>
  );
}

/** フリップ演出 */
function CardFlip() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ rotateY: 0 }}
      animate={{ rotateY: 360 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <svg
        viewBox="0 0 192 288"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-gold"
      >
        <rect
          x="4"
          y="4"
          width="184"
          height="280"
          rx="12"
          stroke="currentColor"
          strokeWidth="2"
          fill="#130C06"
        />
        <circle
          cx="96"
          cy="144"
          r="40"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  );
}

/** カード表面（結果表示） */
function CardFace({
  card,
  isReversed,
}: {
  card: TarotCard;
  isReversed: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      className="absolute inset-0"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className={`w-full h-full rounded-xl overflow-hidden border-2 ${isReversed ? "border-terracotta" : "border-gold"}`}
        role="img"
        aria-label={`${card.name.ja} ${isReversed ? "逆位置" : "正位置"}`}
        style={isReversed ? { transform: "rotate(180deg)" } : undefined}
      >
        <Image
          src={card.imagePath}
          alt={card.name.ja}
          width={192}
          height={288}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    </motion.div>
  );
}
