"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/icons/icon";
import { canGoBackToGuide, isPlainClick, recordGuideBack } from "@/lib/guide-back";

/**
 * 詳細ページの戻るボタン。早見表の中から来たときはブラウザの「戻る」と同じにし、一覧のスクロール位置に戻す。
 * それ以外(直接開いたときなど)は href(一覧の該当タブ)へのリンクとして動く
 */
export function GuideBackLink({ href }: { href: string }) {
  useEffect(() => {
    recordGuideBack();
  }, []);
  return (
    <Link
      href={href}
      aria-label="早見表に戻る"
      onClick={(e) => {
        if (!isPlainClick(e) || !canGoBackToGuide()) return;
        e.preventDefault();
        // router.back() と同じ(Next.js は history.back() を呼び、popstate で一覧を復元する)。
        // フックを使わないので、ルーターのないテストでも描画できる
        window.history.back();
      }}
      className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/30 text-gold-light"
    >
      <Icon name="back" size={18} />
    </Link>
  );
}
