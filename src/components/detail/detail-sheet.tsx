"use client";

import { useId, useState, type ReactNode } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { useDetailPanel } from "./detail-panel";
import { DetailGuideLink, DetailHeadingView, type DetailHeading } from "./detail-heading";

/**
 * 詳細を開くトリガーと、その表示先。
 * スマホ(と DetailPanelLayout の外)ではボトムシート、
 * DetailPanelLayout の中で 1280px 以上なら右サイドパネルに表示する。
 */
export function DetailSheet({
  heading,
  body,
  guideHref,
  children,
  className,
  triggerLabel,
}: {
  heading: DetailHeading;
  body: ReactNode;
  /** 早見表の該当ページ。あれば本文の末尾に「早見表で見る」リンクを出す */
  guideHref?: string;
  /** トリガーの中身 */
  children: ReactNode;
  className?: string;
  /** トリガーの中身がテキストでない場合のアクセシブルな名前 */
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const panel = useDetailPanel();
  const owner = useId();
  const triggerClassName = `cursor-pointer ${className ?? ""}`;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      {panel?.enabled ? (
        // サイドパネルを使うときは、パネルを操作する普通のボタンにする
        <button
          type="button"
          aria-label={triggerLabel}
          aria-expanded={panel.activeOwner === owner}
          aria-controls={panel.activeOwner === owner ? panel.panelId : undefined}
          onClick={(e) => panel.show({ heading, body, guideHref }, { owner, trigger: e.currentTarget })}
          className={triggerClassName}
        >
          {children}
        </button>
      ) : (
        <Drawer.Trigger
          render={(props) => (
            <button {...props} type="button" aria-label={triggerLabel} className={triggerClassName}>
              {children}
            </button>
          )}
        />
      )}
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 bg-black/60 z-[60]
            transition-opacity duration-300
            data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
        />
        <Drawer.Viewport className="fixed inset-x-0 bottom-0 z-[70]">
          {/* PC(1024px〜)では横いっぱいに広がらないよう、幅 640px までにして中央に置く */}
          <Drawer.Popup
            className="flex flex-col rounded-t-[28px] w-full lg:mx-auto lg:max-w-[640px] lg:border-x
              bg-popover border-t border-gold/35 max-h-[85vh] outline-none
              transition-transform duration-300 ease-out
              translate-y-[calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y))]
              data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full
              data-[swiping]:transition-none"
          >
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-2.5 pb-1 w-full cursor-grab active:cursor-grabbing select-none">
              <div className="w-10 h-[5px] rounded-full bg-gold-dim/60" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-11 pt-2 flex flex-col gap-3.5">
              <DetailHeadingView heading={heading} titleAs={Drawer.Title} descriptionAs={Drawer.Description} />
              {body}
              {guideHref && <DetailGuideLink href={guideHref} />}
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
