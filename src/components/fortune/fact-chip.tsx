"use client";

import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import type { Fact } from "@/lib/fortune/types";

/** 要素のチップ(ラベル+値)。タップで早見表の項目の詳細を開く */
export function FactChip({ fact }: { fact: Fact }) {
  return (
    <FactDetailSheet
      fact={fact}
      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 text-[13px] text-cream hover:border-gold/60 lg:min-h-8"
    >
      <span className="text-[11px] text-gold-dim">{fact.label}</span>
      <span className="font-bold">{fact.value}</span>
    </FactDetailSheet>
  );
}
