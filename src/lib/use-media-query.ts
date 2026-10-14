"use client";

import { useCallback, useSyncExternalStore } from "react";

function canMatch(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/** メディアクエリに一致しているか。サーバー描画時と matchMedia が無い環境では false */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatch()) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => canMatch() && window.matchMedia(query).matches,
    () => false,
  );
}
