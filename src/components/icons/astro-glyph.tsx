import type { ReactNode } from "react";

/**
 * 星座と天体の記号をSVG線画で描く部品。
 * Unicodeの占星術記号は端末によって絵文字で表示されるため使わず、すべてパスで描く。
 * 24pxグリッド・塗りなし・丸い端点・currentColor は Icon と同じ約束に従う。
 * 天王星は日本と欧州で一般的な H に円を付けた形(ハーシェル記号)で描く。
 */

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

/** node はドラゴンヘッド(ノースノード)、lilith はブラックムーン・リリス。 */
export type CelestialBody =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "node"
  | "chiron"
  | "lilith";

export const CELESTIAL_BODIES: readonly CelestialBody[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "node",
  "chiron",
  "lilith",
];

export type AstroGlyphName = ZodiacSign | CelestialBody;

const GLYPHS: Record<AstroGlyphName, ReactNode> = {
  aries: (
    <path d="M12 20V9C12 5.5 10 4 7.5 4 5.5 4 4 5.5 4 7.3 4 9 5.2 10 6.5 10M12 9C12 5.5 14 4 16.5 4 18.5 4 20 5.5 20 7.3 20 9 18.8 10 17.5 10" />
  ),
  taurus: (
    <>
      <circle cx="12" cy="15" r="5" />
      <path d="M4.5 4C5.5 8 8.3 10 12 10S18.5 8 19.5 4" />
    </>
  ),
  gemini: <path d="M5 4C9.5 5.6 14.5 5.6 19 4M5 20C9.5 18.4 14.5 18.4 19 20M9 5.1V18.9M15 5.1V18.9" />,
  cancer: (
    <>
      <circle cx="7" cy="9.5" r="2.5" />
      <path d="M7 7C11 4.5 16.5 5 20 8.5" />
      <circle cx="17" cy="14.5" r="2.5" />
      <path d="M17 17C13 19.5 7.5 19 4 15.5" />
    </>
  ),
  leo: (
    <>
      <circle cx="7" cy="15.5" r="3" />
      <path d="M9.6 14C8.2 11.5 7.6 9 8.6 6.6 9.6 4.2 13.4 3.6 15.4 5.6 17.4 7.6 16.6 10.6 15 13.2 13.5 15.6 13.6 18.6 16 19.6 17.6 20.2 19 19.6 20 18.2" />
    </>
  ),
  virgo: (
    <path d="M4 7C5 7 6 8 6 9.5V18M6 10.5C6 7 10 7 10 10.5V18M10 10.5C10 7 14 7 14 10.5V15.5C14 18.5 15.5 20 18 20M14 15C15.5 11.5 20 11.5 19.5 15 19.2 17.5 17 19.5 13 20" />
  ),
  libra: (
    <path d="M4 19H20M4 15.5H8.6C7.3 14.4 6.5 12.8 6.5 11 6.5 8 9 5.5 12 5.5S17.5 8 17.5 11C17.5 12.8 16.7 14.4 15.4 15.5H20" />
  ),
  scorpio: (
    <path d="M4 7C5 7 6 8 6 9.5V17M6 10.5C6 7 10 7 10 10.5V17M10 10.5C10 7 14 7 14 10.5V16.5C14 18.2 15 19 16.5 19L20 15.5M17 15.5H20V18.5" />
  ),
  sagittarius: <path d="M5 19L19 5M12 5H19V12M7 12L12 17" />,
  capricorn: (
    <path d="M3.5 6.5C5 6.5 6 7.5 6.5 9L9 18 12 8.5C13 5.8 16.5 5.8 16.5 9V15.5C16.5 17.2 17.5 18.2 18.8 18 20.3 17.7 20.6 15.2 19 14.6 17.4 14 16 15.6 15 17.4 14 19.2 12.6 20 11 20" />
  ),
  aquarius: <path d="M4 11L8 7 12 11 16 7 20 11M4 17L8 13 12 17 16 13 20 17" />,
  pisces: <path d="M7 4C11 8 11 16 7 20M17 4C13 8 13 16 17 20M5 12H19" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  moon: <path d="M15.5 4A8.5 8.5 0 1 0 15.5 20 7 7 0 0 1 15.5 4Z" />,
  mercury: (
    <>
      <circle cx="12" cy="11" r="4" />
      <path d="M8.5 3A3.5 3.5 0 0 0 15.5 3M12 15V21M9 18H15" />
    </>
  ),
  venus: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14V21M9 18H15" />
    </>
  ),
  mars: (
    <>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14 10L19.5 4.5M14.5 4.5H19.5V9.5" />
    </>
  ),
  jupiter: <path d="M5 8C5 5.5 6.8 4 9 4 11.5 4 12.6 6.2 11.5 8.6L7 15H19M15 4V20" />,
  saturn: (
    <path d="M8 3V15M5 6H11M8 12C9 9.5 14 9 15 11.5 16 14 13 16 13 18.5 13 20 14.5 21 16 20" />
  ),
  uranus: (
    <>
      <path d="M6 3.5V14.5M18 3.5V14.5M6 9H18M12 3.5V15.5" />
      <circle cx="12" cy="18" r="2.5" />
    </>
  ),
  neptune: (
    <path d="M5 5C5 10.5 7.5 13 12 13S19 10.5 19 5M12 4V21M9 18H15M3.5 6.5L5 5 6.5 6.5M10.5 5.5L12 4 13.5 5.5M17.5 6.5L19 5 20.5 6.5" />
  ),
  pluto: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M6 5.5A6 6 0 0 0 18 5.5M12 11.5V21M8.5 17H15.5" />
    </>
  ),
  node: (
    <>
      <path d="M6.5 15.5V11A5.5 5.5 0 0 1 17.5 11V15.5" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </>
  ),
  chiron: (
    <>
      <circle cx="11" cy="17.5" r="3" />
      <path d="M11 3V14.5M11 9L16.5 4M11 9L16.5 13.5" />
    </>
  ),
  lilith: (
    <path d="M14.5 3A6.5 6.5 0 1 0 14.5 14 5.5 5.5 0 0 1 14.5 3ZM11 15V21M8 18.5H14" />
  ),
};

/** 外側の svg を持たない記号本体。チャートの円盤など、別の svg の中に埋め込むときに使う。 */
export function AstroGlyphPaths({ name }: { name: AstroGlyphName }) {
  return <>{GLYPHS[name]}</>;
}

export function AstroGlyph({
  name,
  size = 24,
  strokeWidth = 1.6,
  className,
  title,
}: {
  name: AstroGlyphName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}) {
  const labelled = title !== undefined && title !== "";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={className}
      {...(labelled ? { role: "img" } : { "aria-hidden": "true" as const })}
    >
      {labelled && <title>{title}</title>}
      <AstroGlyphPaths name={name} />
    </svg>
  );
}
