"use client";

import { useCallback, useSyncExternalStore } from "react";

/** replaceState は popstate を発火しないため、同じページ内の購読者に知らせる独自イベント */
const TAB_CHANGE_EVENT = "url-tab-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(TAB_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(TAB_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): string {
  return new URLSearchParams(window.location.search).get("tab") ?? "";
}

/** 事前描画(と水和の最初の描画)では URL がわからないので null */
function getServerSnapshot(): null {
  return null;
}

/**
 * URL の ?tab= を読み書きする。値は事前描画・水和中は null、それ以降は文字列(なければ空文字)。
 * useSearchParams と Suspense を使わずに済み、切り替えてもサーバーへの往復が起きない。
 * 書き込みは history.replaceState(Next.js のルーターと連携する。docs/01-app/02-guides/single-page-applications.md)
 */
export function useUrlTab(): [string | null, (id: string) => void] {
  const tab = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTab = useCallback((id: string) => {
    window.history.replaceState(null, "", `${window.location.pathname}?tab=${encodeURIComponent(id)}`);
    window.dispatchEvent(new Event(TAB_CHANGE_EVENT));
  }, []);
  return [tab, setTab];
}
