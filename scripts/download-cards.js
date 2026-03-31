const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BASE = "https://commons.wikimedia.org/wiki/Special:FilePath";
const DIR = path.join(__dirname, "..", "public", "cards");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const major = [
  ["00-fool", "RWS_Tarot_00_Fool.jpg"],
  ["01-magician", "RWS_Tarot_01_Magician.jpg"],
  ["02-high-priestess", "RWS_Tarot_02_High_Priestess.jpg"],
  ["03-empress", "RWS_Tarot_03_Empress.jpg"],
  ["04-emperor", "RWS_Tarot_04_Emperor.jpg"],
  ["05-hierophant", "RWS_Tarot_05_Hierophant.jpg"],
  ["06-lovers", "RWS_Tarot_06_Lovers.jpg"],
  ["07-chariot", "RWS_Tarot_07_Chariot.jpg"],
  ["08-strength", "RWS_Tarot_08_Strength.jpg"],
  ["09-hermit", "RWS_Tarot_09_Hermit.jpg"],
  ["10-wheel-of-fortune", "RWS_Tarot_10_Wheel_of_Fortune.jpg"],
  ["11-justice", "RWS_Tarot_11_Justice.jpg"],
  ["12-hanged-man", "RWS_Tarot_12_Hanged_Man.jpg"],
  ["13-death", "RWS_Tarot_13_Death.jpg"],
  ["14-temperance", "RWS_Tarot_14_Temperance.jpg"],
  ["15-devil", "RWS_Tarot_15_Devil.jpg"],
  ["16-tower", "RWS_Tarot_16_Tower.jpg"],
  ["17-star", "RWS_Tarot_17_Star.jpg"],
  ["18-moon", "RWS_Tarot_18_Moon.jpg"],
  ["19-sun", "RWS_Tarot_19_Sun.jpg"],
  ["20-judgement", "RWS_Tarot_20_Judgement.jpg"],
  ["21-world", "RWS_Tarot_21_World.jpg"],
];

const suitWiki = { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pents" };

function dl(url, dest) {
  try {
    execSync(`curl -sL -f -o "${dest}" -H "User-Agent: ${UA}" "${url}"`, { timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

// Create dirs
fs.mkdirSync(path.join(DIR, "major"), { recursive: true });
for (const s of ["wands", "cups", "swords", "pentacles"])
  fs.mkdirSync(path.join(DIR, "minor", s), { recursive: true });

let ok = 0, fail = 0;

console.log("=== Major Arcana (22) ===");
for (const [local, wiki] of major) {
  const dest = path.join(DIR, "major", `${local}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`SKIP ${local}`); ok++; continue;
  }
  if (dl(`${BASE}/${wiki}`, dest)) {
    console.log(`OK   ${local}`); ok++;
  } else {
    console.log(`FAIL ${local}`); fail++;
  }
}

console.log("\n=== Minor Arcana (56) ===");
for (const suit of ["wands", "cups", "swords", "pentacles"]) {
  for (let i = 1; i <= 14; i++) {
    const num = String(i).padStart(2, "0");
    const dest = path.join(DIR, "minor", suit, `${num}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`SKIP ${suit}/${num}`); ok++; continue;
    }
    let wiki;
    if (suit === "wands" && i === 9) {
      wiki = "Tarot_Nine_of_Wands.jpg";
    } else {
      wiki = `${suitWiki[suit]}${num}.jpg`;
    }
    if (dl(`${BASE}/${wiki}`, dest)) {
      console.log(`OK   ${suit}/${num}`); ok++;
    } else {
      console.log(`FAIL ${suit}/${num} (${wiki})`); fail++;
    }
  }
}

console.log(`\n=== Done: ${ok} ok, ${fail} fail ===`);
