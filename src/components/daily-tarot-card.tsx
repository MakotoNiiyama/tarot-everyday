"use client";

import Image from "next/image";
import { Icon } from "@/components/icons/icon";
import { OrientationBadge } from "@/components/orientation-badge";
import { CardDetailSheet } from "@/components/card-detail-sheet";
import { secondaryButton } from "@/lib/button-styles";
import { useDailyDraw } from "@/lib/use-daily-draw";

type Variant = "home" | "fortune";

const sizes: Record<Variant, { box: string; width: number; height: number }> = {
  home: { box: "w-[72px] h-[120px] lg:w-[110px] lg:h-[184px]", width: 110, height: 184 },
  fortune: { box: "w-[84px] h-[140px] lg:w-24 lg:h-40", width: 96, height: 160 },
};

/** 今日の1dayタロット。未抽選ならその場で引ける。カードをタップすると詳細を開く */
export function DailyTarotCard({ variant }: { variant: Variant }) {
  const { ready, draw, card, drawNow } = useDailyDraw();
  const size = sizes[variant];
  const label = variant === "home" ? "1dayタロット" : "今日の1dayタロット";

  if (!ready) {
    return <div className={`${size.box} rounded-[10px] bg-popover`} aria-hidden="true" />;
  }

  if (!draw || !card) {
    return (
      <div className="flex items-center gap-3.5">
        <div
          className={`${size.box} flex flex-none items-center justify-center rounded-[10px] border border-dashed border-gold/50 bg-popover text-gold-dark`}
        >
          <Icon name="tarot" size={26} strokeWidth={1.4} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-[11px] text-gold-dim">{label}</p>
          <p className="text-sm leading-relaxed">今日のカードはまだ引いていません。</p>
          <button type="button" onClick={drawNow} className={secondaryButton}>
            カードを引く
          </button>
        </div>
      </div>
    );
  }

  const keywords = draw.isReversed ? card.keywords.reversed : card.keywords.upright;
  const general = draw.isReversed ? card.fortune.general.reversed : card.fortune.general.upright;

  return (
    <div className="flex items-center gap-4 lg:gap-5">
      <CardDetailSheet card={card} triggerLabel={`${card.name.ja}の詳細を見る`} className="flex-none">
        <span className={`${size.box} block overflow-hidden rounded-[10px] border border-gold/40`}>
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={size.width}
            height={size.height}
            className={`h-full w-full object-cover ${draw.isReversed ? "rotate-180" : ""}`}
          />
        </span>
      </CardDetailSheet>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-[11px] tracking-[0.1em] text-gold-dim">{label}</p>
        <p className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="font-heading text-[22px] leading-tight lg:text-[26px]">{card.name.ja}</span>
          <span className="font-accent text-lg leading-none text-gold lg:text-xl">{card.name.en}</span>
        </p>
        <OrientationBadge isReversed={draw.isReversed} />
        <p className="text-[13px] lg:text-sm">{keywords.join(" · ")}</p>
        {variant === "fortune" && (
          <p className="hidden max-w-[420px] text-[13px] leading-relaxed text-gold-dim lg:block">{general}</p>
        )}
      </div>
    </div>
  );
}
