import type { IconName } from "@/components/icons/icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const navItems: readonly NavItem[] = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/fortune", label: "運勢", icon: "fortune" },
  { href: "/tarot", label: "タロット", icon: "tarot" },
  { href: "/guide", label: "早見表", icon: "guide" },
];

/** pathname がナビ項目 href の配下にあるか(ホームは完全一致のみ) */
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
