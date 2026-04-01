"use client";

import { useState } from "react";
import Image from "next/image";
import { Drawer } from "@base-ui/react/drawer";
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

/**
 * ボトムシートでカード詳細を表示するコンポーネント。
 * children がトリガー要素。
 */
export function CardDetailSheet({
  card,
  children,
  className,
}: {
  card: TarotCard;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const subTitle = card.arcana === "major"
    ? "大アルカナ"
    : (card.suit ? suitNames[card.suit].full : "小アルカナ");

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        render={(props) => (
          <button {...props} type="button" className={`cursor-pointer ${className ?? ""}`}>
            {children}
          </button>
        )}
      />
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 bg-black/60 z-40
            transition-opacity duration-300
            data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
        />
        <Drawer.Viewport className="fixed inset-x-0 bottom-0 z-50">
          <Drawer.Popup
            className="flex flex-col rounded-t-2xl
              bg-background border-t border-gold/30 max-h-[85vh] outline-none
              transition-transform duration-300 ease-out
              translate-y-[calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y))]
              data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full
              data-[swiping]:transition-none"
          >
            {/* ドラッグハンドル */}
            <div
              className="flex justify-center pt-3 pb-2 w-full cursor-grab active:cursor-grabbing
                select-none"
            >
              <div className="w-12 h-1.5 rounded-full bg-gold/40 transition-colors
                hover:bg-gold/60 active:bg-gold/80" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {/* ヘッダー */}
              <header className="text-center mb-4">
                <p className="text-gold-dim text-xs mb-1">{subTitle}</p>
                <Drawer.Title className="font-heading text-xl font-bold text-gold">
                  {card.name.ja}
                </Drawer.Title>
                <Drawer.Description className="text-gold-dim text-sm font-accent mt-1">
                  {card.name.en}
                </Drawer.Description>
              </header>

              {/* カード画像 */}
              <div className="flex justify-center mb-4">
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

              {/* 正位置 / 逆位置 タブ */}
              <Tabs defaultValue={0} className="mt-4">
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
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
