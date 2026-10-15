"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/icons/icon";
import { guideSystems, isGuideSystemId, searchGuide, type GuideEntry, type GuideSystemId } from "@/data/guide";
import { useUrlTab } from "@/lib/use-url-tab";
import { ElementDetailSheet } from "./element-detail-sheet";
import { GUIDE_TILE_CLASS, GuideTileFace } from "./guide-tile";

/**
 * タイルの並び。スマホ4列、PC10列。PC でサイドパネルを開いて一覧が狭くなったとき(幅680px未満)は8列にし、
 * 九星の2文字の漢字などがタイルからはみ出さないようにする(外側の @container の幅で決める)
 */
const GRID = "grid grid-cols-4 gap-2 lg:grid-cols-8 lg:gap-2.5 lg:@min-[680px]:grid-cols-10";

/** URL の ?tab= を読み書きする版。不正な値・指定なしはタロット。事前描画中は tab が null */
export function GuideBrowser() {
  const [tab, setTab] = useUrlTab();
  return <GuideBrowserView tab={tab === null ? null : isGuideSystemId(tab) ? tab : "tarot"} onSelectTab={setTab} />;
}

/**
 * 早見表の一覧の本体。tab は表示する占術で、null は URL がまだわからない状態(事前描画・水和中)。
 * null のときはどのタブも選ばず、タイル(タロットなら78枚の画像)の代わりに軽い仮の表示を出す
 */
export function GuideBrowserView({
  tab,
  onSelectTab,
}: {
  tab: GuideSystemId | null;
  onSelectTab: (id: GuideSystemId) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = searchGuide(query);
  const searching = query.trim() !== "";
  const system = tab === null ? null : (guideSystems.find((s) => s.id === tab) ?? guideSystems[0]);

  // スマホの検索ボタン。開くと入力欄にフォーカスし、閉じると検索語を消す
  const toggleSearch = () => {
    if (searchOpen) {
      setQuery("");
      setSearchOpen(false);
      return;
    }
    // 入力欄を表示してからフォーカスするため、同期的に描画する
    flushSync(() => setSearchOpen(true));
    inputRef.current?.focus();
  };

  // タブの矢印キー操作(ローヴィング tabIndex)。フォーカスの移動と同時に選択も移す
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = guideSystems.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onSelectTab(guideSystems[next].id);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  // タブ順に入れるタブ。未選択(URL がわからない間)は先頭
  const focusableId = system?.id ?? guideSystems[0].id;

  return (
    <div className="@container flex flex-col gap-4 lg:gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={searchOpen ? "検索欄を閉じる" : "検索欄を開く"}
          aria-expanded={searchOpen}
          aria-controls="guide-search"
          onClick={toggleSearch}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/30 text-gold-light lg:hidden"
        >
          <Icon name={searchOpen ? "close" : "search"} size={18} />
        </button>
        {/* PC では常に表示する。スマホでは検索ボタンで開閉する */}
        <label
          id="guide-search"
          className={`${searchOpen ? "flex" : "hidden"} min-h-11 flex-1 items-center gap-2.5 rounded-full border border-gold/30 px-4 text-gold-dim lg:flex lg:max-w-sm`}
        >
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            type="search"
            aria-label="早見表を検索"
            placeholder="名前・読み・キーワードで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-cream placeholder:text-gold-dim/70 focus:outline-none"
          />
        </label>
      </div>

      {/* 件数・該当なしの読み上げ。内容が変わったときに伝わるよう常に置いておく(検索していない間は空) */}
      <div role="status" className={searching ? "" : "sr-only"}>
        {searching &&
          (results.length === 0 ? (
            <p className="py-8 text-center text-sm text-gold-dim">該当する項目が見つかりません</p>
          ) : (
            <p className="text-xs text-gold-dim">{results.length}件見つかりました</p>
          ))}
      </div>

      {searching ? (
        results.length > 0 && <SearchResults results={results} />
      ) : (
        <>
          <div role="tablist" aria-label="占術" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {guideSystems.map((s, i) => {
              const selected = s.id === system?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`guide-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls="guide-tabpanel"
                  tabIndex={s.id === focusableId ? 0 : -1}
                  onClick={() => onSelectTab(s.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={`flex min-h-[38px] flex-none items-center whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold lg:min-h-10 lg:px-[18px] lg:text-sm ${
                    selected ? "border-gold bg-gold text-background" : "border-gold/30 text-gold-dim hover:text-cream"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {system === null ? (
            <div role="tabpanel" id="guide-tabpanel" aria-label="読み込み中" aria-busy="true" className="flex flex-col gap-2.5 lg:gap-3">
              <span className="h-5 w-24 rounded bg-gold/10" />
              <div className={GRID}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className="aspect-[3/5] rounded-[14px] border border-gold/15 bg-popover/60" />
                ))}
              </div>
            </div>
          ) : (
            <div
              role="tabpanel"
              id="guide-tabpanel"
              aria-labelledby={`guide-tab-${system.id}`}
              className="flex flex-col gap-[22px] lg:gap-7"
            >
              {system.groups.map((group) => (
                <section key={group.name} aria-labelledby={`group-${system.id}-${group.name}`} className="flex flex-col gap-2.5 lg:gap-3">
                  <h2 id={`group-${system.id}-${group.name}`} className="flex items-baseline gap-2 font-heading text-base lg:text-lg">
                    {group.name}{" "}
                    <span className="font-sans text-[11px] text-gold-dark lg:text-xs">{group.entries.length}項目</span>
                  </h2>
                  <TileGrid entries={group.entries} />
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * タイルの並び。タイルを押すとページを移らずに詳細シート(PC幅ではサイドパネル)で開き、
 * 一覧のスクロール位置をそのままにする。詳細ページへはシートの「詳しく見る」から移る
 */
function TileGrid({ entries }: { entries: GuideEntry[] }) {
  return (
    <ul className={GRID}>
      {entries.map((e) => (
        <li key={`${e.system}:${e.id}`}>
          <ElementDetailSheet
            element={{ system: e.system, id: e.id }}
            triggerLabel={`${e.name}の詳細を見る`}
            className={GUIDE_TILE_CLASS}
            inGuide
          >
            <GuideTileFace entry={e} />
          </ElementDetailSheet>
        </li>
      ))}
    </ul>
  );
}

/** 検索結果。占術のタブの順に、占術ごとの小見出しとタイルの並びに分ける */
function SearchResults({ results }: { results: GuideEntry[] }) {
  const groups = guideSystems
    .map((s) => ({ system: s, entries: results.filter((e) => e.system === s.id) }))
    .filter((g) => g.entries.length > 0);
  return (
    <section aria-label="検索結果" className="flex flex-col gap-[22px] lg:gap-7">
      {groups.map(({ system, entries }) => (
        <section key={system.id} aria-labelledby={`search-${system.id}`} className="flex flex-col gap-2.5 lg:gap-3">
          <h2 id={`search-${system.id}`} className="flex items-baseline gap-2 font-heading text-sm lg:text-base">
            {system.label}{" "}
            <span className="font-sans text-[11px] text-gold-dark lg:text-xs">{entries.length}件</span>
          </h2>
          <TileGrid entries={entries} />
        </section>
      ))}
    </section>
  );
}
