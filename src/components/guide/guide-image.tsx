import Image from "next/image";
import type { CSSProperties } from "react";
import type { GuideImage } from "@/data/guide";
import { AstroGlyph } from "@/components/icons/astro-glyph";

type Size = "tile" | "sheet" | "detail";

/** タイルの文字の大きさ(px)。一番長い行の文字数で決める: 1字34 / 2字24 / 3字20 / 4字17 / 5字以上15(設計書 §10.1) */
const TILE_STEPS = [34, 24, 20, 17, 15] as const;

/**
 * シート・詳細はタイルの段階を拡大する(シート約1.9倍、詳細約4倍、PC の詳細は少し大きく)。
 * 拡大すると長い行が枠からはみ出すので、行の幅(1字 = 1em とみなす)が枠の内側に収まる大きさまでにする
 */
const SCALE: Record<Size, { base: number; lg: number; maxWidth: number; maxWidthLg: number }> = {
  tile: { base: 1, lg: 1, maxWidth: Infinity, maxWidthLg: Infinity },
  // 120px(PC は 140px)の枠
  sheet: { base: 1.9, lg: 1.9, maxWidth: 112, maxWidthLg: 132 },
  // 220px(PC は 360px)の枠の内側の枠
  detail: { base: 4, lg: 4.8, maxWidth: 184, maxWidthLg: 324 },
};

/** タイルの最小の大きさ */
const MIN_TILE = 15;

/** 文字の大きさ(px)。base はスマホ、lg は PC(1024px〜) */
export function glyphFontSize(text: string, size: Size): { base: number; lg: number } {
  const longest = Math.max(1, ...text.split("\n").map((line) => [...line].length));
  const step = Math.max(MIN_TILE, TILE_STEPS[Math.min(longest, TILE_STEPS.length) - 1]);
  const { base, lg, maxWidth, maxWidthLg } = SCALE[size];
  const fit = (scale: number, width: number) => Math.min(Math.round(step * scale), Math.floor(width / longest));
  return { base: fit(base, maxWidth), lg: fit(lg, maxWidthLg) };
}

/** 早見表の画像枠の中身。枠(大きさ・角丸・背景)は呼び出し側が持つ */
export function GuideImageView({ image, size }: { image: GuideImage; size: Size }) {
  if (image.kind === "astro") {
    const px = { tile: 34, sheet: 64, detail: 140 }[size];
    // AstroGlyph は style を受け取らないので、色は外側の span で付ける(線は currentColor)
    return (
      <span aria-hidden="true" className="inline-flex" style={{ color: image.color ?? "#E5B85A" }}>
        <AstroGlyph name={image.name} size={px} strokeWidth={size === "tile" ? 1.6 : 1.3} />
      </span>
    );
  }
  if (image.kind === "photo") {
    return (
      <Image src={image.path} alt={image.alt} width={240} height={400} className="h-full w-full object-cover" />
    );
  }
  const { base, lg } = glyphFontSize(image.text, size);
  const style = {
    color: image.color ?? "#E5B85A",
    "--glyph-size": `${base}px`,
    "--glyph-size-lg": `${lg}px`,
  } as CSSProperties;
  // 名前は枠の外(タイルのラベル・見出し)にあるので、文字の絵は読み上げない。
  // 改行(\n)で行を分け、自動の折り返しは行の長さをそろえる
  return (
    <span
      aria-hidden="true"
      className="whitespace-pre-line px-1 text-center font-heading text-[length:var(--glyph-size)] leading-[1.15] text-balance lg:text-[length:var(--glyph-size-lg)]"
      style={style}
    >
      {image.text}
    </span>
  );
}
