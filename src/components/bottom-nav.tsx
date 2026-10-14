"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { navItems, isNavActive } from "@/components/nav-items";

/** スマホ・タブレット(〜1023px)の下部固定ナビ */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gold/20 bg-background/96 backdrop-blur-sm px-2 pt-2 pb-[env(safe-area-inset-bottom)]"
      aria-label="メインナビゲーション"
    >
      <ul className="grid grid-cols-4 max-w-2xl mx-auto">
        {navItems.map(({ href, label, icon }) => {
          const isActive = isNavActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center gap-1 py-1.5 text-[10px] transition-colors ${
                  isActive ? "text-gold-light font-bold" : "text-gold-dim hover:text-cream"
                }`}
              >
                <Icon name={icon} size={22} strokeWidth={isActive ? 1.8 : 1.6} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
