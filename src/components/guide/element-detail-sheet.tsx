"use client";

import type { ReactNode } from "react";
import { CardDetailSheet } from "@/components/card-detail-sheet";
import { DetailSheet } from "@/components/detail/detail-sheet";
import { getCardById } from "@/data/cards";
import { getGuideEntry, guideHref } from "@/data/guide";
import type { ElementRef } from "@/lib/fortune/types";
import { GuideEntryBody } from "./guide-entry-body";

/**
 * 計算結果の要素(ElementRef)をタップすると、早見表の項目を詳細シート(PC幅ではサイドパネル)で開く。
 * タロットはカードの詳細(正位置・逆位置のタブ)で開く。辞書に項目がなければ、トリガーの中身をそのまま表示する。
 *
 * children はトリガーの <button> の中に入るので、フレージングコンテンツ(span・テキストなど)だけにすること
 * (div・p・見出し・リンク・ボタンは入れない)
 */
export function ElementDetailSheet({
  element,
  children,
  className,
  triggerLabel,
}: {
  element: ElementRef;
  /** トリガーの中身。フレージングコンテンツだけ */
  children: ReactNode;
  className?: string;
  triggerLabel?: string;
}) {
  if (element.system === "tarot") {
    const card = getCardById(element.id);
    if (!card) return <span className={className}>{children}</span>;
    return (
      <CardDetailSheet card={card} className={className} triggerLabel={triggerLabel}>
        {children}
      </CardDetailSheet>
    );
  }
  const entry = getGuideEntry(element.system, element.id);
  if (!entry) return <span className={className}>{children}</span>;
  return (
    <DetailSheet
      heading={{ title: entry.name, subtitle: entry.group, reading: entry.reading || undefined, nameEn: entry.nameEn }}
      body={<GuideEntryBody entry={entry} />}
      guideHref={guideHref(entry.system, entry.id)}
      className={className}
      triggerLabel={triggerLabel}
    >
      {children}
    </DetailSheet>
  );
}
