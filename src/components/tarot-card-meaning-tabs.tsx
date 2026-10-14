"use client";

import type { TarotCard } from "@/data/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Icon } from "@/components/icons/icon";
import { fortuneLabels } from "@/lib/tarot-utils";

export function KeywordBadge({ keyword }: { keyword: string }) {
  return (
    <span className="inline-block bg-surface/60 border border-gold/20 rounded-full px-3 py-1 text-xs text-cream">
      {keyword}
    </span>
  );
}

const orientations = [
  { key: "upright" as const, label: "正位置", icon: "up" as const, color: "text-gold", activeBg: "data-active:bg-gold data-active:text-background" },
  { key: "reversed" as const, label: "逆位置", icon: "down" as const, color: "text-terracotta", activeBg: "data-active:bg-terracotta data-active:text-cream" },
] as const;

/** 正位置/逆位置のタブ(キーワード・意味・運勢ジャンル別の解説) */
export function TarotCardMeaningTabs({
  card,
  className,
}: {
  card: TarotCard;
  className?: string;
}) {
  return (
    <Tabs defaultValue="upright" className={className}>
      <TabsList className="w-full bg-surface/40 rounded-lg">
        {orientations.map((o) => (
          <TabsTrigger
            key={o.key}
            value={o.key}
            className={`flex-1 inline-flex items-center justify-center gap-1 ${o.activeBg} rounded-md px-4 py-2 text-sm font-heading`}
          >
            <Icon name={o.icon} size={14} strokeWidth={1.8} />
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {orientations.map((o) => (
        <TabsContent key={o.key} value={o.key} className="mt-4 flex flex-col gap-4">
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
            <p className="text-cream/90 text-sm leading-relaxed">{card.meaning[o.key]}</p>
          </section>

          <section aria-label={`${o.label}の運勢`}>
            <h2 className={`${o.color} text-sm font-heading font-bold mb-2`}>運勢</h2>
            <Accordion>
              {fortuneLabels.map(({ key, label, icon }) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-cream text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Icon name={icon} size={16} className="text-gold-light" />
                      {label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-cream/80 text-sm leading-relaxed">{card.fortune[key][o.key]}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </TabsContent>
      ))}
    </Tabs>
  );
}
