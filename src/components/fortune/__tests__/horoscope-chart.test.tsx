import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoroscopeChart, layoutBodies } from "../horoscope-chart";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" };
const horoscope = readAll(profile, { year: 2026, month: 10, day: 14 }).find((r) => r.id === "horoscope")!;
if (horoscope.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
const chart = horoscope.chart;

describe("HoroscopeChart", () => {
  it("チャート円を名前つきの画像として描くこと", () => {
    render(<HoroscopeChart chart={chart} />);
    // チャートは出生時刻の中央(14:30)で計算するので ASC は獅子座
    expect(screen.getByRole("img", { name: /ホロスコープ.*ASC 獅子座.*MC 牡牛座/ })).toBeInTheDocument();
  });

  it("天体の表に13天体とハウスを出し、ハウスシステムを切り替えられること", async () => {
    const user = userEvent.setup();
    render(<HoroscopeChart chart={chart} />);
    const table = screen.getByRole("table", { name: "天体の位置" });
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 13);
    const sunRow = within(table).getByRole("row", { name: /太陽/ });
    expect(sunRow).toHaveTextContent("牡羊座");
    expect(within(sunRow).getAllByRole("cell").at(-1)).toHaveTextContent(/^8$/);
    const group = screen.getByRole("radiogroup", { name: "ハウスシステム" });
    expect(within(group).getByRole("radio", { name: "プラシーダス" })).toHaveAttribute("aria-checked", "true");
    await user.click(within(group).getByRole("radio", { name: "ホールサイン" }));
    expect(within(group).getByRole("radio", { name: "ホールサイン" })).toHaveAttribute("aria-checked", "true");
    // ホールサインでは太陽(牡羊座)は獅子座始まりの第9ハウス
    const wholeSunRow = within(table).getByRole("row", { name: /太陽/ });
    expect(within(wholeSunRow).getAllByRole("cell").at(-1)).toHaveTextContent(/^9$/);
  });

  it("逆行は文字で出すこと", () => {
    render(<HoroscopeChart chart={chart} />);
    const table = screen.getByRole("table", { name: "天体の位置" });
    expect(within(table).getByRole("row", { name: /冥王星/ })).toHaveTextContent("逆行");
    expect(within(table).getByRole("row", { name: /太陽/ })).not.toHaveTextContent("逆行");
  });

  it("マイナーアスペクトは切り替えで出すこと", async () => {
    const user = userEvent.setup();
    render(<HoroscopeChart chart={chart} />);
    const list = screen.getByRole("list", { name: "アスペクト" });
    const majorCount = within(list).getAllByRole("listitem").length;
    expect(majorCount).toBe(chart.aspects.filter((a) => !a.minor).length);
    const toggle = screen.getByRole("button", { name: "マイナーアスペクトを表示" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(within(list).getAllByRole("listitem").length).toBe(chart.aspects.length);
  });

  it("注記を出すこと", () => {
    const unknown = readAll({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }, { year: 2026, month: 10, day: 14 }).find(
      (r) => r.id === "horoscope",
    )!;
    if (unknown.chart?.kind !== "horoscope") throw new Error("ホロスコープがない");
    render(<HoroscopeChart chart={unknown.chart} />);
    expect(screen.getByText("出生時刻不明のため正午で仮計算")).toBeInTheDocument();
  });
});

describe("layoutBodies", () => {
  const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);

  it("記号どうしが重ならないこと(密集した天体も)", () => {
    const crowded = [0, 2, 3, 5, 6, 8, 9, 359, 120, 121, 240].map((lon, i) => ({ key: `b${i}`, lon }));
    for (const lons of [chart.bodies.map((b) => ({ key: b.key, lon: b.lon })), crowded]) {
      const placed = layoutBodies(lons, chart.asc);
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) expect(dist(placed[i], placed[j])).toBeGreaterThanOrEqual(15);
      }
    }
  });
});
