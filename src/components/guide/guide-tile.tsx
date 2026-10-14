import Link from "next/link";
import { guideHref, type GuideEntry } from "@/data/guide";
import { GuideImageView } from "./guide-image";

/** 一覧のタイル。タロットは縦長、ほかは正方形(角丸14px・枠 gold/25) */
export function GuideTile({ entry }: { entry: GuideEntry }) {
  const portrait = entry.image.kind === "photo";
  return (
    <Link
      href={guideHref(entry.system, entry.id)}
      aria-label={`${entry.name}の詳細を見る`}
      className="group flex flex-col gap-1.5 text-cream"
    >
      <span
        data-shape={portrait ? "portrait" : "square"}
        className={`relative flex items-center justify-center overflow-hidden rounded-[14px] border border-gold/25 bg-popover transition-colors group-hover:border-gold/60 ${
          portrait ? "aspect-[3/5]" : "aspect-square"
        }`}
      >
        <GuideImageView image={entry.image} size="tile" />
      </span>
      <span className="text-center text-[11px] leading-snug lg:text-xs">{entry.name}</span>
    </Link>
  );
}
