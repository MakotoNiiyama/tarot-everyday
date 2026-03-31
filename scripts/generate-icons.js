#!/usr/bin/env node
/**
 * PWA用アイコン生成スクリプト
 * 純粋なNode.jsでPNG (RGBA) を生成し、macOS sips で変換
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PUBLIC = path.join(__dirname, "..", "public");

// タロットアプリ用SVGアイコン - 星と月のモチーフ
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#130C06"/>
  <rect x="24" y="24" width="464" height="464" rx="64" fill="none" stroke="#CC8F1F" stroke-width="4" stroke-dasharray="12 6" opacity="0.5"/>
  <!-- 中央の星 (pentacle) -->
  <path d="M256 100 L280 200 L380 200 L298 260 L322 360 L256 300 L190 360 L214 260 L132 200 L232 200 Z" fill="none" stroke="#CC8F1F" stroke-width="6" stroke-linejoin="round"/>
  <!-- 上部の三日月 -->
  <path d="M256 60 A40 40 0 1 0 256 140 A28 28 0 1 1 256 60" fill="none" stroke="#CC8F1F" stroke-width="3" opacity="0.7"/>
  <!-- 下部の三日月 (反転) -->
  <path d="M256 372 A40 40 0 1 0 256 452 A28 28 0 1 1 256 372" fill="none" stroke="#CC8F1F" stroke-width="3" opacity="0.7" transform="rotate(180 256 412)"/>
  <!-- テキスト -->
  <text x="256" y="490" text-anchor="middle" fill="#CC8F1F" font-family="serif" font-size="36" opacity="0.8">TAROT</text>
</svg>`;

// SVGファイルを作成
const sizes = [192, 512];
const svgPaths = {};

for (const size of sizes) {
  const svgPath = path.join(PUBLIC, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgIcon(size));
  svgPaths[size] = svgPath;
  console.log(`Created SVG: icon-${size}x${size}.svg`);
}

// Apple Touch Icon (180x180)
const appleSvg = path.join(PUBLIC, "apple-touch-icon.svg");
fs.writeFileSync(appleSvg, svgIcon(180));
console.log("Created SVG: apple-touch-icon.svg");

// PNG変換を試みる (macOSのsipsではSVGは直接変換できないのでスキップ)
// ブラウザはSVGアイコンをサポートしているのでSVGのまま使用
console.log("\nSVG icons created. Modern browsers support SVG icons in manifest.");
console.log("For maximum compatibility, consider converting to PNG with ImageMagick:");
console.log("  brew install imagemagick");
console.log("  magick icon-512x512.svg icon-512x512.png");
