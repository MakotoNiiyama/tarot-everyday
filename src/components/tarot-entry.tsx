import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/icon";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

const choices: { href: string; icon: IconName; accent: string; title: string; description: string }[] = [
  {
    href: "/tarot/reading",
    icon: "spread",
    accent: "Reading",
    title: "タロット占いをする",
    description: "相談したいことを決めて、スプレッドを選んでカードを引きます。",
  },
  {
    href: "/tarot/quiz",
    icon: "quiz",
    accent: "Practice",
    title: "クイズで練習する",
    description: "78枚のカードの意味を、正位置・逆位置のクイズで覚えます。",
  },
];

/** タロットの入口(占い / クイズの2択) */
export function TarotEntry() {
  return (
    <PageContainer className="lg:gap-9">
      <PageHeader accent="Tarot" title="タロット" description="今日はどちらにしますか" />
      <div className="grid flex-1 gap-3.5 lg:flex-none lg:grid-cols-2 lg:gap-6">
        {choices.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex min-h-[220px] flex-col justify-between gap-5 rounded-3xl border border-gold/30 bg-surface p-6 text-cream transition-colors hover:border-gold/60 lg:min-h-[340px] lg:gap-7 lg:rounded-[28px] lg:p-8"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/14 text-gold-light lg:h-16 lg:w-16 lg:rounded-[18px]">
              <Icon name={c.icon} size={28} strokeWidth={1.5} />
            </span>
            <span className="flex flex-col gap-1.5 lg:gap-2">
              <span className="font-accent text-base leading-none text-gold-dark lg:text-lg">{c.accent}</span>
              <span className="font-heading text-[22px] lg:text-[26px]">{c.title}</span>
              <span className="text-[13px] leading-relaxed text-gold-dim lg:text-sm">{c.description}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-gold-light lg:text-sm">
              はじめる
              <Icon name="right" size={16} strokeWidth={1.8} />
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
