"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { SpreadReading, DrawnCard } from "@/lib/spread";

interface SpreadLayoutProps {
  reading: SpreadReading;
  animateIn?: boolean;
  onAnimationComplete?: () => void;
}

export function SpreadLayout({
  reading,
  animateIn = false,
  onAnimationComplete,
}: SpreadLayoutProps) {
  const { spread, cards } = reading;

  const layouts: Record<string, React.FC<LayoutProps>> = {
    "three-card": ThreeCardLayout,
    choice: ChoiceLayout,
    hexagram: HexagramLayout,
    "celtic-cross": CelticCrossLayout,
  };

  const Layout = layouts[spread.id] ?? ThreeCardLayout;

  return (
    <Layout
      cards={cards}
      positions={spread.positions.map((p) => p.label)}
      animateIn={animateIn}
      onAnimationComplete={onAnimationComplete}
    />
  );
}

/* ──── 共通型 ──── */

interface LayoutProps {
  cards: DrawnCard[];
  positions: string[];
  animateIn: boolean;
  onAnimationComplete?: () => void;
}

/* ──── ミニカード ──── */

function MiniCard({
  dc,
  label,
  index,
  animateIn,
  onAnimationComplete,
}: {
  dc: DrawnCard;
  label: string;
  index: number;
  animateIn: boolean;
  onAnimationComplete?: () => void;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={animateIn ? { opacity: 0, y: 30, scale: 0.8 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={animateIn ? { delay: index * 0.2, duration: 0.4 } : undefined}
      onAnimationComplete={onAnimationComplete}
    >
      <div
        className={`w-14 h-[84px] rounded-lg overflow-hidden border ${
          dc.isReversed ? "border-terracotta/60" : "border-gold/40"
        } bg-[#130C06]`}
      >
        <Image
          src={dc.card.imagePath}
          alt={dc.card.name.ja}
          width={56}
          height={84}
          className={`w-full h-full object-cover ${dc.isReversed ? "rotate-180" : ""}`}
        />
      </div>
      <span className="text-gold-dim text-[10px] font-heading text-center leading-tight">
        {label}
      </span>
    </motion.div>
  );
}

/* ──── スリーカード（横一列） ──── */

function ThreeCardLayout({ cards, positions, animateIn, onAnimationComplete }: LayoutProps) {
  return (
    <div className="flex justify-center gap-4" role="img" aria-label="スリーカード展開">
      {cards.map((dc, i) => (
        <MiniCard
          key={i}
          dc={dc}
          label={positions[i]}
          index={i}
          animateIn={animateIn}
          onAnimationComplete={i === cards.length - 1 ? onAnimationComplete : undefined}
        />
      ))}
    </div>
  );
}

/* ──── 二者択一（Y字型） ──── */

function ChoiceLayout({ cards, positions, animateIn, onAnimationComplete }: LayoutProps) {
  // 0:現状(下中央) / 1:A(左上) / 2:A結果(左最上) / 3:B(右上) / 4:B結果(右最上)
  return (
    <div className="flex flex-col items-center gap-3" role="img" aria-label="二者択一展開">
      {/* 上段: A結果 と B結果 */}
      <div className="flex justify-center gap-8">
        <MiniCard dc={cards[2]} label={positions[2]} index={2} animateIn={animateIn} />
        <MiniCard dc={cards[4]} label={positions[4]} index={4} animateIn={animateIn} />
      </div>
      {/* 中段: A と B */}
      <div className="flex justify-center gap-8">
        <MiniCard dc={cards[1]} label={positions[1]} index={1} animateIn={animateIn} />
        <MiniCard dc={cards[3]} label={positions[3]} index={3} animateIn={animateIn} />
      </div>
      {/* 下段: 現状 */}
      <MiniCard
        dc={cards[0]}
        label={positions[0]}
        index={0}
        animateIn={animateIn}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}

/* ──── ヘキサグラム（六芒星） ──── */

function HexagramLayout({ cards, positions, animateIn, onAnimationComplete }: LayoutProps) {
  // 0:過去(左中) / 1:現在(中央) / 2:未来(右中) / 3:対策(左下) / 4:周囲(右下) / 5:潜在(上) / 6:最終(下中央)
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label="ヘキサグラム展開">
      {/* 上: 潜在意識 */}
      <MiniCard dc={cards[5]} label={positions[5]} index={5} animateIn={animateIn} />
      {/* 中段: 過去・現在・未来 */}
      <div className="flex justify-center gap-3">
        <MiniCard dc={cards[0]} label={positions[0]} index={0} animateIn={animateIn} />
        <MiniCard dc={cards[1]} label={positions[1]} index={1} animateIn={animateIn} />
        <MiniCard dc={cards[2]} label={positions[2]} index={2} animateIn={animateIn} />
      </div>
      {/* 下中段: 対策・周囲 */}
      <div className="flex justify-center gap-6">
        <MiniCard dc={cards[3]} label={positions[3]} index={3} animateIn={animateIn} />
        <MiniCard dc={cards[4]} label={positions[4]} index={4} animateIn={animateIn} />
      </div>
      {/* 最下段: 最終結果 */}
      <MiniCard
        dc={cards[6]}
        label={positions[6]}
        index={6}
        animateIn={animateIn}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}

/* ──── ケルト十字 ──── */

function CelticCrossLayout({ cards, positions, animateIn, onAnimationComplete }: LayoutProps) {
  // 0:現状(十字中央) / 1:障害(十字横) / 2:顕在(上) / 3:潜在(下) / 4:過去(左) / 5:近未来(右)
  // 6:自分(右柱下) / 7:周囲(右柱下2) / 8:希望(右柱上2) / 9:最終(右柱上)
  return (
    <div className="flex gap-4 justify-center" role="img" aria-label="ケルト十字展開">
      {/* 十字部分 */}
      <div className="flex flex-col items-center gap-1">
        {/* 頂点: 顕在意識 */}
        <MiniCard dc={cards[2]} label={positions[2]} index={2} animateIn={animateIn} />
        {/* 中段: 過去 → 現状+障害 → 近未来 */}
        <div className="flex items-center gap-1">
          <MiniCard dc={cards[4]} label={positions[4]} index={4} animateIn={animateIn} />
          <div className="relative">
            <MiniCard dc={cards[0]} label={positions[0]} index={0} animateIn={animateIn} />
            {/* 障害カードを横向きに重ねる */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-80">
              <MiniCard dc={cards[1]} label={positions[1]} index={1} animateIn={animateIn} />
            </div>
          </div>
          <MiniCard dc={cards[5]} label={positions[5]} index={5} animateIn={animateIn} />
        </div>
        {/* 底辺: 潜在意識 */}
        <MiniCard dc={cards[3]} label={positions[3]} index={3} animateIn={animateIn} />
      </div>

      {/* 右柱（下→上） */}
      <div className="flex flex-col justify-between gap-1">
        <MiniCard dc={cards[9]} label={positions[9]} index={9} animateIn={animateIn}
          onAnimationComplete={onAnimationComplete}
        />
        <MiniCard dc={cards[8]} label={positions[8]} index={8} animateIn={animateIn} />
        <MiniCard dc={cards[7]} label={positions[7]} index={7} animateIn={animateIn} />
        <MiniCard dc={cards[6]} label={positions[6]} index={6} animateIn={animateIn} />
      </div>
    </div>
  );
}
