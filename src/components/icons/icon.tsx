import type { ReactNode } from "react";

/**
 * SVG線画アイコン。24pxグリッド・塗りなし・丸い端点で、色は currentColor。
 * 絵文字やUnicodeの記号文字の代わりに必ずこれを使う。
 */
const ICONS = {
  home: <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" />,
  fortune: <path d="M12 3l2.4 6.1L21 9.6l-5 4.3 1.6 6.5L12 16.9 6.4 20.4 8 13.9 3 9.6l6.6-.5z" />,
  tarot: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M12 8l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" />
    </>
  ),
  guide: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 21a2 2 0 0 1 2-2h14" />
    </>
  ),
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </>
  ),
  chev: <path d="M6 9l6 6 6-6" />,
  right: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  cal: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chat: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" />,
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  spread: (
    <>
      <rect x="2" y="7" width="7" height="11" rx="1.5" transform="rotate(-10 5.5 12.5)" />
      <rect x="8.5" y="5" width="7" height="11" rx="1.5" />
      <rect x="15" y="7" width="7" height="11" rx="1.5" transform="rotate(10 18.5 12.5)" />
    </>
  ),
  "spread-choice": (
    <>
      <path d="M12 4v16" />
      <path d="M8 8l-4 4 4 4" />
      <path d="M16 8l4 4-4 4" />
    </>
  ),
  "spread-hexagram": (
    <>
      <path d="M12 3l8 13.5H4z" />
      <path d="M12 21L4 7.5h16z" />
    </>
  ),
  "spread-celtic": (
    <>
      <rect x="9" y="5" width="6" height="14" rx="1" />
      <path d="M4 12h16" />
    </>
  ),
  overall: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      <path d="M14.5 9.5L13 13l-3.5 1.5L11 11z" />
    </>
  ),
  love: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  work: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18" />
    </>
  ),
  money: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4v2M12 18v2" />
    </>
  ),
  health: (
    <>
      <path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z" />
      <path d="M5 19l8-8" />
    </>
  ),
  advice: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.8-1.5 1.5-1.5 2.5h-4c0-1-.7-1.7-1.5-2.5z" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export const iconNames = Object.keys(ICONS) as IconName[];

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.6,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}
