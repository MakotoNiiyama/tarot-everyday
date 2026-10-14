import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { GuideDetailFrame, GuideDetailLayout } from "@/components/guide/guide-detail-layout";
import { TarotCardMeaningTabs } from "@/components/tarot-card-meaning-tabs";
import { arcanaLabel } from "@/lib/tarot-utils";

/** タロットのカードの詳細ページ(早見表の共通レイアウト+正逆タブ) */
export function CardDetail({ card }: { card: TarotCard }) {
  const group = arcanaLabel(card);
  return (
    <GuideDetailLayout
      system="tarot"
      systemLabel="タロット"
      group={group}
      image={
        <GuideDetailFrame portrait>
          <Image src={card.imagePath} alt={card.name.ja} width={300} height={500} className="h-auto w-full" priority />
        </GuideDetailFrame>
      }
    >
      <header className="flex flex-col gap-1 text-center lg:text-left">
        <h1 className="font-heading text-[30px] leading-tight lg:text-4xl">{card.name.ja}</h1>
        <p className="font-accent text-base leading-none text-gold-dark lg:text-xl">{card.name.en}</p>
      </header>
      <TarotCardMeaningTabs card={card} />
    </GuideDetailLayout>
  );
}
