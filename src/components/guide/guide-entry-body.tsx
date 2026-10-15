import type { GuideEntry } from "@/data/guide";
import { GuideEntryImage } from "./guide-entry-image";

/**
 * 詳細シート・サイドパネルの本文(画像・キーワード・説明・運勢の一文)。
 * showImage で画像を隠し、headingLevel で本文の小見出しの階層を変えられる(複数の項目を並べるとき用)
 */
export function GuideEntryBody({
  entry,
  showImage = true,
  headingLevel = 3,
}: {
  entry: GuideEntry;
  showImage?: boolean;
  headingLevel?: 3 | 4 | 5;
}) {
  const portrait = entry.image.kind === "photo";
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="flex flex-col gap-3.5">
      {showImage && (
        <div
          className={`relative flex items-center justify-center self-center overflow-hidden rounded-[20px] border border-gold/40 bg-surface lg:rounded-3xl ${
            portrait ? "h-[200px] w-[120px]" : "h-[120px] w-[120px] lg:h-[140px] lg:w-[140px]"
          }`}
        >
          <GuideEntryImage entry={entry} size="sheet" />
        </div>
      )}
      <ul className="flex flex-wrap justify-center gap-1.5" aria-label="キーワード">
        {entry.keywords.map((k) => (
          <li key={k} className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold-light">
            {k}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-[1.8]">{entry.summary}</p>
      {entry.periodNote && (
        <section className="rounded-2xl border border-gold/20 bg-background/40 p-3.5">
          <Heading className="mb-1 text-xs text-gold-dim">運勢として出たとき</Heading>
          <p className="text-[13px] leading-relaxed">{entry.periodNote}</p>
        </section>
      )}
    </div>
  );
}
