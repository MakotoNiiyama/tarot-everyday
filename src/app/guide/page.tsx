// 早見表ページ(新URL)。占術タブは ?tab= で指定する
import { Suspense } from "react";
import { GuideBrowser, GuideBrowserView } from "@/components/guide/guide-browser";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

export default function GuidePage() {
  return (
    <PageContainer>
      <PageHeader accent="Guide" title="早見表" />
      {/* useSearchParams を使う部品はクライアントで描画される。事前描画ではタロットのタブを出しておく */}
      <Suspense fallback={<GuideBrowserView tab="tarot" />}>
        <GuideBrowser />
      </Suspense>
    </PageContainer>
  );
}
