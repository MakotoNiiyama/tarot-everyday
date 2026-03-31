"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "ホーム",
    icon: NavIconHome,
  },
  {
    href: "/cards",
    label: "早見表",
    icon: NavIconCards,
  },
  {
    href: "/reading",
    label: "占い",
    icon: NavIconReading,
  },
  {
    href: "/quiz",
    label: "クイズ",
    icon: NavIconQuiz,
  },
  {
    href: "/daily",
    label: "1day",
    icon: NavIconDaily,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold/20 bg-[#352307]/95 backdrop-blur-sm"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      <ul className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-gold"
                    : "text-gold-dim/60 hover:text-gold-dim"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon active={isActive} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── SVGスクラッチアート風ナビアイコン ─── */

function NavIconHome({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <path
        d="M3 12L12 4l9 8"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active && (
        <circle cx="12" cy="13" r="1" fill="currentColor" opacity="0.5" />
      )}
    </svg>
  );
}

function NavIconCards({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-6 h-6"
      aria-hidden="true"
    >
      {/* カードの束 */}
      <rect
        x="4"
        y="3"
        width="12"
        height="18"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
      />
      <path
        d="M8 3V21"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity="0.4"
      />
      <rect
        x="8"
        y="3"
        width="12"
        height="18"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
      />
      {/* 星マーク */}
      <path
        d="M14 9l0.7 1.5 1.6 0.2-1.15 1.1 0.3 1.6L14 13l-1.45 0.8 0.3-1.6-1.15-1.1 1.6-0.2z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.6 : 0.4}
      />
    </svg>
  );
}

function NavIconDaily({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-6 h-6"
      aria-hidden="true"
    >
      {/* 水晶玉 */}
      <circle
        cx="12"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
      />
      {/* 台座 */}
      <path
        d="M8 18Q10 20 12 20Q14 20 16 18"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
      />
      {/* 輝き */}
      <path
        d="M10 8Q12 6 14 8"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      {active && (
        <>
          <circle cx="10" cy="10" r="0.5" fill="currentColor" opacity="0.4" />
          <circle cx="14" cy="12" r="0.5" fill="currentColor" opacity="0.4" />
        </>
      )}
    </svg>
  );
}

function NavIconQuiz({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-6 h-6"
      aria-hidden="true"
    >
      {/* クエスチョンマーク */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="currentColor"
        fontSize={active ? "14" : "12"}
        fontFamily="serif"
        opacity={active ? 1 : 0.7}
      >
        ?
      </text>
      {active && (
        <>
          <circle cx="6" cy="5" r="0.5" fill="currentColor" opacity="0.4" />
          <circle cx="18" cy="5" r="0.5" fill="currentColor" opacity="0.4" />
        </>
      )}
    </svg>
  );
}

function NavIconReading({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-6 h-6"
      aria-hidden="true"
    >
      {/* 3枚のカードを扇形に配置 */}
      <rect
        x="8"
        y="4"
        width="8"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.15 : 1}
        transform="rotate(-15 12 10)"
      />
      <rect
        x="8"
        y="4"
        width="8"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.15 : 1}
      />
      <rect
        x="8"
        y="4"
        width="8"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.15 : 1}
        transform="rotate(15 12 10)"
      />
      {/* 星 */}
      <path
        d="M12 18l-1 2h2z"
        stroke="currentColor"
        strokeWidth="0.8"
        fill={active ? "currentColor" : "none"}
        opacity="0.6"
      />
    </svg>
  );
}
