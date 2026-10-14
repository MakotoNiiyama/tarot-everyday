// タロットカード詳細ページ（新URL）
import { notFound } from "next/navigation";
import { allCards, getCardById } from "@/data/cards";
import { CardDetail } from "@/components/card-detail";

export function generateStaticParams() {
  return allCards.map((card) => ({ id: card.id }));
}

export default async function GuideTarotCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCardById(id);

  if (!card) {
    notFound();
  }

  return <CardDetail card={card} />;
}
