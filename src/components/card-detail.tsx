"use client";

import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";
import { arcanaLabel } from "@/lib/tarot-utils";

export function CardDetail({ card }: { card: TarotCard }) {
  const subTitle = arcanaLabel(card);

  return (
    <div className="flex flex-col flex-1 px-4 py-6 gap-6 max-w-lg mx-auto">
      {/* パンくず */}
      <nav aria-label="パンくずリスト" className="text-xs text-gold-dim">
        <Link href="/guide" className="hover:text-gold transition-colors">
          早見表
        </Link>
        <span className="mx-1">/</span>
        <span>タロット</span>
        <span className="mx-1">/</span>
        <span className="text-cream">{card.name.ja}</span>
      </nav>

      {/* ヘッダー */}
      <header className="text-center">
        <p className="text-gold-dim text-xs mb-1">{subTitle}</p>
        <h1 className="font-heading text-2xl font-bold text-gold">{card.name.ja}</h1>
        <p className="text-gold-dim text-sm mt-1 font-accent">{card.name.en}</p>
      </header>

      {/* カード画像 */}
      <div className="flex justify-center">
        <div className="w-40 h-auto rounded-lg overflow-hidden border border-gold/30 shadow-lg shadow-black/40">
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={160}
            height={267}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      <ScratchDivider className="text-gold" />

      <TarotCardMeaningTabs card={card} />
    </div>
  );
}
