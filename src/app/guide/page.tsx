// 早見表ページ（新URL）
import { CardBrowser } from "@/components/card-browser";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { allCards } from "@/data/cards";

/** 早見表の占術タブ。フェーズ1以降で占術を追加し、切り替えられるようにする */
const guideSystems = [{ id: "tarot", label: "タロット" }] as const;

export default function GuidePage() {
  return (
    <PageContainer>
      <PageHeader accent="Guide" title="早見表" />

      <nav aria-label="占術" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <ul className="flex gap-1.5 lg:flex-wrap">
          {guideSystems.map((s) => (
            <li key={s.id}>
              <span
                aria-current="page"
                className="flex min-h-[38px] items-center whitespace-nowrap rounded-full border border-gold bg-gold px-3.5 text-[13px] font-bold text-background lg:min-h-10 lg:px-[18px] lg:text-sm"
              >
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <section className="flex flex-col gap-4">
        <p className="text-xs text-gold-dim">全78枚のタロットカード</p>
        <CardBrowser cards={allCards} />
      </section>
    </PageContainer>
  );
}
