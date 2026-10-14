"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { useMediaQuery } from "@/lib/use-media-query";
import { DetailHeadingView, type DetailContent } from "./detail-heading";

interface DetailPanelContextValue {
  /** サイドパネルが使える状態か(DetailPanelLayout の中で、かつ 1280px 以上) */
  enabled: boolean;
  show: (content: DetailContent | null) => void;
}

const DetailPanelContext = createContext<DetailPanelContextValue | null>(null);

export function useDetailPanel(): DetailPanelContextValue | null {
  return useContext(DetailPanelContext);
}

/**
 * 1280px 以上で、詳細を右の第3カラム(340px)に表示するレイアウト。
 * パネルは本文に覆いかぶせず、本文の幅を縮めて並べる。
 */
export function DetailPanelLayout({ children }: { children: ReactNode }) {
  const isWide = useMediaQuery("(min-width: 1280px)");
  const [content, setContent] = useState<DetailContent | null>(null);
  const value = useMemo(() => ({ enabled: isWide, show: setContent }), [isWide]);
  const panel = isWide ? content : null;

  return (
    <DetailPanelContext.Provider value={value}>
      <div className={panel ? "grid flex-1 grid-cols-[minmax(0,1fr)_340px]" : "flex flex-1 flex-col"}>
        <div className="flex min-w-0 flex-col">{children}</div>
        {panel && (
          <aside
            aria-label="詳細パネル"
            className="sticky top-0 h-dvh overflow-y-auto border-l border-gold/35 bg-popover"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-popover px-5 py-4">
              <span className="text-xs tracking-[0.1em] text-gold-dim">詳細</span>
              <button
                type="button"
                aria-label="詳細を閉じる"
                onClick={() => setContent(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold-light hover:bg-gold/10"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 pb-8 pt-6">
              <DetailHeadingView heading={panel.heading} />
              {panel.body}
            </div>
          </aside>
        )}
      </div>
    </DetailPanelContext.Provider>
  );
}
