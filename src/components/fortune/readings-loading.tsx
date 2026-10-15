/** 計算エンジンを読み込んでいる間の置き場所 */
export function ReadingsLoading() {
  return (
    <div role="status" className="h-40 rounded-[20px] bg-surface/40">
      <span className="sr-only">運勢を計算しています</span>
    </div>
  );
}
