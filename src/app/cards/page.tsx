import { ScratchDivider } from "@/components/svg/scratch-decorations";
import { CardBrowser } from "@/components/card-browser";
import { allCards } from "@/data/cards";

export default function CardsPage() {
  return (
    <div className="flex flex-col flex-1 px-3 py-6 pb-20 gap-4">
      {/* ヘッダー */}
      <div className="flex flex-col items-center">
        <h1 className="font-heading text-2xl font-bold text-gold">
          早見表
        </h1>
        <p className="text-gold-dim text-xs mt-1">全78枚のタロットカード</p>
        <ScratchDivider className="text-gold mt-3" />
      </div>

      {/* フィルター・検索・グリッド/リスト表示 */}
      <CardBrowser cards={allCards} />
    </div>
  );
}
