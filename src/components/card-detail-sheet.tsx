"use client";

import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";
import { DetailSheet } from "@/components/detail/detail-sheet";
import { arcanaLabel } from "@/lib/tarot-utils";

/** タロットカードの詳細(画像+正逆タブ)を詳細シートで表示する。children がトリガー */
export function CardDetailSheet({
  card,
  children,
  className,
  triggerLabel,
}: {
  card: TarotCard;
  children: React.ReactNode;
  className?: string;
  triggerLabel?: string;
}) {
  return (
    <DetailSheet
      heading={{ title: card.name.ja, subtitle: arcanaLabel(card), description: card.name.en }}
      body={<TarotCardSheetBody card={card} />}
      className={className}
      triggerLabel={triggerLabel}
    >
      {children}
    </DetailSheet>
  );
}

function TarotCardSheetBody({ card }: { card: TarotCard }) {
  return (
    <>
      <div className="flex justify-center">
        <div className="w-32 h-auto rounded-lg overflow-hidden border border-gold/30 shadow-lg shadow-black/40">
          <Image
            src={card.imagePath}
            alt={card.name.ja}
            width={128}
            height={213}
            className="w-full h-auto"
          />
        </div>
      </div>
      <ScratchDivider className="text-gold" />
      <TarotCardMeaningTabs card={card} />
    </>
  );
}
