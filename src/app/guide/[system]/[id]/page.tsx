// 早見表の項目の詳細ページ(数秘術・九星気学・マヤ暦。タロットは /guide/tarot/[id])
import { notFound } from "next/navigation";
import { GuideImageView } from "@/components/guide/guide-image";
import { GuideDetailFrame, GuideDetailLayout } from "@/components/guide/guide-detail-layout";
import { GuideTile } from "@/components/guide/guide-tile";
import { getGuideEntry, guideSystems } from "@/data/guide";

export const dynamicParams = false;

export function generateStaticParams() {
  return guideSystems
    .filter((s) => s.id !== "tarot")
    .flatMap((s) => s.groups.flatMap((g) => g.entries.map((e) => ({ system: s.id, id: e.id }))));
}

export default async function GuideEntryPage({ params }: { params: Promise<{ system: string; id: string }> }) {
  const { system, id } = await params;
  const entry = system === "tarot" ? undefined : getGuideEntry(system, id);
  if (!entry) notFound();
  const systemLabel = guideSystems.find((s) => s.id === entry.system)?.label ?? "";
  const related = (entry.related ?? []).map((r) => getGuideEntry(entry.system, r)).filter((e) => e !== undefined);

  return (
    <GuideDetailLayout
      system={entry.system}
      systemLabel={systemLabel}
      group={entry.group}
      image={
        <GuideDetailFrame>
          <GuideImageView image={entry.image} size="detail" />
        </GuideDetailFrame>
      }
    >
      <header className="flex flex-col gap-1 text-center lg:text-left">
        <h1 className="font-heading text-[30px] leading-tight lg:text-4xl">{entry.name}</h1>
        <p className="text-[13px] text-gold-dim lg:text-sm">{entry.reading}</p>
        {entry.nameEn && <p className="font-accent text-base leading-none text-gold-dark lg:text-xl">{entry.nameEn}</p>}
      </header>
      <ul className="flex flex-wrap justify-center gap-1.5 lg:justify-start" aria-label="キーワード">
        {entry.keywords.map((k) => (
          <li key={k} className="rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold-light">
            {k}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-[1.9] lg:max-w-[520px] lg:text-[15px]">{entry.summary}</p>
      {entry.periodNote && (
        <section className="rounded-2xl border border-gold/20 bg-surface p-4 lg:max-w-[520px]">
          <h2 className="mb-1 text-xs text-gold-dim">運勢として出たとき</h2>
          <p className="text-sm leading-relaxed">{entry.periodNote}</p>
        </section>
      )}
      {related.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="font-heading text-[15px] lg:text-base">関連項目</h2>
          <ul className="grid grid-cols-4 gap-2 lg:grid-cols-[repeat(5,88px)] lg:gap-2.5">
            {related.map((r) => (
              <li key={r.id}>
                <GuideTile entry={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </GuideDetailLayout>
  );
}
