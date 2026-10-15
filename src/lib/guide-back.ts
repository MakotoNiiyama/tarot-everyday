import type { MouseEvent } from "react";

/**
 * 早見表の詳細ページの戻るボタンを、ブラウザの「戻る」と同じにしてよいかの判定(設計書 §11.5)。
 *
 * 早見表の中(一覧のシートの「詳しく見る」、詳細ページの関連項目)から詳細ページへ移るときに markGuideNavigation() で印を立て、
 * 詳細ページを表示したときに recordGuideBack() がその印を「その履歴エントリーの state」に書き込む。
 * 戻るボタンは canGoBackToGuide() が true なら router.back() し、そうでなければ(URL を直接開いた・新しいタブ・
 * 運勢ページから来たなど)一覧へのリンクとして動く。
 *
 * 印は JavaScript のメモリにしか置かないので、ページの読み込み直し・新しいタブでは消える(直接開いたときは必ず false)。
 * 履歴エントリーの state は Next.js が戻る・進むと再読み込みでも残す(completeTraverseNavigation の preserveCustomHistoryState)ので、
 * 一度記録したエントリーには、あとから戻ってきても同じ判定が使える
 */

const STATE_KEY = "__guideBack";

let pending = false;

/** 修飾キーなしの左クリック(同じタブでの移動)か */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** 早見表の中から詳細ページへ移るリンクの onClick。新しいタブで開くクリックでは印を立てない */
export function markGuideNavigation(e: MouseEvent): void {
  if (isPlainClick(e)) pending = true;
}

/** 詳細ページを表示したときに呼ぶ。この履歴エントリーにまだ記録がなければ、直前に立てた印を記録する */
export function recordGuideBack(): void {
  const fromGuide = pending;
  pending = false;
  const state: Record<string, unknown> | null = window.history.state;
  if (typeof state?.[STATE_KEY] === "boolean") return;
  window.history.replaceState({ ...state, [STATE_KEY]: fromGuide }, "");
}

/** 直前の履歴エントリーが早見表の中か(戻るボタンで router.back() してよいか) */
export function canGoBackToGuide(): boolean {
  return (window.history.state as Record<string, unknown> | null)?.[STATE_KEY] === true;
}

/** テスト用: 印を消す */
export function resetGuideNavigationMark(): void {
  pending = false;
}
