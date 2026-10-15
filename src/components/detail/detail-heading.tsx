import Link from "next/link";
import type { ElementType, MouseEvent, ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { outlineButton } from "@/lib/button-styles";
import { isPlainClick, markGuideNavigation } from "@/lib/guide-back";

/** 詳細表示の見出し。subtitle は分類(例「大アルカナ」) */
export interface DetailHeading {
  title: string;
  subtitle?: string;
  /** 読み(ひらがな)。通常の書体で表示する */
  reading?: string;
  /** 英名。アクセントの書体で表示する */
  nameEn?: string;
  /** そのほかの補足 */
  description?: string;
}

/** 詳細表示の中身(見出し+本文) */
export interface DetailContent {
  heading: DetailHeading;
  body: ReactNode;
  /** 早見表の該当ページ。あれば本文の末尾に「早見表で見る」リンクを出す */
  guideHref?: string;
  /** 早見表の一覧から開いたとき。リンクを「詳しく見る」にし、詳細ページの戻るボタンで一覧に戻れるようにする */
  inGuide?: boolean;
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
      {/* 読み・英名・補足はまとめてダイアログの説明にする */}
      {(heading.reading || heading.nameEn || heading.description) && (
        <Description className="mt-1 flex flex-col items-center gap-0.5">
          {heading.reading && <span className="text-gold-dim text-sm">{heading.reading}</span>}
          {heading.nameEn && <span className="text-gold-dim text-sm font-accent">{heading.nameEn}</span>}
          {heading.description && <span className="text-gold-dim text-sm font-accent">{heading.description}</span>}
        </Description>
      )}
    </header>
  );
}

/**
 * 詳細の末尾に置く、早見表の該当ページへのリンク。ボトムシートとサイドパネルで共通。
 * inGuide(早見表の一覧から開いたとき)は「詳しく見る」にし、詳細ページの戻るボタンが一覧に戻れるよう印を立てる
 */
export function DetailGuideLink({
  href,
  label,
  inGuide = false,
  onNavigate,
}: {
  href: string;
  /** 同じ表示に複数並ぶときの、区別できる名前 */
  label?: string;
  inGuide?: boolean;
  /** 同じタブでページを移るとき(修飾キーなしのクリック)に呼ぶ */
  onNavigate?: () => void;
}) {
  const onClick = (e: MouseEvent) => {
    if (inGuide) markGuideNavigation(e);
    if (onNavigate && isPlainClick(e)) onNavigate();
  };
  return (
    <Link href={href} aria-label={label} onClick={onClick} className={`${outlineButton} mt-2 w-full`}>
      {inGuide ? "詳しく見る" : "早見表で見る"}
      <Icon name="right" size={16} />
    </Link>
  );
}
