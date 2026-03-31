import Link from "next/link";
import Image from "next/image";
import type { TarotCard } from "@/data/types";
import { toRoman, suitColorClass, suitSymbol } from "@/lib/tarot-utils";

/** スクラッチアート風のミニカードSVG */
function MiniCardSvg({
  number,
  arcana,
  suit,
}: {
  number: number;
  arcana: string;
  suit?: string;
}) {
  const accentClass = suit ? suitColorClass[suit as keyof typeof suitColorClass] ?? "text-gold" : "text-gold";

  return (
    <svg
      viewBox="0 0 60 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${accentClass}`}
      aria-hidden="true"
    >
      {/* カード外枠 */}
      <rect
        x="2"
        y="2"
        width="56"
        height="86"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
      />
      {/* 内枠 */}
      <rect
        x="6"
        y="6"
        width="48"
        height="78"
        rx="2"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.3"
        strokeDasharray="3 2"
      />
      {/* 番号 */}
      <text
        x="30"
        y="42"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        fontSize={arcana === "major" ? "18" : "14"}
        fontFamily="serif"
        opacity="0.8"
      >
        {arcana === "major" ? toRoman(number) : number}
      </text>
      {/* スーツシンボル（小アルカナのみ） */}
      {suit && (
        <text
          x="30"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize="10"
          opacity="0.5"
        >
          {suitSymbol(suit)}
        </text>
      )}
      {/* 四隅の装飾 */}
      <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="50" cy="10" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="10" cy="80" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="50" cy="80" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

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
