// 早見表ページ(新URL)。占術タブは ?tab= で指定する
import { GuideBrowser } from "@/components/guide/guide-browser";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

export default function GuidePage() {
  return (
    <PageContainer>
      <PageHeader accent="Guide" title="早見表" />
      {/* タブは URL から読む。事前描画ではタブを選ばず、仮の表示だけを出す(カード画像を HTML に含めない) */}
      <GuideBrowser />
    </PageContainer>
  );
}
