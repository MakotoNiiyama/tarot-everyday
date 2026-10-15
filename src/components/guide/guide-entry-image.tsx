"use client";

import Image from "next/image";
import { useState } from "react";
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

/** 枠いっぱいに切り抜いた絵画・写真。枠(relative・overflow-hidden・角丸)は呼び出し側が持つ */
export function GuidePhotoImage({
  photo,
  onError,
}: {
  photo: NonNullable<GuideEntry["photo"]>;
  onError: () => void;
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
      }}
      onError={onError}
    />
  );
}

/**
 * 早見表の項目の画像枠の中身。photo があれば絵画・写真を出し、読み込めなければ image(記号・文字・カード)に戻す。
 * 枠は relative・overflow-hidden にすること
 */
export function GuideEntryImage({ entry, size }: { entry: GuideEntry; size: Size }) {
  const { photo, onError } = useGuidePhoto(entry);
  if (!photo) return <GuideImageView image={entry.image} size={size} />;
  return <GuidePhotoImage photo={photo} onError={onError} />;
}

/** 詳細ページの大きな画像枠。絵画・写真を出せたときは下に出典を書く */
export function GuideDetailImage({ entry }: { entry: GuideEntry }) {
  const { photo, onError } = useGuidePhoto(entry);
  return (
    <figure className="flex flex-col items-center gap-2">
      <GuideDetailFrame>
        {photo ? (
          <GuidePhotoImage photo={photo} onError={onError} />
        ) : (
          <GuideImageView image={entry.image} size="detail" />
        )}
      </GuideDetailFrame>
      {photo && (
        <figcaption className="max-w-[320px] text-center text-[11px] leading-relaxed text-gold-dim lg:max-w-[360px]">
          画像: {photo.credit}・<span className="inline-block">パブリックドメイン(Wikimedia Commons)</span>
        </figcaption>
      )}
    </figure>
  );
}
