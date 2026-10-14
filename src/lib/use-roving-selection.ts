"use client";

import { useRef, type KeyboardEvent } from "react";

/**
 * 「1つだけ選ぶ」部品(タブ・ラジオボタン)のキーボード操作(roving tabindex)。
 * - タブ移動の対象は選択中の1つだけ(tabIndex 0、ほかは -1)。どれも選ばれていなければ先頭を対象にする
 * - 矢印キーで前後に移り、そのまま選ぶ(端では反対側に回る)。Home / End で先頭・末尾へ
 * - axis が "horizontal" なら左右の矢印だけ(タブ)、"both" なら上下の矢印も使う(ラジオボタン)
 */
export function useRovingSelection<T>({
  values,
  value,
  onChange,
  axis = "both",
}: {
  values: readonly T[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  axis?: "horizontal" | "both";
}) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const selectedIndex = values.indexOf(value as T);
  const focusableIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const move = (index: number) => {
    const next = (index + values.length) % values.length;
    onChange(values[next]);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const nextKey = e.key === "ArrowRight" || (axis === "both" && e.key === "ArrowDown");
    const prevKey = e.key === "ArrowLeft" || (axis === "both" && e.key === "ArrowUp");
    if (nextKey) move(index + 1);
    else if (prevKey) move(index - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(values.length - 1);
    else return;
    e.preventDefault();
  };

  /** 各項目に渡す ref・tabIndex・onKeyDown */
  const itemProps = (index: number) => ({
    ref: (el: HTMLElement | null) => {
      refs.current[index] = el;
    },
    tabIndex: index === focusableIndex ? 0 : -1,
    onKeyDown: (e: KeyboardEvent) => onKeyDown(e, index),
  });

  return { itemProps };
}
