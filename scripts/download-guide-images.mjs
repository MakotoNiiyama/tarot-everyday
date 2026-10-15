// 早見表の画像を Wikimedia Commons からダウンロードする。既にあるファイルは飛ばす。
//   - 十二星座・天体・十二支の絵画・写真: src/data/guide/photos.json(早見表のデータもこれを読む)
//   - マヤ暦の太陽の紋章の線画: src/data/guide/maya-glyphs.json。記録した版(revision)を取り、
//     SHA-1 を確かめてから mask-image 用の線画に整える(scripts/clean-day-sign-svg.mjs)
//   node scripts/download-guide-images.mjs
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanDaySignSvg } from "./clean-day-sign-svg.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const readJson = (name) => JSON.parse(readFileSync(join(ROOT, "src", "data", "guide", name), "utf8"));
const photos = readJson("photos.json");
const mayaGlyphs = readJson("maya-glyphs.json");

const BASE = "https://commons.wikimedia.org/wiki/Special:FilePath";
// Commons の縮小版は決まった幅(960px など)に丸められる
const WIDTH = 960;
// Wikimedia の User-Agent の方針: アプリ名・用途・連絡先を書く
const UA = "tarot-everyday-guide-images/1.0 (https://github.com/MakotoNiiyama/tarot-everyday; one-time download of public-domain images for a personal study app) node-fetch";
const DELAY_MS = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Special:FilePath の転送先(縮小版の URL)を調べる。PNG の縮小版は末尾に .jpg を足すと JPEG で返る */
async function resolveJpegUrl(file) {
  const res = await fetch(`${BASE}/${encodeURIComponent(file)}?width=${WIDTH}`, {
    method: "HEAD",
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("image/jpeg")) return res.url;
  const url = new URL(res.url);
  if (!url.pathname.includes("/thumb/")) throw new Error(`JPEG の縮小版がない(${type})`);
  url.pathname += ".jpg";
  url.search = "";
  return url.toString();
}

async function download(photo) {
  const url = await resolveJpegUrl(photo.file);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/jpeg")) throw new Error(`JPEG ではない(${type})`);
  return Buffer.from(await res.arrayBuffer());
}

/** 記録した版の SVG を取り、SHA-1 が一致することを確かめてから線画に整える */
async function downloadGlyph(glyph) {
  const res = await fetch(glyph.revision.url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sha1 = createHash("sha1").update(buf).digest("hex");
  if (sha1 !== glyph.revision.sha1) throw new Error(`SHA-1 が違う(${sha1})。Commons で版が変わった可能性がある`);
  return Buffer.from(cleanDaySignSvg(buf.toString("utf8")), "utf8");
}

let ok = 0;
let skip = 0;
let fail = 0;

/** 1件をダウンロードして保存する。minSize より小さいファイルは壊れているとみなして取り直す */
async function save(path, label, minSize, fetcher) {
  const dest = join(PUBLIC, path);
  if (existsSync(dest) && statSync(dest).size > minSize) {
    console.log(`SKIP ${path}`);
    skip++;
    return;
  }
  try {
    const buf = await fetcher();
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log(`OK   ${path} (${Math.round(buf.length / 1024)}KB)`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${path} ${label}: ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  await sleep(DELAY_MS);
}

for (const photo of photos) await save(photo.path, photo.file, 1000, () => download(photo));
for (const glyph of mayaGlyphs) await save(glyph.path, glyph.file, 200, () => downloadGlyph(glyph));

console.log(`\n=== Done: ${ok} ok, ${skip} skip, ${fail} fail ===`);
if (fail > 0) process.exitCode = 1;
