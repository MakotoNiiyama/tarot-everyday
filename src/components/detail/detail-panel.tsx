"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

/** パネルの表示エントリ。id は show() 呼び出しごとに増える整数で、
 *  同じコンポーネント型が同じ位置に連続して表示されてもタブ状態がリセットされるよう key として使う */
type PanelEntry = { id: number; content: DetailContent };

/**
 * 1280px 以上で、詳細を右の第3カラム(340px)に表示するレイアウト。
 * パネルは本文に覆いかぶせず、本文の幅を縮めて並べる。
 */
export function DetailPanelLayout({ children }: { children: ReactNode }) {
  const isWide = useMediaQuery("(min-width: 1280px)");
  const [entry, setEntry] = useState<PanelEntry | null>(null);

  // show() 呼び出しごとにインクリメントする id カウンター
  const nextIdRef = useRef(0);
  // パネルを開く前にフォーカスしていた要素を覚えておく
  const returnFocusRef = useRef<Element | null>(null);
  // フォーカス移動先のパネル要素への ref
  const panelRef = useRef<HTMLElement | null>(null);

  const show = useCallback((content: DetailContent | null) => {
    if (content === null) {
      setEntry(null);
    } else {
      returnFocusRef.current = document.activeElement;
      nextIdRef.current += 1;
      setEntry({ id: nextIdRef.current, content });
    }
  }, []);

  // パネルの開閉・内容切り替えに合わせてフォーカスを移動する。
  // setState は呼ばず focus() のみ呼ぶ(react-hooks/set-state-in-effect に抵触しない)。
  useEffect(() => {
    if (entry !== null) {
      panelRef.current?.focus();
    } else {
      (returnFocusRef.current as HTMLElement | null)?.focus();
      returnFocusRef.current = null;
    }
  }, [entry]);

  const panel = isWide ? entry : null;
  const value = useMemo(() => ({ enabled: isWide, show }), [isWide, show]);

  return (
    <DetailPanelContext.Provider value={value}>
      <div className={panel ? "grid flex-1 grid-cols-[minmax(0,1fr)_340px]" : "flex flex-1 flex-col"}>
        <div className="flex min-w-0 flex-col">{children}</div>
        {panel && (
          <aside
            ref={panelRef}
            tabIndex={-1}
            aria-label="詳細パネル"
            className="sticky top-0 h-dvh overflow-y-auto border-l border-gold/35 bg-popover outline-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-popover px-5 py-4">
              <span className="text-xs tracking-[0.1em] text-gold-dim">詳細</span>
              <button
                type="button"
                aria-label="詳細を閉じる"
                onClick={() => setEntry(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold-light hover:bg-gold/10"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            {/* key={panel.id} で内容が変わるたびに本文を再マウントし、タブ状態などをリセットする */}
            <div key={panel.id} className="flex flex-col gap-4 px-6 pb-8 pt-6">
              <DetailHeadingView heading={panel.content.heading} />
              {panel.content.body}
            </div>
          </aside>
        )}
      </div>
    </DetailPanelContext.Provider>
  );
}
