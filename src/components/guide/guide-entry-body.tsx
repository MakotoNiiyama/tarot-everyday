import type { GuideEntry } from "@/data/guide";
import { GuideImageView } from "./guide-image";

/** 詳細シート・サイドパネルの本文(画像・キーワード・説明・運勢の一文) */
export function GuideEntryBody({ entry }: { entry: GuideEntry }) {
  const portrait = entry.image.kind === "photo";
  return (
    <div className="flex flex-col gap-3.5">
      <div
        className={`flex items-center justify-center self-center overflow-hidden rounded-[20px] border border-gold/40 bg-surface lg:rounded-3xl ${
          portrait ? "h-[200px] w-[120px]" : "h-[120px] w-[120px] lg:h-[140px] lg:w-[140px]"
        }`}
      >
        <GuideImageView image={entry.image} size="sheet" />
      </div>
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
          <h3 className="mb-1 text-xs text-gold-dim">運勢として出たとき</h3>
          <p className="text-[13px] leading-relaxed">{entry.periodNote}</p>
        </section>
      )}
    </div>
  );
}
