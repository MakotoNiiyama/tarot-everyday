"use client";

import type { Period } from "@/lib/fortune/types";
import { useRovingSelection } from "@/lib/use-roving-selection";

const TABS: { value: Period; label: string }[] = [
  { value: "day", label: "今日" },
  { value: "month", label: "今月" },
  { value: "year", label: "今年" },
];
const TAB_VALUES = TABS.map((t) => t.value);

/** 今日・今月・今年の切り替え(3等分のセグメント。矢印キー・Home・End に対応) */
export function PeriodTabs({
  value,
  onChange,
  idBase,
  panelId,
}: {
  value: Period;
  onChange: (p: Period) => void;
  /** タブの id の接頭辞。タブの id は `${idBase}-${期間}` になる(パネルの aria-labelledby に使う) */
  idBase: string;
  /** タブで切り替えるパネルの id */
  panelId: string;
}) {
  const { itemProps } = useRovingSelection({ values: TAB_VALUES, value, onChange, axis: "horizontal" });

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
            {...itemProps(i)}
            type="button"
            id={`${idBase}-${t.value}`}
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => onChange(t.value)}
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
