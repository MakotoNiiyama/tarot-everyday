"use client";

import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import type { Fact, NatalChart } from "@/lib/fortune/types";

/** 候補に分かれたセルは「A / B」 */
export const factDisplayValue = (f: Fact) =>
  f.candidates ? f.candidates.map((c) => c.value).join(" / ") : f.value;

function PillarTable({ chart, label }: { chart: Extract<NatalChart, { kind: "pillars" }>; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <caption className="sr-only">{label}</caption>
        <colgroup>
          <col className="w-11" />
          {chart.columns.map((c) => (
            <col key={c} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td />
            {chart.columns.map((c) => (
              <th key={c} scope="col" className="pb-0.5 text-[11px] font-normal text-gold-dim">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="text-left text-[11px] font-normal leading-tight text-gold-dim">
                {row.label}
              </th>
              {row.cells.map((f, i) => (
                <td key={f?.key ?? `${row.label}-${i}`} className="p-0">
                  {f ? (
                    f.refs.length > 0 ? (
                      <FactDetailSheet
                        fact={f}
                        className={`flex min-h-10 w-full items-center justify-center rounded-lg bg-popover px-1 py-2 font-heading text-[15px] leading-tight break-keep hover:bg-popover/70 ${
                          f.candidates ? "text-[12px] text-terracotta" : "text-cream"
                        }`}
                      >
                        {factDisplayValue(f)}
                      </FactDetailSheet>
                    ) : (
                      <FactDetailSheet
                        fact={f}
                        className={`flex min-h-10 w-full items-center justify-center rounded-lg bg-popover px-1 py-2 font-heading text-[11px] leading-tight text-gold-dim${
                          f.candidates ? " text-terracotta" : ""
                        }`}
                      >
                        {factDisplayValue(f)}
                      </FactDetailSheet>
                    )
                  ) : (
                    <span className="sr-only">時刻不明のため算出なし</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TONE_CLASS: Record<"center" | "main" | "sub", { box: string; value: string }> = {
  center: { box: "border border-gold bg-gold/12 hover:bg-gold/18", value: "font-heading text-lg text-gold-light" },
  main: { box: "border border-gold/20 bg-popover hover:bg-popover/70", value: "font-heading text-[15px] text-cream" },
  sub: { box: "border border-gold/10 bg-popover/60 hover:bg-popover/70", value: "text-[13px] text-gold-dim" },
};

function BodyStarChart({ chart, label }: { chart: Extract<NatalChart, { kind: "body-stars" }>; label: string }) {
  return (
    <ul role="list" aria-label={label} className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-1.5">
      {chart.cells.map((cell, i) => {
        if (!cell) return <li key={`empty-${i}`} aria-hidden="true" role="presentation" />;
        const tone = TONE_CLASS[cell.tone];
        const hasRefs = cell.fact.refs.length > 0;
        const boxClass = hasRefs ? tone.box : tone.box.replace(/\bhover:\S+/g, "").trim();
        return (
          <li key={cell.fact.key}>
            <FactDetailSheet
              fact={cell.fact}
              className={`grid h-full min-h-[72px] w-full content-center justify-items-center gap-1 rounded-xl px-1 py-2 text-center ${boxClass}`}
            >
              <span className="text-[10px] leading-tight text-gold-dim">{cell.fact.label}</span>
              <span className="sr-only">、</span>
              <span
                data-tone={cell.tone}
                className={`leading-tight break-keep ${cell.fact.candidates ? "text-[12px] text-terracotta" : tone.value}`}
              >
                {factDisplayValue(cell.fact)}
              </span>
            </FactDetailSheet>
          </li>
        );
      })}
    </ul>
  );
}

/** 人物像の専用の図(四柱推命の命式表・算命学の人体星図) */
export function NatalChartView({ chart, systemName }: { chart: NatalChart; systemName: string }) {
  // 西洋占星術のチャート円は horoscope-chart.tsx で描く(未接続の間は何も出さない)
  if (chart.kind === "horoscope") return null;
  const label = chart.kind === "pillars" ? `${systemName}の命式` : `${systemName}の人体星図`;
  return chart.kind === "pillars" ? (
    <PillarTable chart={chart} label={label} />
  ) : (
    <BodyStarChart chart={chart} label={label} />
  );
}
