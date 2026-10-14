"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 旧URLから新URLへ転送する。
 * 静的エクスポート(output: "export")では next.config の redirects が使えないため、クライアント側で移動する。
 */
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm text-gold-dim">ページが移動しました。</p>
      <Link href={to} className="text-sm text-gold-light underline underline-offset-4">
        新しいページを開く
      </Link>
    </div>
  );
}
