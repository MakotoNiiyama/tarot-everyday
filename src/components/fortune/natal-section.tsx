"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import { getGuideEntry } from "@/data/guide";
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

/** 「あなたについて」。占術ごとの人物像をアコーディオンで表示する */
export function NatalSection({ readings }: { readings: SystemReading[] }) {
  return (
    <section aria-labelledby="natal-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <p className="font-accent text-xl leading-none text-gold">About you</p>
        <h2 id="natal-heading" className="font-heading text-xl">
          あなたについて
        </h2>
      </div>
      <Accordion className="flex flex-col gap-2">
        {readings.map((r) => {
          const charted = new Set(r.chart?.factKeys ?? []);
          const tiles = r.chart ? [] : r.natal.slice(0, 3);
          const rows = r.chart ? r.natal.filter((f) => !charted.has(f.key)) : r.natal.slice(3);
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
                {r.chart ? (
                  <NatalChartView chart={r.chart} systemName={r.name} />
                ) : (
                  <ul className="grid grid-cols-3 gap-2">
                    {tiles.map((f) => (
                      <li key={f.key}>
                        <FactTile fact={f} />
                      </li>
                    ))}
                  </ul>
                )}
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
                {summary && <p className="text-[13px] leading-[1.7]">{summary}</p>}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
