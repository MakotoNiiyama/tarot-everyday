import type { ReactNode } from "react";

/** 詳細表示の見出し。subtitle は分類(例「大アルカナ」)、description は補足(例: 英名・読み) */
export interface DetailHeading {
  title: string;
  subtitle?: string;
  description?: string;
}

/** 詳細表示の中身(見出し+本文) */
export interface DetailContent {
  heading: DetailHeading;
  body: ReactNode;
}

/** パネル用の見出し表示。ボトムシートでは Drawer.Title を使うため detail-sheet.tsx 側で描く */
export function DetailHeadingView({ heading }: { heading: DetailHeading }) {
  return (
    <header className="text-center">
      {heading.subtitle && <p className="text-gold-dim text-xs mb-1">{heading.subtitle}</p>}
      <h2 className="font-heading text-[26px] text-cream">{heading.title}</h2>
      {heading.description && (
        <p className="text-gold-dim text-sm font-accent mt-1">{heading.description}</p>
      )}
    </header>
  );
}
