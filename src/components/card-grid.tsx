import type { TarotCard } from "@/data/types";
import { CardTile } from "./card-tile";

interface CardGridProps {
  cards: TarotCard[];
  /** グループラベル（大アルカナ、ワンドなど） */
  label?: string;
}

export function CardGrid({ cards, label }: CardGridProps) {
  if (cards.length === 0) return null;

  return (
    <section aria-label={label}>
      {label && (
        <h2 className="text-gold font-heading text-base font-bold mb-2 pl-1">
          {label}
        </h2>
      )}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}
      >
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
