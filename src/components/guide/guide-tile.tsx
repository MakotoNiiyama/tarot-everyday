"use client";

import Link from "next/link";
import { guideHref, type GuideEntry } from "@/data/guide";
import { markGuideNavigation } from "@/lib/guide-back";
import { GuideEntryImage } from "./guide-entry-image";

/** タイル(リンク・ボタン)に付けるクラス */
export const GUIDE_TILE_CLASS = "group flex w-full flex-col gap-1.5 text-cream";

/** タイルの見た目(画像枠と名前)。リンクやボタンの中に入るよう、span だけで組む */
export function GuideTileFace({ entry }: { entry: GuideEntry }) {
  const portrait = entry.image.kind === "photo";
  return (
    <>
      <span
        data-shape={portrait ? "portrait" : "square"}
        className={`relative flex items-center justify-center overflow-hidden rounded-[14px] border border-gold/25 bg-popover transition-colors group-hover:border-gold/60 ${
          portrait ? "aspect-[3/5]" : "aspect-square"
        }`}
      >
        <GuideEntryImage entry={entry} size="tile" />
      </span>
      <span className="text-center text-[11px] leading-snug lg:text-xs">{entry.name}</span>
    </>
  );
}

/**
 * 詳細ページへのリンクのタイル(詳細ページの関連項目)。タロットは縦長、ほかは正方形(角丸14px・枠 gold/25)。
 * 絵画・写真のある項目も同じ正方形の枠に切り抜く。早見表の中の移動なので、戻るボタンで戻れるよう印を立てる
 */
export function GuideTile({ entry }: { entry: GuideEntry }) {
  return (
    <Link
      href={guideHref(entry.system, entry.id)}
      aria-label={`${entry.name}の詳細を見る`}
      onClick={markGuideNavigation}
      className={GUIDE_TILE_CLASS}
    >
      <GuideTileFace entry={entry} />
    </Link>
  );
}
