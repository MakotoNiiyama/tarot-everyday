// 旧URLからの転送ページ
import { notFound } from "next/navigation";
import { allCards, getCardById } from "@/data/cards";
import { ClientRedirect } from "@/components/client-redirect";

export function generateStaticParams() {
  return allCards.map((card) => ({ id: card.id }));
}

export default async function LegacyCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getCardById(id)) {
    notFound();
  }
  return <ClientRedirect to={`/guide/tarot/${id}`} />;
}
