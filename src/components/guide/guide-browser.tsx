"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { guideSystems, isGuideSystemId, searchGuide, type GuideSystemId } from "@/data/guide";
import { GuideTile } from "./guide-tile";

const GRID = "grid grid-cols-4 gap-2 lg:grid-cols-10 lg:gap-2.5";

/** URL の ?tab= を読む版(Suspense の内側で使う) */
export function GuideBrowser() {
  const params = useSearchParams();
  const tab = params.get("tab");
  return <GuideBrowserView tab={tab && isGuideSystemId(tab) ? tab : "tarot"} />;
}

/** 早見表の一覧の本体。tab は表示する占術 */
export function GuideBrowserView({ tab }: { tab: GuideSystemId }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const results = searchGuide(query);
  const searching = query.trim() !== "";
  const system = guideSystems.find((s) => s.id === tab) ?? guideSystems[0];

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="検索欄を開く"
          aria-expanded={searchOpen}
          aria-controls="guide-search"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/30 text-gold-light lg:hidden"
        >
          <Icon name="search" size={18} />
        </button>
        <label
          id="guide-search"
          className={`${searchOpen ? "flex" : "hidden"} min-h-11 flex-1 items-center gap-2.5 rounded-full border border-gold/30 px-4 text-gold-dim lg:flex lg:max-w-sm`}
        >
          <Icon name="search" size={16} />
          <input
            type="search"
            aria-label="早見表を検索"
            placeholder="名前・読み・キーワードで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-cream placeholder:text-gold-dim/70 focus:outline-none"
          />
        </label>
      </div>

      {searching ? (
        <section aria-label="検索結果" className="flex flex-col gap-3">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-gold-dim">該当する項目が見つかりません</p>
          ) : (
            <>
              <p className="text-xs text-gold-dim">{results.length}件見つかりました</p>
              <ul className={GRID}>
                {results.map((e) => (
                  <li key={`${e.system}:${e.id}`}>
                    <GuideTile entry={e} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <>
          <div role="tablist" aria-label="占術" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {guideSystems.map((s) => {
              const selected = s.id === system.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`guide-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls="guide-tabpanel"
                  onClick={() => router.replace(`/guide?tab=${s.id}`, { scroll: false })}
                  className={`flex min-h-[38px] flex-none items-center whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold lg:min-h-10 lg:px-[18px] lg:text-sm ${
                    selected ? "border-gold bg-gold text-background" : "border-gold/30 text-gold-dim hover:text-cream"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="guide-tabpanel"
            aria-labelledby={`guide-tab-${system.id}`}
            className="flex flex-col gap-[22px] lg:gap-7"
          >
            {system.groups.map((group) => (
              <section key={group.name} aria-labelledby={`group-${system.id}-${group.name}`} className="flex flex-col gap-2.5 lg:gap-3">
                <h2 id={`group-${system.id}-${group.name}`} className="flex items-baseline gap-2 font-heading text-base lg:text-lg">
                  {group.name}
                  <span aria-hidden="true" className="font-sans text-[11px] text-gold-dark lg:text-xs">{group.entries.length}項目</span>
                </h2>
                <ul className={GRID}>
                  {group.entries.map((e) => (
                    <li key={e.id}>
                      <GuideTile entry={e} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
