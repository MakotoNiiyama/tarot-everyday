"use client";

import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { fortuneLabels, suitNames } from "@/lib/tarot-utils";

function KeywordBadge({ keyword }: { keyword: string }) {
  return (
    <span className="inline-block bg-surface/60 border border-gold/20 rounded-full px-3 py-1 text-xs text-cream">
      {keyword}
    </span>
  );
}

const orientations = [
  { value: 0, key: "upright" as const, label: "☀ 正位置", color: "text-gold", activeBg: "data-active:bg-gold data-active:text-background" },
  { value: 1, key: "reversed" as const, label: "☽ 逆位置", color: "text-terracotta", activeBg: "data-active:bg-terracotta data-active:text-cream" },
] as const;

export function CardDetail({ card }: { card: TarotCard }) {
  const subTitle = card.arcana === "major"
    ? "大アルカナ"
    : (card.suit ? suitNames[card.suit].full : "小アルカナ");

  return (
    <div className="flex flex-col flex-1 px-4 py-6 pb-20 gap-6 max-w-lg mx-auto">
      {/* パンくず */}
      <nav aria-label="パンくずリスト" className="text-xs text-gold-dim">
        <Link href="/cards" className="hover:text-gold transition-colors">
          早見表
        </Link>
        <span className="mx-1">›</span>
        <span className="text-cream">{card.name.ja}</span>
      </nav>

      {/* ヘッダー */}
      <header className="text-center">
        <p className="text-gold-dim text-xs mb-1">{subTitle}</p>
        <h1 className="font-heading text-2xl font-bold text-gold">
          {card.name.ja}
        </h1>
        <p className="text-gold-dim text-sm mt-1 font-accent">
          {card.name.en}
        </p>
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

      {/* 正位置 / 逆位置 タブ */}
      <Tabs defaultValue={0}>
        <TabsList className="w-full bg-surface/40 rounded-lg">
          {orientations.map((o) => (
            <TabsTrigger
              key={o.value}
              value={o.value}
              className={`flex-1 text-center ${o.activeBg} rounded-md px-4 py-2 text-sm font-heading`}
            >
              {o.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {orientations.map((o) => (
          <TabsContent key={o.value} value={o.value} className="mt-4 flex flex-col gap-4">
            <section aria-label={`${o.label}のキーワード`}>
              <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>キーワード</h2>
              <div className="flex flex-wrap gap-2">
                {card.keywords[o.key].map((kw) => (
                  <KeywordBadge key={kw} keyword={kw} />
                ))}
              </div>
            </section>

            <section aria-label={`${o.label}の意味`}>
              <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>意味</h2>
              <p className="text-cream/90 text-sm leading-relaxed">
                {card.meaning[o.key]}
              </p>
            </section>

            <section aria-label={`${o.label}の運勢`}>
              <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>運勢</h2>
              <Accordion>
                {fortuneLabels.map(({ key, label, emoji }) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-cream text-sm">
                      <span>{emoji} {label}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-cream/80 text-sm leading-relaxed">
                        {card.fortune[key][o.key]}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
