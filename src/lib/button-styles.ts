/** 共通ボタンのクラス(Claude Design の Components に準拠。最小高さ44px、角丸14px) */
const base =
  "inline-flex items-center justify-center gap-1.5 rounded-[14px] px-5 transition-colors";

export const primaryButton = `${base} min-h-12 text-[15px] font-bold bg-gold text-background hover:bg-gold-light`;
export const secondaryButton = `${base} min-h-11 text-[15px] font-bold border border-gold/50 bg-gold/10 text-gold-light hover:bg-gold/20`;
export const outlineButton = `${base} min-h-11 text-[14px] border border-gold/40 text-gold-light hover:bg-gold/10`;
