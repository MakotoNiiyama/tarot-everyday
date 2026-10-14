// src/components/fortune/signup-card.tsx
import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { primaryButton } from "@/lib/button-styles";
import { FORTUNE_SYSTEM_NAMES } from "@/lib/fortune/system-names";

/** 未登録時の、生年月日の登録への誘導 */
export function SignupCard({ className = "" }: { className?: string }) {
  return (
    <section aria-label="生年月日の登録" className={`flex flex-col gap-2.5 ${className}`}>
      <p className="text-sm leading-[1.7]">
        生年月日を登録すると、{FORTUNE_SYSTEM_NAMES.length}つの占術で今日・今月・今年の運勢が見られます。
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {FORTUNE_SYSTEM_NAMES.map((s) => (
          <li key={s.id} className="rounded-full border border-gold/20 px-2.5 py-0.5 text-[11px] text-gold-dim">
            {s.name}
          </li>
        ))}
      </ul>
      <Link href="/fortune/profile" className={primaryButton}>
        <Icon name="cal" size={16} strokeWidth={2} />
        生年月日を登録する
      </Link>
    </section>
  );
}
