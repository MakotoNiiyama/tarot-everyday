"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { GuideEntry } from "@/data/guide";
import { GuideDetailFrame } from "./guide-detail-layout";
import { GuideImageView } from "./guide-image";

type Size = "tile" | "sheet" | "detail";

/**
 * 項目の絵画・写真(photo)を返す。読み込みに失敗したら(画像をダウンロードしていない環境など)undefined にする。
 * 失敗したパスで覚えるので、別の項目に変わったときは新しいパスでもう一度読む
 */
export function useGuidePhoto(entry: GuideEntry) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const photo = entry.photo && entry.photo.path !== failedPath ? entry.photo : undefined;
  const onError = () => {
    if (entry.photo) setFailedPath(entry.photo.path);
  };
  return { photo, onError };
}

/** 文字を重ねるときに絵を暗くするフィルター */
export const DIMMED_PHOTO_FILTER = "brightness(0.42) saturate(0.85)";

/** 枠いっぱいに切り抜いた絵画・写真。枠(relative・overflow-hidden・角丸)は呼び出し側が持つ。dimmed は上に文字を重ねるとき */
export function GuidePhotoImage({
  photo,
  onError,
  dimmed = false,
}: {
  photo: NonNullable<GuideEntry["photo"]>;
  onError: () => void;
  dimmed?: boolean;
}) {
  return (
    <Image
      src={photo.path}
      alt={photo.alt}
      fill
      sizes="(min-width: 1024px) 360px, 220px"
      className="object-cover"
      style={{
        objectPosition: photo.focus,
        ...(photo.zoom ? { transform: `scale(${photo.zoom})`, transformOrigin: photo.focus } : {}),
        ...(dimmed ? { filter: DIMMED_PHOTO_FILTER } : {}),
      }}
      onError={onError}
    />
  );
}

/**
 * 項目の線画(lineArt)を返す。読み込みに失敗したら undefined にする(useGuidePhoto と同じ)。
 * mask-image は読み込めないと何も描かないので、同じ画像を隠した img でも読み、その成否で決める
 */
export function useGuideLineArt(entry: GuideEntry) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const lineArt = entry.lineArt && entry.lineArt.path !== failedPath ? entry.lineArt : undefined;
  const onError = () => {
    if (entry.lineArt) setFailedPath(entry.lineArt.path);
  };
  return { lineArt, onError };
}

/** 線画を項目の色で塗って枠の約78%の大きさに描く。枠(relative)は呼び出し側が持つ */
export function GuideLineArtImage({
  lineArt,
  color,
  onError,
}: {
  lineArt: NonNullable<GuideEntry["lineArt"]>;
  color: string;
  onError: () => void;
}) {
  const mask = `url(${lineArt.path})`;
  const style: CSSProperties = {
    backgroundColor: color,
    maskImage: mask,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: mask,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
  };
  return (
    <>
      <span aria-hidden="true" data-line-art={lineArt.path} className="absolute inset-[11%]" style={style} />
      {/*
        読み込めたかを確かめるための画像(表示しない)。ハイドレーションの前に失敗していたときは
        onError が呼ばれないので、ref で complete・naturalWidth も見る
      */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 表示しない確認用の画像なので最適化は不要 */}
      <img
        src={lineArt.path}
        alt=""
        hidden
        onError={onError}
        ref={(img) => {
          if (img?.complete && img.naturalWidth === 0) onError();
        }}
      />
    </>
  );
}

/**
 * 早見表の項目の画像枠の中身。lineArt があれば線画を、photo があれば絵画・写真を出し、読み込めなければ image(記号・文字・カード)に戻す。
 * photo.tileOverlay の項目は、タイルだけ絵を暗くして上に image の文字を重ねる。
 * 枠は relative・overflow-hidden にすること
 */
export function GuideEntryImage({ entry, size }: { entry: GuideEntry; size: Size }) {
  const { photo, onError } = useGuidePhoto(entry);
  const { lineArt, onError: onLineArtError } = useGuideLineArt(entry);
  if (lineArt) return <GuideLineArtImage lineArt={lineArt} color={imageColor(entry)} onError={onLineArtError} />;
  if (!photo) return <GuideImageView image={entry.image} size={size} />;
  if (size === "tile" && photo.tileOverlay) {
    // タイルは絵を暗くし、上に元の文字(十二支の漢字など)を重ねる。影は文字に受け継がれる
    return (
      <>
        <GuidePhotoImage photo={photo} onError={onError} dimmed />
        <span
          data-overlay=""
          className="absolute inset-0 flex items-center justify-center [text-shadow:0_1px_3px_rgb(0_0_0/0.75),0_0_10px_rgb(0_0_0/0.5)]"
        >
          <GuideImageView image={entry.image} size={size} />
        </span>
      </>
    );
  }
  return <GuidePhotoImage photo={photo} onError={onError} />;
}

/** 出典の文字。括弧の中は途中で折り返さない */
function CreditText({ text }: { text: string }) {
  return text.split(/(\([^)]*\))/).map((part, i) =>
    part.startsWith("(") ? (
      <span key={i} className="inline-block">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** 線画を塗る色(項目の文字・記号の色) */
function imageColor(entry: GuideEntry): string {
  return ("color" in entry.image && entry.image.color) || "#E5B85A";
}

/** 詳細ページの大きな画像枠。絵画・写真・線画を出せたときは下に出典を書く */
export function GuideDetailImage({ entry }: { entry: GuideEntry }) {
  const { photo, onError } = useGuidePhoto(entry);
  const { lineArt, onError: onLineArtError } = useGuideLineArt(entry);
  const caption = lineArt ? (
    <>
      画像: <CreditText text={lineArt.credit} />・<span className="inline-block">パブリックドメイン</span>
    </>
  ) : photo ? (
    <>
      画像: {photo.credit}・<span className="inline-block">パブリックドメイン(Wikimedia Commons)</span>
    </>
  ) : null;
  return (
    <figure className="flex flex-col items-center gap-2">
      <GuideDetailFrame>
        {lineArt ? (
          <GuideLineArtImage lineArt={lineArt} color={imageColor(entry)} onError={onLineArtError} />
        ) : photo ? (
          <GuidePhotoImage photo={photo} onError={onError} />
        ) : (
          <GuideImageView image={entry.image} size="detail" />
        )}
      </GuideDetailFrame>
      {caption && (
        <figcaption className="max-w-[320px] text-center text-[11px] leading-relaxed text-gold-dim lg:max-w-[360px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
