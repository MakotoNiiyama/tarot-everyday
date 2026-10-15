import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NatalChartView } from "../natal-chart";
import { NatalSection } from "../natal-section";
import { readAll } from "@/lib/fortune/registry";
import type { BirthProfile } from "@/lib/fortune/types";

// time:unknown プロファイル(日主・五行などの計算に使う基本ケース)
const profile: BirthProfile = { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" };
const readings = readAll(profile, { year: 2026, month: 10, day: 14 });
const shichu = readings.find((r) => r.id === "shichu")!;
const sanmei = readings.find((r) => r.id === "sanmei")!;

// 時刻あり(東京 14:41)プロファイル。14:41 は時柱の境目(地方平均時 15:00)を含む1分なので時柱が候補になる。
// 鳳閣星・癸巳・己未・庚申 などの値は 1990/3/29 の実計算値に固定されているため安定。
const profileWithTime: BirthProfile = {
  version: 1,
  date: { year: 1990, month: 3, day: 29 },
  time: { kind: "minute", hour: 14, minute: 41 },
  prefecture: "13",
  gender: "male",
};
const readingsWithTime = readAll(profileWithTime, { year: 2026, month: 10, day: 14 });
const shichuWithTime = readingsWithTime.find((r) => r.id === "shichu")!;

describe("NatalChartView", () => {
  it("命式表を行と列の見出しつきの表で表示すること", () => {
    render(<NatalChartView chart={shichu.chart!} systemName="四柱推命" />);
    const table = screen.getByRole("table", { name: "四柱推命の命式" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["年柱", "月柱", "日柱", "時柱"]);
    expect(within(table).getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["干支", "通変星", "蔵干", "十二運"]);
    expect(within(table).getByText("時刻不明")).toBeInTheDocument();
    expect(within(table).getByText("日主")).toBeInTheDocument();
  });

  it("日主 はボタン、時刻不明 はボタンでないこと", () => {
    render(<NatalChartView chart={shichu.chart!} systemName="四柱推命" />);
    expect(screen.getByRole("button", { name: "日主" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "時刻不明" })).toBeNull();
  });

  it("時刻不明のとき時柱の通変星・蔵干・十二運 行にボタンがないこと", () => {
    render(<NatalChartView chart={shichu.chart!} systemName="四柱推命" />);
    const table = screen.getByRole("table");
    for (const rowLabel of ["通変星", "蔵干", "十二運"]) {
      const rowHeader = within(table).getByRole("rowheader", { name: rowLabel });
      const row = rowHeader.closest("tr")!;
      const tds = row.querySelectorAll("td");
      // 時柱は最後の列
      const hourTd = tds[tds.length - 1] as HTMLElement;
      expect(within(hourTd).queryByRole("button")).toBeNull();
    }
  });

  it("人体星図を位置のラベルつきで表示し、中心星を強調すること", () => {
    render(<NatalChartView chart={sanmei.chart!} systemName="算命学" />);
    const list = screen.getByRole("list", { name: "算命学の人体星図" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(8);
    // 鳳閣星は 1990/3/29 の実計算値に固定
    const center = within(list).getByRole("button", { name: /中心星、鳳閣星/ });
    expect(within(center).getByText("鳳閣星")).toHaveAttribute("data-tone", "center");
  });

  it("人体星図のセルのアクセシブル名に区切り文字が含まれること", () => {
    render(<NatalChartView chart={sanmei.chart!} systemName="算命学" />);
    // sr-only 区切り「、」が入り「中心星、鳳閣星」となる
    expect(screen.getByRole("button", { name: /中心星、鳳閣星/ })).toBeInTheDocument();
  });
});

describe("時柱あり(1990/3/29 14:41 東京)", () => {
  it("時柱の干支が候補を赤橙で表示すること", () => {
    render(<NatalChartView chart={shichuWithTime.chart!} systemName="四柱推命" />);
    const table = screen.getByRole("table", { name: "四柱推命の命式" });
    // 己未 / 庚申 は 1990/3/29 東京 14:41 の実計算値に固定
    const cell = within(table).getByText("己未 / 庚申");
    expect(cell).toHaveClass("text-terracotta");
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

  it("算命学の dl には人体星図の事実を含まず指定のラベルが並ぶこと", async () => {
    const user = userEvent.setup();
    render(<NatalSection readings={[sanmei]} />);
    await user.click(screen.getByRole("button", { name: "算命学" }));
    const terms = (await screen.findAllByRole("term")).map((t) => t.textContent);
    expect(terms).toEqual(["天中殺", "陰占", "大運", "宿命中殺", "異常干支", "位相法"]);
  });
});
