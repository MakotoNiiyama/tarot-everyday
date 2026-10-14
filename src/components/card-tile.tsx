import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";

export function CardTile({ card }: { card: TarotCard }) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className="group flex flex-col items-center gap-1 p-2 rounded-lg
        hover:bg-surface/60 transition-colors focus-visible:outline-2 focus-visible:outline-gold"
      aria-label={`${card.name.ja}の詳細を見る`}
    >
      {/* カード画像 */}
      <div className="w-20 h-[120px] flex-shrink-0 rounded-md overflow-hidden border border-gold/25 shadow-sm shadow-gold/10">
        <Image
          src={card.imagePath}
          alt={card.name.ja}
          width={80}
          height={120}
          className="w-full h-full object-cover"
        />
      </div>
      {/* カード名 */}
      <span className="text-cream text-xs leading-tight text-center font-heading line-clamp-2 group-hover:text-gold transition-colors">
        {card.name.ja}
      </span>
    </Link>
  );
}
