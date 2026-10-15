"use client";

import { useState } from "react";
import { AstroGlyph, AstroGlyphPaths, ZODIAC_SIGNS, type AstroGlyphName, type CelestialBody } from "@/components/icons/astro-glyph";
import { FactDetailSheet } from "@/components/guide/fact-detail-sheet";
import { SIGNS, formatDegree, signOf } from "@/lib/fortune/horoscope/zodiac";
import type { NatalChart } from "@/lib/fortune/types";
import { useRovingSelection } from "@/lib/use-roving-selection";

type Chart = Extract<NatalChart, { kind: "horoscope" }>;
type HouseSystem = keyof Chart["cusps"];
type ChartAspect = Chart["aspects"][number];

const HOUSE_SYSTEMS: { value: HouseSystem; label: string }[] = [
  { value: "placidus", label: "プラシーダス" },
  { value: "koch", label: "コッホ" },
  { value: "whole", label: "ホールサイン" },
];
const HOUSE_VALUES = HOUSE_SYSTEMS.map((s) => s.value);

// チャート円の寸法(viewBox 300×300)
const C = 150;
const R_OUTER = 146;
const R_SIGN = 120; // 星座の輪の内側
const R_BODY = 102; // 天体の記号(外側の段)
const R_BODY_INNER = 84; // 天体の記号(混み合うときの内側の段)
const R_HOUSE = 70; // ハウス番号の輪の外側
const R_ASPECT = 56; // アスペクトの線を引く円
const SIGN_GLYPH = 13;
const BODY_GLYPH = 14;
/** 同じ段で隣り合う記号の最小の間隔(度) */
const SEP_SAME = 9;
/** 段を交互にずらすときの隣どうしの最小の間隔(度) */
const SEP_ALTERNATE = 5.5;

const POINT_NAME: Record<string, string> = { asc: "ASC", mc: "MC" };
const HARMONIOUS = new Set(["sextile", "trine", "semisextile", "quintile", "biquintile"]);
const TENSE = new Set(["square", "opposition", "semisquare", "sesquiquadrate"]);

const mod360 = (x: number) => ((x % 360) + 360) % 360;

/** 黄経を画面の座標にする。ASC を左(9時)に置き、黄経が反時計回りに増える */
function point(lon: number, r: number, asc: number) {
  const theta = ((180 + lon - asc) * Math.PI) / 180;
  return { x: C + r * Math.cos(theta), y: C - r * Math.sin(theta) };
}

/**
 * 円周上の点を、隣どうしが sep 度以上離れるように広げる(重なる点は塊にまとめ、塊の平均を中心に等間隔に並べる)。
 * 戻り値は入力と同じ順の表示用の黄経
 */
function spread(lons: number[], sep: number): number[] {
  const n = lons.length;
  if (n < 2) return [...lons];
  const order = lons.map((lon, i) => ({ lon: mod360(lon), i })).sort((a, b) => a.lon - b.lon);
  // 最も大きい隙間の後ろから並べ直して、円を直線に開く
  let gapAt = 0;
  let gap = -1;
  for (let k = 0; k < n; k++) {
    const g = k === n - 1 ? order[0].lon + 360 - order[k].lon : order[k + 1].lon - order[k].lon;
    if (g > gap) {
      gap = g;
      gapAt = (k + 1) % n;
    }
  }
  const line = [...order.slice(gapAt), ...order.slice(0, gapAt)];
  const base = line[0].lon;
  const values = line.map((p) => (p.lon < base ? p.lon + 360 : p.lon));

  const clusters: { from: number; count: number; sum: number }[] = [];
  const startOf = (c: { count: number; sum: number }) => c.sum / c.count - ((c.count - 1) * sep) / 2;
  values.forEach((v, k) => {
    clusters.push({ from: k, count: 1, sum: v });
    while (clusters.length >= 2) {
      const b = clusters[clusters.length - 1];
      const a = clusters[clusters.length - 2];
      if (startOf(a) + a.count * sep <= startOf(b)) break;
      clusters.splice(-2, 2, { from: a.from, count: a.count + b.count, sum: a.sum + b.sum });
    }
  });
  const result = new Array<number>(n);
  for (const c of clusters) {
    const start = startOf(c);
    for (let k = 0; k < c.count; k++) result[line[c.from + k].i] = mod360(start + k * sep);
  }
  return result;
}

/**
 * 天体の記号の置き場所。重なるときは角度を広げ、それでも混み合う並び(隣が SEP_SAME 度未満)は
 * 外側と内側の段に交互に置く
 */
export function layoutBodies(bodies: { key: string; lon: number }[], asc: number) {
  const shown = spread(
    bodies.map((b) => b.lon),
    SEP_ALTERNATE,
  );
  const order = shown.map((lon, i) => ({ lon, i })).sort((a, b) => a.lon - b.lon);
  const inner = new Array<boolean>(bodies.length).fill(false);
  // 隙間が SEP_SAME 度以上のところで区切り、区切りの中で段を交互にする
  let start = order.findIndex((p, k) => mod360(p.lon - order[(k - 1 + order.length) % order.length].lon) >= SEP_SAME);
  if (start < 0) start = 0;
  let alt = false;
  for (let k = 0; k < order.length; k++) {
    const cur = order[(start + k) % order.length];
    const prev = order[(start + k - 1 + order.length) % order.length];
    alt = k > 0 && mod360(cur.lon - prev.lon) < SEP_SAME ? !alt : false;
    inner[cur.i] = alt;
  }
  return bodies.map((b, i) => ({ key: b.key, lon: b.lon, shownLon: shown[i], inner: inner[i], ...point(shown[i], inner[i] ? R_BODY_INNER : R_BODY, asc) }));
}

function aspectTone(kind: string): "harmonious" | "tense" | "neutral" {
  if (HARMONIOUS.has(kind)) return "harmonious";
  if (TENSE.has(kind)) return "tense";
  return "neutral";
}

const TONE_STROKE = { harmonious: "stroke-gold", tense: "stroke-terracotta", neutral: "stroke-gold-dim" } as const;
const TONE_BORDER = { harmonious: "border-gold", tense: "border-terracotta", neutral: "border-gold-dim" } as const;

/** 記号を別の svg の中に置く(中心が x, y) */
function Glyph({ name, x, y, size, className }: { name: AstroGlyphName; x: number; y: number; size: number; className: string }) {
  const s = size / 24;
  return (
    <g
      transform={`translate(${(x - size / 2).toFixed(2)} ${(y - size / 2).toFixed(2)}) scale(${s.toFixed(4)})`}
      fill="none"
      strokeWidth={1.1 / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      stroke="currentColor"
    >
      <AstroGlyphPaths name={name} />
    </g>
  );
}

function Wheel({ chart, system, aspects }: { chart: Chart; system: HouseSystem; aspects: ChartAspect[] }) {
  const { asc, mc } = chart;
  const cusps = chart.cusps[system];
  const lonOfPoint = new Map<string, number>([...chart.bodies.map((b) => [b.key, b.lon] as const), ["asc", asc], ["mc", mc]]);
  const placed = layoutBodies(chart.bodies, asc);
  const line = (lon: number, r1: number, r2: number) => {
    const p = point(lon, r1, asc);
    const q = point(lon, r2, asc);
    return { x1: p.x, y1: p.y, x2: q.x, y2: q.y };
  };
  const label = `西洋占星術のホロスコープ。ASC ${SIGNS[signOf(asc)].name}、MC ${SIGNS[signOf(mc)].name}`;
  // Placidus・Koch の1・4・7・10室のカスプは ASC・MC の軸と同じなので、軸として太く描く
  const axisCusp = (i: number) => system !== "whole" && i % 3 === 0;

  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={label} className="mx-auto block aspect-square w-full max-w-[300px]">
      <circle cx={C} cy={C} r={R_OUTER} className="fill-popover stroke-gold/30" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_SIGN} className="fill-none stroke-gold/30" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_HOUSE} className="fill-none stroke-gold/20" strokeWidth={0.75} />
      <circle cx={C} cy={C} r={R_ASPECT} className="fill-none stroke-gold/20" strokeWidth={0.75} />

      {/* 星座の境界と記号(各30度の中央) */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const g = point(i * 30 + 15, (R_OUTER + R_SIGN) / 2, asc);
        return (
          <g key={sign}>
            <line {...line(i * 30, R_SIGN, R_OUTER)} className="stroke-gold/30" strokeWidth={0.75} />
            <Glyph name={sign} x={g.x} y={g.y} size={SIGN_GLYPH} className="text-gold-light" />
          </g>
        );
      })}

      {/* ハウスのカスプとハウス番号 */}
      {cusps.map((cusp, i) =>
        axisCusp(i) ? null : <line key={`cusp-${i}`} {...line(cusp, R_ASPECT, R_SIGN)} className="stroke-gold/25" strokeWidth={0.6} />,
      )}
      {cusps.map((cusp, i) => {
        const next = cusps[(i + 1) % 12];
        const p = point(cusp + mod360(next - cusp) / 2, (R_HOUSE + R_ASPECT) / 2, asc);
        return (
          <text
            key={`house-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gold-dim"
            fontSize={7}
          >
            {i + 1}
          </text>
        );
      })}

      {/* ASC-DSC・MC-IC の軸 */}
      <line {...line(asc, R_ASPECT, R_OUTER)} className="stroke-gold/70" strokeWidth={1.4} />
      <line {...line(asc + 180, R_ASPECT, R_OUTER)} className="stroke-gold/40" strokeWidth={1} />
      <line {...line(mc, R_ASPECT, R_OUTER)} className="stroke-gold/70" strokeWidth={1.4} />
      <line {...line(mc + 180, R_ASPECT, R_OUTER)} className="stroke-gold/40" strokeWidth={1} />
      {(
        [
          ["ASC", asc],
          ["MC", mc],
        ] as const
      ).map(([name, lon]) => {
        const p = point(lon + 5, R_SIGN - 7, asc);
        return (
          <text key={name} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="fill-gold" fontSize={6.5} fontWeight={700}>
            {name}
          </text>
        );
      })}

      {/* アスペクトの線(コンジャンクションは線にしない) */}
      {aspects
        .filter((a) => a.kind !== "conjunction")
        .map((a) => {
          const p = point(lonOfPoint.get(a.a)!, R_ASPECT, asc);
          const q = point(lonOfPoint.get(a.b)!, R_ASPECT, asc);
          const dashed = a.minor || a.kind === "quincunx";
          return (
            <line
              key={`${a.a}-${a.b}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              className={TONE_STROKE[aspectTone(a.kind)]}
              strokeWidth={dashed ? 0.7 : 0.9}
              strokeDasharray={dashed ? "3 2" : undefined}
              strokeOpacity={0.85}
            />
          );
        })}

      {/* 天体: 本当の位置の目盛りと、重ならないように置いた記号 */}
      {placed.map((b) => {
        const tick = line(b.lon, R_SIGN - 4, R_SIGN);
        const foot = point(b.lon, R_ASPECT, asc);
        return (
          <g key={b.key}>
            <line {...tick} className="stroke-gold-light" strokeWidth={1} />
            <circle cx={foot.x} cy={foot.y} r={1.2} className="fill-gold-dim" />
            <Glyph name={b.key as CelestialBody} x={b.x} y={b.y} size={BODY_GLYPH} className="text-cream" />
          </g>
        );
      })}
    </svg>
  );
}

function HouseSystemSwitch({ value, onChange }: { value: HouseSystem; onChange: (v: HouseSystem) => void }) {
  const { itemProps } = useRovingSelection({ values: HOUSE_VALUES, value, onChange });
  return (
    <div role="radiogroup" aria-label="ハウスシステム" className="grid grid-cols-3 gap-1 rounded-[14px] border border-gold/25 bg-popover p-1">
      {HOUSE_SYSTEMS.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            {...itemProps(i)}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-[11px] text-[13px] font-bold ${checked ? "bg-gold text-background" : "text-gold-dim hover:text-cream"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function BodyTable({ chart, system }: { chart: Chart; system: HouseSystem }) {
  return (
    <table className="w-full border-collapse text-left text-[13px]">
      <caption className="sr-only">天体の位置</caption>
      <thead>
        <tr className="border-b border-gold/20 text-[11px] text-gold-dim">
          <th scope="col" className="py-1.5 pr-2 font-normal">
            天体
          </th>
          <th scope="col" className="px-1 py-1.5 font-normal">
            星座
          </th>
          <th scope="col" className="px-1 py-1.5 text-right font-normal">
            度数
          </th>
          <th scope="col" className="py-1.5 pl-1 text-right font-normal">
            ハウス
          </th>
        </tr>
      </thead>
      <tbody>
        {chart.bodies.map((b) => (
          <tr key={b.key} className="border-b border-gold/10 last:border-b-0">
            <td className="py-0.5 pr-2">
              <FactDetailSheet
                fact={b.fact}
                className="flex min-h-9 w-full items-center gap-1.5 text-left text-cream hover:text-gold-light"
              >
                <AstroGlyph name={b.key as CelestialBody} size={16} strokeWidth={1.7} className="flex-none text-gold-light" />
                <span className="leading-tight">{b.name}</span>
                {b.retrograde && <span className="flex-none text-[10px] leading-none text-terracotta">逆行</span>}
              </FactDetailSheet>
            </td>
            <td className="px-1 py-0.5 whitespace-nowrap">{SIGNS[signOf(b.lon)].name}</td>
            <td className="px-1 py-0.5 text-right whitespace-nowrap tabular-nums text-gold-dim">{formatDegree(b.lon)}</td>
            <td className="py-0.5 pl-1 text-right tabular-nums">{b.houses[system]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AspectList({ chart, aspects }: { chart: Chart; aspects: ChartAspect[] }) {
  const nameOf = (key: string) => POINT_NAME[key] ?? chart.bodies.find((b) => b.key === key)?.name ?? key;
  return (
    <ul aria-label="アスペクト" className="grid grid-cols-1 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
      {aspects.map((a) => {
        const tone = aspectTone(a.kind);
        const dashed = a.minor || a.kind === "quincunx";
        return (
          <li key={`${a.a}-${a.b}`} className="flex items-center gap-2">
            {a.kind === "conjunction" ? (
              <span aria-hidden="true" className="inline-flex w-3.5 flex-none justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-light" />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className={`inline-block h-0 w-3.5 flex-none border-t-[1.5px] ${dashed ? "border-dashed" : ""} ${TONE_BORDER[tone]}`}
              />
            )}
            <span>
              {nameOf(a.a)} - {nameOf(a.b)} {a.name}
              <span className="ml-1 tabular-nums text-gold-dim">{a.orb.toFixed(1)}°</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** 西洋占星術のチャート円・天体の表・アスペクトの一覧と、ハウスシステム・マイナーアスペクトの切り替え */
export function HoroscopeChart({ chart }: { chart: Chart }) {
  const [system, setSystem] = useState<HouseSystem>("placidus");
  const [showMinor, setShowMinor] = useState(false);
  const aspects = chart.aspects.filter((a) => showMinor || !a.minor);

  return (
    <div className="flex flex-col gap-3">
      <HouseSystemSwitch value={system} onChange={setSystem} />
      <Wheel chart={chart} system={system} aspects={aspects} />
      {chart.notes.map((note) => (
        <p key={note} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-terracotta">
          <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-terracotta" />
          {note}
        </p>
      ))}
      <BodyTable chart={chart} system={system} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-heading text-sm text-cream">アスペクト</h4>
          <button
            type="button"
            aria-pressed={showMinor}
            onClick={() => setShowMinor((v) => !v)}
            className="flex min-h-9 items-center gap-2 text-[12px] text-gold-dim hover:text-cream"
          >
            <span>マイナーアスペクトを表示</span>
            <span
              aria-hidden="true"
              className={`relative inline-block h-5 w-9 flex-none rounded-full border transition-colors ${
                showMinor ? "border-gold bg-gold/40" : "border-gold/30 bg-popover"
              }`}
            >
              <span
                className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-[left] ${
                  showMinor ? "left-[18px] bg-gold-light" : "left-0.5 bg-gold-dim"
                }`}
              />
            </span>
          </button>
        </div>
        <AspectList chart={chart} aspects={aspects} />
      </div>
    </div>
  );
}
