import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NatalChartView } from "../natal-chart";
import { NatalSection } from "../natal-section";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" };
const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
const shichu = readings.find((r) => r.id === "shichu")!;
const sanmei = readings.find((r) => r.id === "sanmei")!;

describe("NatalChartView", () => {
  it("命式表を行と列の見出しつきの表で表示すること", () => {
    render(<NatalChartView chart={shichu.chart!} label="四柱推命の命式" />);
    const table = screen.getByRole("table", { name: "四柱推命の命式" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["年柱", "月柱", "日柱", "時柱"]);
    expect(within(table).getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["干支", "通変星", "蔵干", "十二運"]);
    expect(within(table).getByText("時刻不明")).toBeInTheDocument();
    expect(within(table).getByText("日主")).toBeInTheDocument();
  });

  it("人体星図を位置のラベルつきで表示し、中心星を強調すること", () => {
    render(<NatalChartView chart={sanmei.chart!} label="算命学の人体星図" />);
    const list = screen.getByRole("list", { name: "算命学の人体星図" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(8);
    const center = within(list).getByRole("button", { name: /中心星\s*鳳閣星/ });
    expect(within(center).getByText("鳳閣星")).toHaveAttribute("data-tone", "center");
  });
});

describe("NatalSection と図", () => {
  it("図のある占術は、図で表した事実を一覧に重ねて出さないこと", async () => {
    const user = userEvent.setup();
    render(<NatalSection readings={[shichu]} />);
    await user.click(screen.getByRole("button", { name: "四柱推命" }));
    const table = await screen.findByRole("table", { name: "四柱推命の命式" });
    expect(table).toBeInTheDocument();
    // 一覧(dl)には日干・五行バランス・大運だけ
    const terms = screen.getAllByRole("term").map((t) => t.textContent);
    expect(terms).toEqual(["日干", "五行バランス", "大運"]);
  });
});
