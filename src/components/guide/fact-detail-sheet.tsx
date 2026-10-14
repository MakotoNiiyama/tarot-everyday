"use client";

import type { ReactNode } from "react";
import { DetailGuideLink } from "@/components/detail/detail-heading";
import { DetailSheet } from "@/components/detail/detail-sheet";
import { getGuideEntry, guideHref, type GuideEntry } from "@/data/guide";
import type { Fact } from "@/lib/fortune/types";
import { ElementDetailSheet } from "./element-detail-sheet";
import { GuideEntryBody } from "./guide-entry-body";

/**
 * 計算結果の事実(Fact)をタップすると、参照している早見表の項目を詳細シート(PC幅ではサイドパネル)で開く。
 * 参照が1つなら ElementDetailSheet と同じ。複数(吉方位、出生時刻で分かれる候補など)なら、
 * 1つのシートに項目ごとの節(名前・本文・早見表へのリンク)を並べる。参照先がなければトリガーの中身だけを表示する。
 *
 * children はトリガーの <button> の中に入るので、フレージングコンテンツ(span・テキストなど)だけにすること
 */
export function FactDetailSheet({
  fact,
  children,
  className,
}: {
  fact: Fact;
  /** トリガーの中身。フレージングコンテンツだけ */
  children: ReactNode;
  className?: string;
}) {
  const found = fact.refs
    .map((ref) => ({ ref, entry: getGuideEntry(ref.system, ref.id) }))
    .filter((f): f is { ref: (typeof f)["ref"]; entry: GuideEntry } => f.entry !== undefined);

  if (fact.refs.length === 1 || found.length === 1) {
    const ref = found[0]?.ref ?? fact.refs[0];
    return (
      <ElementDetailSheet element={ref} className={className}>
        {children}
      </ElementDetailSheet>
    );
  }
  if (found.length === 0) return <span className={className}>{children}</span>;

  return (
    <DetailSheet
      heading={{ title: `${fact.label} ${fact.value}` }}
      body={
        <div className="flex flex-col gap-6">
          {found.map(({ entry }) => {
            const range = fact.candidates?.find((c) => c.value === entry.name || c.value.includes(entry.name))?.rangeLabel;
            const headingId = `fact-${fact.key}-${entry.system}-${entry.id}`;
            return (
              <section key={`${entry.system}:${entry.id}`} aria-labelledby={headingId} className="flex flex-col gap-3">
                <h3 id={headingId} className="flex items-baseline justify-center gap-2 font-heading text-lg text-cream">
                  {entry.name}
                  {range && <span className="font-sans text-xs text-gold-dim">{range}</span>}
                </h3>
                <GuideEntryBody entry={entry} showImage={false} headingLevel={4} />
                <DetailGuideLink href={guideHref(entry.system, entry.id)} label={`${entry.name}を早見表で見る`} />
              </section>
            );
          })}
        </div>
      }
      className={className}
    >
      {children}
    </DetailSheet>
  );
}
