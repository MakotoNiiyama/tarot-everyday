"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { TarotCard, Suit } from "@/data/types";
import { CardGrid } from "./card-grid";
import { CardList } from "./card-list";

type FilterType = "all" | "major" | Suit;
type ViewMode = "grid" | "list";

const STORAGE_KEY = "tarot-view-mode";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "全て" },
  { value: "major", label: "大アルカナ" },
  { value: "wands", label: "ワンド" },
  { value: "cups", label: "カップ" },
  { value: "swords", label: "ソード" },
  { value: "pentacles", label: "ペンタクル" },
];

interface CardBrowserProps {
  cards: TarotCard[];
}

export function CardBrowser({ cards }: CardBrowserProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // localStorage から表示モードを復元
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "grid" ? "list" : "grid";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // フィルター＋検索
  const filteredCards = useMemo(() => {
    let result = cards;

    // フィルター
    if (filter === "major") {
      result = result.filter((c) => c.arcana === "major");
    } else if (filter !== "all") {
      result = result.filter((c) => c.suit === filter);
    }

    // 検索
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.ja.toLowerCase().includes(q) ||
          c.name.en.toLowerCase().includes(q) ||
          c.keywords.upright.some((k) => k.includes(q)) ||
          c.keywords.reversed.some((k) => k.includes(q))
      );
    }

    return result;
  }, [cards, filter, search]);

  return (
    <div className="flex flex-col gap-4">
      {/* 検索バー */}
      <div className="relative">
        <input
          type="search"
          placeholder="カード名・キーワードで検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface/60 border border-gold/20 rounded-lg px-3 py-2 pl-9
            text-cream text-sm placeholder:text-gold-dim/50
            focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30
            transition-colors"
          aria-label="カード検索"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-dim/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
      </div>

      {/* フィルターバー + 表示切替 */}
      <div className="flex items-center gap-2">
        <div
          className="flex gap-1 flex-1 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="カードフィルター"
        >
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-heading whitespace-nowrap
                transition-colors flex-shrink-0
                ${
                  filter === opt.value
                    ? "bg-gold text-background font-bold"
                    : "bg-surface/40 text-gold-dim hover:bg-surface/80"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* リスト/グリッド切替 */}
        <button
          onClick={toggleViewMode}
          className="p-2 rounded-lg bg-surface/40 text-gold-dim hover:bg-surface/80 transition-colors flex-shrink-0"
          aria-label={
            viewMode === "grid"
              ? "リスト表示に切り替え"
              : "グリッド表示に切り替え"
          }
        >
          {viewMode === "grid" ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          )}
        </button>
      </div>

      {/* 結果件数 */}
      <p className="text-gold-dim text-xs">
        {filteredCards.length}枚のカード
        {search && `（「${search}」で検索）`}
      </p>

      {/* カード表示 */}
      {filteredCards.length === 0 ? (
        <p className="text-gold-dim/60 text-sm text-center py-8">
          該当するカードが見つかりません
        </p>
      ) : viewMode === "grid" ? (
        <CardGrid cards={filteredCards} />
      ) : (
        <CardList cards={filteredCards} />
      )}
    </div>
  );
}
