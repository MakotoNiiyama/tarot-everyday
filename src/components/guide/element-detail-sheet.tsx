"use client";

import type { ReactNode } from "react";
import { DetailSheet } from "@/components/detail/detail-sheet";
import { getGuideEntry, guideHref } from "@/data/guide";
import type { ElementRef } from "@/lib/fortune/types";
import { GuideEntryBody } from "./guide-entry-body";

/**
 * 計算結果の要素(ElementRef)をタップすると、早見表の項目を詳細シート(PC幅ではサイドパネル)で開く。
 * 辞書に項目がなければ、トリガーの中身をそのまま表示する。
 */
export function ElementDetailSheet({
  element,
  children,
  className,
  triggerLabel,
}: {
  element: ElementRef;
  children: ReactNode;
  className?: string;
  triggerLabel?: string;
}) {
  const entry = getGuideEntry(element.system, element.id);
  if (!entry) return <span className={className}>{children}</span>;
  return (
    <DetailSheet
      heading={{ title: entry.name, subtitle: entry.group, description: entry.reading || entry.nameEn }}
      body={<GuideEntryBody entry={entry} />}
      guideHref={guideHref(entry.system, entry.id)}
      className={className}
      triggerLabel={triggerLabel}
    >
      {children}
    </DetailSheet>
  );
}
