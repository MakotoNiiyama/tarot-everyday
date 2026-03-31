import Link from "next/link";
import type { TarotCard } from "@/data/types";
import { suitNames } from "@/lib/tarot-utils";

export function CardList({ cards }: { cards: TarotCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="flex items-center gap-3 px-3 py-2 rounded-lg
            hover:bg-surface/60 transition-colors focus-visible:outline-2 focus-visible:outline-gold"
          aria-label={`${card.name.ja}の詳細を見る`}
        >
          {/* 番号 */}
          <span className="text-gold-dim text-xs w-8 text-right font-mono flex-shrink-0">
            {card.arcana === "major"
              ? String(card.number).padStart(2, "0")
              : card.number}
          </span>
          {/* カード名 */}
          <span className="text-cream text-sm font-heading flex-1 min-w-0 truncate">
            {card.name.ja}
          </span>
          {/* スーツ / アルカナ */}
          <span className="text-gold-dim text-[10px] flex-shrink-0">
            {card.suit ? suitNames[card.suit].medium : "大アルカナ"}
          </span>
          {/* キーワード（正位置1つ目） */}
          <span className="text-gold-dark text-[10px] flex-shrink-0 max-w-20 truncate hidden sm:inline">
            {card.keywords.upright[0]}
          </span>
        </Link>
      ))}
    </div>
  );
}
