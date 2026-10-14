"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { navItems, isNavActive } from "@/components/nav-items";

/** PC(1024px〜)の左サイドナビ。幅 232px で画面左に固定 */
export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[232px] flex-col gap-7 border-r border-gold/15 bg-background px-4 py-7">
      <div className="flex flex-col gap-0.5 px-3">
        <span className="font-accent text-[26px] whitespace-nowrap leading-none text-gold">tarot-everyday</span>
        <span className="text-[11px] tracking-[0.15em] text-gold-dark">毎日の占いノート</span>
      </div>
      <nav aria-label="メインナビゲーション">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon }) => {
            const isActive = isNavActive(href, pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-gold/12 font-bold text-gold-light"
                      : "text-gold-dim hover:bg-gold/5 hover:text-cream"
                  }`}
                >
                  <Icon name={icon} size={20} strokeWidth={isActive ? 1.8 : 1.6} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
