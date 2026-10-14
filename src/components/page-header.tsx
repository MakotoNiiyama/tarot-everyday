import { ScratchDivider } from "@/components/svg/scratch-decorations";

/** ページ見出し: Caveat の英字アクセント+見出し+手描き風の区切り線+説明 */
export function PageHeader({
  accent,
  title,
  description,
}: {
  accent: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="flex flex-col gap-1.5 px-1">
      <p className="font-accent text-2xl leading-none text-gold lg:text-[26px]">{accent}</p>
      <h1 className="font-heading text-2xl text-cream lg:text-[30px]">{title}</h1>
      {/* ScratchDivider は w-full なので、外側の要素で幅を決める */}
      <div className="w-40">
        <ScratchDivider className="text-gold" />
      </div>
      {description && <p className="text-[13px] text-gold-dim lg:text-sm">{description}</p>}
    </header>
  );
}
