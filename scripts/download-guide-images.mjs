// 早見表の画像(十二星座・天体・十二支)を Wikimedia Commons からダウンロードする。
// 一覧は src/data/guide/photos.json(早見表のデータもこれを読む)。既にあるファイルは飛ばす。
//   node scripts/download-guide-images.mjs
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const photos = JSON.parse(readFileSync(join(ROOT, "src", "data", "guide", "photos.json"), "utf8"));

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

let ok = 0;
let skip = 0;
let fail = 0;
for (const photo of photos) {
  const dest = join(PUBLIC, photo.path);
  if (existsSync(dest) && statSync(dest).size > 1000) {
    console.log(`SKIP ${photo.path}`);
    skip++;
    continue;
  }
  try {
    const buf = await download(photo);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    console.log(`OK   ${photo.path} (${Math.round(buf.length / 1024)}KB)`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${photo.path} ${photo.file}: ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  await sleep(DELAY_MS);
}

console.log(`\n=== Done: ${ok} ok, ${skip} skip, ${fail} fail ===`);
if (fail > 0) process.exitCode = 1;
