import type { ElementType, ReactNode } from "react";

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

/**
 * 詳細の見出し表示。ボトムシートとサイドパネルで同じ見た目にする。
 * ボトムシートでは Drawer.Title / Drawer.Description を渡し、ダイアログの名前・説明と結びつける。
 */
export function DetailHeadingView({
  heading,
  titleAs: Title = "h2",
  descriptionAs: Description = "p",
}: {
  heading: DetailHeading;
  /** 見出しの要素(既定は h2) */
  titleAs?: ElementType;
  /** 補足の要素(既定は p) */
  descriptionAs?: ElementType;
}) {
  return (
    <header className="text-center">
      {heading.subtitle && <p className="text-gold-dim text-xs mb-1">{heading.subtitle}</p>}
      <Title className="font-heading text-[26px] text-cream">{heading.title}</Title>
      {heading.description && (
        <Description className="text-gold-dim text-sm font-accent mt-1">{heading.description}</Description>
      )}
    </header>
  );
}
