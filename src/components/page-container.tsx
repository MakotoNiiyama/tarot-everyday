import type { ReactNode } from "react";

/**
 * ページ本文の幅と余白(タブレットは最大672px、PCは最大1000px)。
 * wide を付けると 1280px〜で最大1100pxまで広げる(2カラムのページ用)
 */
export function PageContainer({
  children,
  wide = false,
  className = "",
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[672px] flex-1 flex-col gap-5 px-4 py-6 lg:max-w-[1000px] lg:gap-7 lg:px-12 lg:py-10 ${
        wide ? "xl:max-w-[1100px]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
