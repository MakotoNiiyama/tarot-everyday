import type { ReactNode } from "react";

/** ページ本文の幅と余白(タブレットは最大672px、PCは最大1000px) */
export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[672px] flex-1 flex-col gap-5 px-4 py-6 lg:max-w-[1000px] lg:gap-7 lg:px-12 lg:py-10 ${className}`}
    >
      {children}
    </div>
  );
}
