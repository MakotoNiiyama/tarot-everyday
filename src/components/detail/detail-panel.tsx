"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/icons/icon";
import { useMediaQuery } from "@/lib/use-media-query";
import { DetailGuideLink, DetailHeadingView, type DetailContent } from "./detail-heading";

interface DetailPanelContextValue {
  /** サイドパネルが使える状態か(DetailPanelLayout の中で、かつ 1280px 以上) */
  enabled: boolean;
  /** パネル要素の id(トリガーの aria-controls に使う) */
  panelId: string;
  /** いまパネルに内容を表示しているトリガーの owner。何も表示していなければ null */
  activeOwner: string | null;
  /**
   * パネルに内容を表示する。owner はトリガーごとの一意な id、trigger は閉じたときにフォーカスを戻す要素。
   * Safari はクリックでボタンにフォーカスしないため、document.activeElement ではなく trigger を明示的に受け取る
   */
  show: (content: DetailContent, options: { owner: string; trigger: HTMLElement }) => void;
  /** パネルを閉じ、トリガーにフォーカスを戻す */
  close: () => void;
}

const DetailPanelContext = createContext<DetailPanelContextValue | null>(null);

export function useDetailPanel(): DetailPanelContextValue | null {
  return useContext(DetailPanelContext);
}

/** パネルの表示エントリ。id は show() 呼び出しごとに増える整数で、
 *  同じコンポーネント型が同じ位置に連続して表示されてもタブ状態がリセットされるよう key として使う */
type PanelEntry = { id: number; owner: string; content: DetailContent };

/**
 * 1280px 以上で、詳細を右の第3カラム(340px)に表示するレイアウト。
 * パネルは本文に覆いかぶせず、本文の幅を縮めて並べる。
 */
export function DetailPanelLayout({ children }: { children: ReactNode }) {
  const isWide = useMediaQuery("(min-width: 1280px)");
  const [entry, setEntry] = useState<PanelEntry | null>(null);
  const panelId = useId();

  // 幅が狭くなったら内容を破棄する(再び広げたときに古い内容が出てこないように)。
  // useEffect で setState せず、描画中に前回の幅と比べて状態を調整する
  const [prevIsWide, setPrevIsWide] = useState(isWide);
  if (prevIsWide !== isWide) {
    setPrevIsWide(isWide);
    if (!isWide) setEntry(null);
  }

  // show() 呼び出しごとにインクリメントする id カウンター
  const nextIdRef = useRef(0);
  // パネルを閉じたときにフォーカスを戻すトリガー
  const triggerRef = useRef<HTMLElement | null>(null);
  // フォーカス移動先のパネル要素への ref
  const panelRef = useRef<HTMLElement | null>(null);
  // パネルの開閉で本文の幅が変わる前の、トリガーの画面上の位置。開閉のあとで同じ位置に戻す
  const anchorRef = useRef<{ el: HTMLElement; top: number } | null>(null);
  // 開いたときに戻しきれなかった分(本文が短くなり、ページの末尾でスクロールが止まったとき)。閉じるときに取り戻す
  const shortfallRef = useRef(0);

  const show = useCallback<DetailPanelContextValue["show"]>((content, { owner, trigger }) => {
    // パネルを開いたまま別のトリガーを押したときは本文の幅が変わらないので補正しない(取り戻す分は引き継ぐ)
    if (!triggerRef.current) {
      shortfallRef.current = 0;
      anchorRef.current = { el: trigger, top: trigger.getBoundingClientRect().top };
    }
    triggerRef.current = trigger;
    nextIdRef.current += 1;
    setEntry({ id: nextIdRef.current, owner, content });
  }, []);

  const close = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger) anchorRef.current = { el: trigger, top: trigger.getBoundingClientRect().top - shortfallRef.current };
    shortfallRef.current = 0;
    setEntry(null);
    trigger?.focus({ preventScroll: true });
    triggerRef.current = null;
  }, []);

  // パネルを開閉すると本文の幅が変わって折り返し(タイルの大きさ)が変わり、押したトリガーが画面の上下にずれる。
  // 描画の直後(画面に出る前)にスクロールを補正し、トリガーを開閉の前と同じ位置に保つ
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    anchorRef.current = null;
    if (!anchor || !anchor.el.isConnected) return;
    const delta = anchor.el.getBoundingClientRect().top - anchor.top;
    if (Math.abs(delta) >= 1) window.scrollBy(0, delta);
    shortfallRef.current = triggerRef.current ? anchor.el.getBoundingClientRect().top - anchor.top : 0;
  }, [entry]);

  // パネルを開いたとき・内容を切り替えたときにパネルへフォーカスを移す。
  // setState は呼ばず focus() のみ呼ぶ(react-hooks/set-state-in-effect に抵触しない)。
  const entryId = entry?.id;
  useEffect(() => {
    if (entryId !== undefined) panelRef.current?.focus({ preventScroll: true });
  }, [entryId]);

  const panel = isWide ? entry : null;
  const activeOwner = panel?.owner ?? null;
  const value = useMemo(
    () => ({ enabled: isWide, panelId, activeOwner, show, close }),
    [isWide, panelId, activeOwner, show, close],
  );

  return (
    <DetailPanelContext.Provider value={value}>
      <div className={panel ? "grid flex-1 grid-cols-[minmax(0,1fr)_340px]" : "flex flex-1 flex-col"}>
        <div className="flex min-w-0 flex-col">{children}</div>
        {panel && (
          <aside
            ref={panelRef}
            id={panelId}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              }
            }}
            aria-label="詳細パネル"
            className="sticky top-0 h-dvh overflow-y-auto border-l border-gold/35 bg-popover outline-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-popover px-5 py-4">
              <span className="text-xs tracking-[0.1em] text-gold-dim">詳細</span>
              <button
                type="button"
                aria-label="詳細を閉じる"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold-light hover:bg-gold/10"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            {/* key={panel.id} で内容が変わるたびに本文を再マウントし、タブ状態などをリセットする */}
            <div key={panel.id} className="flex flex-col gap-4 px-6 pb-8 pt-6">
              <DetailHeadingView heading={panel.content.heading} />
              {panel.content.body}
              {/*
                ページを移る前にパネルを閉じ、本文の幅と位置をパネルを開く前に戻す。
                ブラウザはこの状態のスクロール位置を履歴に覚えるので、戻ったときに元の位置に戻れる
              */}
              {panel.content.guideHref && (
                <DetailGuideLink href={panel.content.guideHref} inGuide={panel.content.inGuide} onNavigate={close} />
              )}
            </div>
          </aside>
        )}
      </div>
    </DetailPanelContext.Provider>
  );
}
