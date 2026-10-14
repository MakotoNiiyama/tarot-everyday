"use client";

import { useRef, type KeyboardEvent } from "react";
import type { Period } from "@/lib/fortune/types";

const TABS: { value: Period; label: string }[] = [
  { value: "day", label: "今日" },
  { value: "month", label: "今月" },
  { value: "year", label: "今年" },
];

/** 今日・今月・今年の切り替え(3等分のセグメント。矢印キー・Home・End に対応) */
export function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    const next = (index + TABS.length) % TABS.length;
    onChange(TABS[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") move(index + 1);
    else if (e.key === "ArrowLeft") move(index - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(TABS.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div
      role="tablist"
      aria-label="運勢の期間"
      className="grid grid-cols-3 gap-1 rounded-[14px] border border-gold/25 bg-popover p-1 lg:max-w-[360px]"
    >
      {TABS.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`min-h-10 rounded-[11px] text-sm font-bold transition-colors ${
              selected ? "bg-gold text-background" : "text-gold-dim hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
