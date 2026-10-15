"use client";

import { useId } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import { getGuideEntry } from "@/data/guide";
import { joinNatalNotes } from "@/lib/fortune/natal-notes";
import type { Fact, SystemReading } from "@/lib/fortune/types";
import { NatalChartView, factDisplayValue } from "./natal-chart";

/** 1つの事実のタイル(タップで詳細) */
function FactTile({ fact }: { fact: Fact }) {
  const long = [...fact.value].length > 4;
  return (
    <FactDetailSheet
      fact={fact}
      className="grid h-full w-full grid-rows-[28px_56px] items-center justify-items-center rounded-xl bg-popover px-1.5 py-2.5 text-center hover:bg-popover/70"
    >
      <span className="self-start text-[10px] leading-tight text-gold-dim">{fact.label}</span>
      <span className="sr-only">、</span>
      <span
        className={`font-heading leading-[1.15] break-keep ${fact.candidates ? "text-terracotta" : "text-gold-light"} ${
          long ? "text-[15px]" : "text-2xl"
        }`}
      >
        {factDisplayValue(fact)}
      </span>
    </FactDetailSheet>
  );
}

function CandidateNote({ fact }: { fact: Fact }) {
  if (!fact.candidates) return null;
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-terracotta">
      <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-terracotta" />
      {fact.label} 候補: {fact.candidates.map((c) => `${c.value}(${c.rangeLabel})`).join(" / ")}
    </p>
  );
}

/** 人物像の見出し。既定は自分のプロフィール用の「あなたについて」 */
export interface NatalHeading {
  /** 見出し(セクションの名前にもなる) */
  title: string;
  /** 見出しの上の Caveat の一言 */
  accent: string;
}

const DEFAULT_HEADING: NatalHeading = { title: "あなたについて", accent: "About you" };

/** 「あなたについて」。占術ごとの人物像をアコーディオンで表示する */
export function NatalSection({ readings, heading = DEFAULT_HEADING }: { readings: SystemReading[]; heading?: NatalHeading }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <p className="font-accent text-xl leading-none text-gold">{heading.accent}</p>
        <h2 id={headingId} className="font-heading text-xl">
          {heading.title}
        </h2>
      </div>
      <Accordion className="flex flex-col gap-2">
        {readings.map((r) => {
          const charted = new Set(r.chart?.factKeys ?? []);
          // 西洋占星術は図があっても先頭の3つ(太陽・月・ASC)をタイルで出す
          const tiles = !r.chart || r.chart.kind === "horoscope" ? r.natal.slice(0, 3) : [];
          const rows = r.chart ? r.natal.filter((f) => !charted.has(f.key) && !tiles.includes(f)) : r.natal.slice(3);
          const first = r.natal[0]?.refs[0];
          const summary = first ? getGuideEntry(first.system, first.id)?.summary : undefined;
          return (
            <AccordionItem
              key={r.id}
              value={r.id}
              className="overflow-hidden rounded-2xl border border-gold/25 bg-surface"
            >
              <AccordionTrigger className="min-h-[52px] px-4 font-heading text-base text-cream">{r.name}</AccordionTrigger>
              {/* 間隔は gap で取るので、AccordionContent が段落に付ける下の余白は打ち消す */}
              <AccordionContent className="flex flex-col gap-3 px-4 pb-4 [&_p:not(:last-child)]:mb-0">
                {tiles.length > 0 && (
                  <ul className="grid grid-cols-3 gap-2">
                    {tiles.map((f) => (
                      <li key={f.key}>
                        <FactTile fact={f} />
                      </li>
                    ))}
                  </ul>
                )}
                {r.chart && <NatalChartView chart={r.chart} systemName={r.name} />}
                {rows.length > 0 && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                    {rows.map((f) => (
                      <div key={f.key} className="contents">
                        <dt className="text-gold-dim">{f.label}</dt>
                        <dd>
                          <FactDetailSheet fact={f} className="text-left underline decoration-gold/30 underline-offset-4 hover:text-gold-light">
                            {f.value}
                          </FactDetailSheet>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {r.natal.map((f) => (
                  <CandidateNote key={f.key} fact={f} />
                ))}
                {(summary || r.highlights) && (
                  <p className="text-[13px] leading-[1.7]">{joinNatalNotes(summary, r.highlights)}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
