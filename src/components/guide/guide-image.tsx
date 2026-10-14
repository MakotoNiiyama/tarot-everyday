import Image from "next/image";
import type { GuideImage } from "@/data/guide";

type Size = "tile" | "sheet" | "detail";

/** 文字数に応じたタイポグラフィの大きさ(設計書 §10.1: 1字34px / 2字24px / 3字以上 15〜20px をタイル基準に拡大) */
const GLYPH_CLASS: Record<Size, [string, string, string, string]> = {
  tile: ["text-[34px]", "text-[24px]", "text-[16px]", "text-[11px]"],
  sheet: ["text-[64px]", "text-[44px]", "text-[26px]", "text-[16px]"],
  detail: ["text-[132px] lg:text-[160px]", "text-[88px] lg:text-[110px]", "text-[48px] lg:text-[60px]", "text-[26px] lg:text-[32px]"],
};

function glyphClass(text: string, size: Size): string {
  const length = [...text].length;
  const [one, two, short, long] = GLYPH_CLASS[size];
  if (length <= 1) return one;
  if (length === 2) return two;
  if (length <= 4) return short;
  return long;
}

/** 早見表の画像枠の中身。枠(大きさ・角丸・背景)は呼び出し側が持つ */
export function GuideImageView({ image, size }: { image: GuideImage; size: Size }) {
  if (image.kind === "photo") {
    return (
      <Image src={image.path} alt={image.alt} width={240} height={400} className="h-full w-full object-cover" />
    );
  }
  return (
    <span
      className={`px-1 text-center font-heading leading-tight ${glyphClass(image.text, size)}`}
      style={{ color: image.color ?? "#E5B85A" }}
    >
      {image.text}
    </span>
  );
}
