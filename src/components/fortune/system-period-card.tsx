import { composeHeadline } from "@/data/guide";
import type { Period, SystemReading } from "@/lib/fortune/types";
import { FactChip } from "./fact-chip";

/** 占術ごとの運勢カード(占術名・期間・一文のまとめ・注記・チップ) */
export function SystemPeriodCard({ reading, period }: { reading: SystemReading; period: Period }) {
  const result = reading.periods[period];
  const headingId = `period-card-${reading.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-2.5 rounded-[20px] border border-gold/25 bg-surface p-4 lg:px-5 lg:py-[18px]"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-baseline gap-2">
          <span id={headingId} className="font-heading text-[17px] text-gold-light lg:text-lg">
            {reading.name}
          </span>
          <span className="font-accent text-sm text-gold-dark lg:text-[15px]">{reading.nameEn}</span>
        </h3>
        <p className="whitespace-nowrap text-[11px] text-gold-dim">{result.rangeLabel}</p>
      </header>
      <p className="text-sm leading-[1.7]">{composeHeadline(result.headline)}</p>
      {result.note && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-terracotta">
          <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-terracotta" />
          {result.note}
        </p>
      )}
      <ul className="flex flex-wrap gap-2" aria-label={`${reading.name}の要素`}>
        {result.chips.map((chip) => (
          <li key={chip.key}>
            <FactChip fact={chip} />
          </li>
        ))}
      </ul>
    </article>
  );
}
