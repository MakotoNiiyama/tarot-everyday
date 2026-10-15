import Link from "next/link";
import type { ReactNode } from "react";
import { PageContainer } from "@/components/page-container";
import type { GuideSystemId } from "@/data/guide";
import { GuideBackLink } from "./guide-back-link";

/**
 * 早見表の詳細ページの共通レイアウト(設計書 §11.5)。
 * スマホは縦に積み、PC は左に画像・右に本文の2列にする。
 */
export function GuideDetailLayout({
  system,
  systemLabel,
  group,
  image,
  children,
}: {
  system: GuideSystemId;
  systemLabel: string;
  group: string;
  image: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageContainer className="gap-[18px]">
      <div className="flex items-center gap-2 lg:gap-3">
        <GuideBackLink href={`/guide?tab=${system}`} />
        <nav aria-label="パンくずリスト" className="text-xs text-gold-dim lg:text-[13px]">
          <Link href="/guide" className="hover:text-cream">
            早見表
          </Link>
          <span className="mx-1">/</span>
          <Link href={`/guide?tab=${system}`} className="hover:text-cream">
            {systemLabel}
          </Link>
          <span className="mx-1">/</span>
          <span>{group}</span>
        </nav>
      </div>
      <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="self-center lg:self-start">{image}</div>
        <div className="flex flex-col gap-5">{children}</div>
      </div>
    </PageContainer>
  );
}

/** 正方形の大きな画像枠(内側にもう一重の枠) */
export function GuideDetailFrame({ children, portrait = false }: { children: ReactNode; portrait?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-gold/35 bg-popover ${
        portrait
          ? "w-[220px] rounded-[20px] lg:w-[300px]"
          : "aspect-square w-[220px] rounded-[28px] lg:w-[360px]"
      }`}
    >
      {!portrait && <span aria-hidden="true" className="pointer-events-none absolute inset-3.5 z-10 rounded-[18px] border border-gold/15" />}
      {children}
    </div>
  );
}
