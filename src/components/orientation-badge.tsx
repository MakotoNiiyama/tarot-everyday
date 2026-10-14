import { Icon } from "@/components/icons/icon";

/** 正位置・逆位置のバッジ(正位置は gold、逆位置は terracotta) */
export function OrientationBadge({
  isReversed,
  className = "",
}: {
  isReversed: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-bold ${
        isReversed ? "bg-terracotta/18 text-terracotta" : "bg-gold/15 text-gold-light"
      } ${className}`}
    >
      <Icon name={isReversed ? "down" : "up"} size={14} strokeWidth={1.8} />
      {isReversed ? "逆位置" : "正位置"}
    </span>
  );
}
