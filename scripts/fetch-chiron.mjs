// scripts/fetch-chiron.mjs
// JPL Horizons API からキロン(2060 Chiron)の地心黄経(ecliptic of date、視位置)を
// 1899-12-01〜2100-01-31 の10日刻みで取得し、src/lib/fortune/horoscope/chiron-table.ts を書き出す。
// 実行: node scripts/fetch-chiron.mjs(ビルドでは実行しない。生成したファイルをコミットする)
import { writeFileSync } from "node:fs";

const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

// 1900-01-01 0時(日本時間)の前後12時間と、2100-01-01 の終わりの前後12時間まで4点補間できるよう、両端に余裕を持たせる
const START = Date.UTC(1899, 11, 1);
const STEP_MS = 10 * 86_400_000;
/** START からの10日刻み。2100-01-31 は START から 7311 刻み目 */
const END = START + 7311 * STEP_MS;
if (isoDate(END) !== "2100-01-31") throw new Error(`END が ${isoDate(END)}`);
/** 1回に取る行数。区切りも START からの10日刻みにそろえる(暦の年で区切ると刻みがずれる) */
const ROWS_PER_SPAN = 2000;
const SPANS = [];
for (let from = START; from <= END; from += ROWS_PER_SPAN * STEP_MS) {
  SPANS.push([isoDate(from), isoDate(Math.min(from + (ROWS_PER_SPAN - 1) * STEP_MS, END))]);
}

/** Horizons の CSV で黄経が入っている列(見出し "Date__(UT)__HR:MN, , , ObsEcLon, ObsEcLat," で確かめる) */
const LON_COLUMN = 3;

async function fetchSpan(start, stop) {
  const params = new URLSearchParams({
    format: "text",
    // 小惑星番号 2060。"DES=2060;" は小天体の仮符号の検索になり見つからない
    COMMAND: "'2060;'",
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: "'10 d'",
    QUANTITIES: "'31'",
    CSV_FORMAT: "'YES'",
  });
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`, {
    headers: { "User-Agent": "tarot-everyday chiron-table generator (static build data)" },
  });
  if (!res.ok) throw new Error(`Horizons ${res.status}`);
  const text = await res.text();
  const [head, rest] = text.split("$$SOE");
  const body = rest?.split("$$EOE")[0];
  if (!body) throw new Error("Horizons の出力に $$SOE がありません");
  const header = head.split("\n").find((line) => line.includes("Date__(UT)"));
  if (header?.split(",")[LON_COLUMN]?.trim() !== "ObsEcLon") throw new Error(`列の見出しが想定と違います: ${header}`);
  return body
    .trim()
    .split("\n")
    .map((line) => Number(line.split(",")[LON_COLUMN]));
}

const lons = [];
for (const [start, stop] of SPANS) {
  const part = await fetchSpan(start, stop);
  if (part.some((v) => !Number.isFinite(v))) throw new Error(`数値でない行があります: ${start}`);
  lons.push(...part);
}

const expectedRows = Math.floor((END - START) / STEP_MS) + 1;
if (lons.length !== expectedRows) throw new Error(`行数が ${lons.length}(想定 ${expectedRows})`);

const millideg = lons.map((v) => Math.round(v * 1000));
const out = `// 生成ファイル(scripts/fetch-chiron.mjs)。手で編集しない。
// Source: JPL Horizons (NASA/JPL-Caltech). 2060 Chiron, geocentric apparent ecliptic longitude of date.
/** 表の最初の日(${isoDate(START)} 0時 UT)のユリウス日 */
export const CHIRON_START_JD = ${START / 86_400_000 + 2440587.5};
export const CHIRON_STEP_DAYS = 10;
/** 黄経(1/1000度) */
export const CHIRON_MILLIDEG: readonly number[] = [${millideg.join(",")}];
`;
writeFileSync(new URL("../src/lib/fortune/horoscope/chiron-table.ts", import.meta.url), out);
console.log(`${millideg.length} rows`);
