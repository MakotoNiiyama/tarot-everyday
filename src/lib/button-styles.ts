/** 共通ボタンのクラス(Claude Design の Components に準拠。最小高さ44px、角丸14px) */
const base =
  "inline-flex items-center justify-center gap-1.5 rounded-[14px] min-h-11 px-5 text-[15px] font-bold transition-colors";

export const primaryButton = `${base} min-h-12 bg-gold text-background hover:bg-gold-light`;
export const secondaryButton = `${base} border border-gold/50 bg-gold/10 text-gold-light hover:bg-gold/20`;
export const outlineButton = `${base} border border-gold/40 text-[14px] font-normal text-gold-light hover:bg-gold/10`;
