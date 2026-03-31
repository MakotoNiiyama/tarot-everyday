/**
 * スクラッチアート風 装飾ディバイダー
 * 星・三日月モチーフの区切り線
 */
export function ScratchDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-6 ${className}`}
      aria-hidden="true"
    >
      {/* 左ライン */}
      <path
        d="M10 12 Q40 10 70 12 T130 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* 中央：星モチーフ */}
      <path
        d="M160 4 L162 10 L168 10 L163 14 L165 20 L160 16 L155 20 L157 14 L152 10 L158 10 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 右ライン */}
      <path
        d="M190 12 Q220 14 250 12 T310 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * スクラッチアート風 カードフレーム
 * 手描き風の不均一なボーダー
 */
export function ScratchFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* 手描き風ボーダー枠 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 200 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 6 Q3 3 6 4 L194 3 Q197 3 196 6 L197 274 Q197 277 194 276 L6 277 Q3 277 4 274 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
          strokeDasharray="4 2"
        />
        {/* 四隅の装飾ドット */}
        <circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="194" cy="6" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="6" cy="274" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="194" cy="274" r="2" fill="currentColor" opacity="0.5" />
      </svg>
      {children}
    </div>
  );
}

/**
 * スクラッチアート風 三日月装飾
 */
export function ScratchMoon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-10 h-10 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M28 8 A14 14 0 1 0 28 32 A10 10 0 1 1 28 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* 小さな星 */}
      <circle cx="30" cy="12" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="34" cy="20" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="32" cy="28" r="0.6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/**
 * スクラッチアート風 ヘッダー装飾（太陽と星）
 */
export function ScratchHeader({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-xs h-10 ${className}`}
      aria-hidden="true"
    >
      {/* 中央太陽 */}
      <circle
        cx="100"
        cy="20"
        r="8"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      {/* 光線 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 100 + Math.cos(rad) * 11;
        const y1 = 20 + Math.sin(rad) * 11;
        const x2 = 100 + Math.cos(rad) * 16;
        const y2 = 20 + Math.sin(rad) * 16;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        );
      })}
      {/* 左右の装飾ライン */}
      <path
        d="M10 20 Q30 18 60 20 T80 20"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M120 20 Q140 22 170 20 T190 20"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
