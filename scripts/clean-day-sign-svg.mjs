// マヤの日の文字(Wikimedia Commons の DaySign *.svg)を、CSS の mask-image に使える線画だけの SVG にする。
// 依存なしの文字列処理。元の SVG は Adobe Illustrator の書き出しで、編集用のデータ(i:pgf)・白い背景・白い塗り(下の線を隠すため)を含む。
//   - XML 宣言・DOCTYPE・コメント・Illustrator の編集用データ(switch / foreignObject / i:pgf)を消す
//   - 全面の白い四角(背景)、defs・clipPath(全面を切り抜くだけで意味がない)を消す
//   - 白い塗りは none にし、塗りも線もない path は消す。黄色(#FDFB00。Imix に紛れた線)は消す
//   - 黒に近い色(#010000 など)は #000000 にそろえる。viewBox(81×81)は残す
//   - 線画の見た目が元の絵と変わらないことは、20枚を並べて確かめた(フェーズ5の計画)

const WHITE = /^#(?:fff|ffffff)$/i;
const STRAY = /^#fdfb00$/i;

/** 要素の開始タグの属性を { 名前: 値 } にする */
function parseAttrs(tag) {
  const attrs = {};
  for (const m of tag.matchAll(/([A-Za-z_:][\w:.-]*)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = m[2];
  return attrs;
}

/** 残す属性(見た目に関わるもの)だけを書き直す */
const KEEP = new Set([
  "d",
  "fill",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-miterlimit",
  "stroke-linecap",
  "stroke-linejoin",
  "transform",
  "points",
  "x",
  "y",
  "width",
  "height",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x1",
  "y1",
  "x2",
  "y2",
]);

function writeAttrs(attrs) {
  return Object.entries(attrs)
    .filter(([k]) => KEEP.has(k))
    .map(([k, v]) => ` ${k}="${v}"`)
    .join("");
}

/** 黒に近い色を #000000 にそろえる(線画として使うので色は意味を持たない) */
function normalizeColor(v) {
  if (v === undefined || v === "none") return v;
  if (WHITE.test(v)) return "none";
  return "#000000";
}

/** 描く要素(path・rect など)を1つ書き直す。消すときは空文字を返す */
function cleanShape(name, attrs) {
  if (name === "rect" && attrs.width === "81" && attrs.height === "81" && !attrs.x && !attrs.y) return "";
  if ((attrs.fill && STRAY.test(attrs.fill)) || (attrs.stroke && STRAY.test(attrs.stroke))) return "";
  const next = { ...attrs };
  if ("fill" in next) next.fill = normalizeColor(next.fill);
  if ("stroke" in next) next.stroke = normalizeColor(next.stroke);
  const filled = next.fill !== "none";
  const stroked = next.stroke !== undefined && next.stroke !== "none";
  if (!filled && !stroked) return "";
  if (next.fill === undefined) delete next.fill;
  return `<${name}${writeAttrs(next)}/>`;
}

/** DaySign の SVG を線画だけの SVG にする */
export function cleanDaySignSvg(source) {
  let s = source
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/g, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, "")
    .replace(/<i:pgf[\s\S]*?<\/i:pgf>/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
    .replace(/<defs[\s\S]*?<\/defs>/g, "")
    .replace(/<clipPath[\s\S]*?<\/clipPath>/g, "")
    .replace(/<\/?switch[^>]*>/g, "");

  const svgTag = s.match(/<svg\b[^>]*>/);
  if (!svgTag) throw new Error("svg 要素がない");
  const viewBox = parseAttrs(svgTag[0]).viewBox ?? "0 0 81 81";
  const body = s.slice(svgTag.index + svgTag[0].length, s.lastIndexOf("</svg>"));

  // 描く要素は自己終了タグ(<path .../>)で書かれている。g はそのまま入れ子を残し、属性は消す
  const out = body
    .replace(/<(path|rect|polygon|polyline|circle|ellipse|line)\b([^>]*?)\/>/g, (_, name, rest) =>
      cleanShape(name, parseAttrs(rest)),
    )
    .replace(/<g\b[^>]*>/g, "<g>")
    .replace(/<(?!\/?(?:g|path|rect|polygon|polyline|circle|ellipse|line)\b)[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .replace(/<g><\/g>/g, "")
    .trim();

  if (!/<(path|rect|polygon|polyline|circle|ellipse|line)\b/.test(out)) throw new Error("線画が残らなかった");
  // 大きさ(width・height)も書く。ないとブラウザによっては画像の大きさが 0 になり、読み込めたかを確かめられない
  const [, , w, h] = viewBox.split(/[\s,]+/);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${out}</svg>\n`;
}
