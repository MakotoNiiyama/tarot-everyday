import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PeriodTabs } from "../period-tabs";
import { SystemPeriodCard } from "../system-period-card";
import { FactChip } from "../fact-chip";
import { readAll } from "@/lib/fortune/registry";
import { composeHeadline } from "@/data/guide";

const readings = readAll(
  { version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 } },
  { year: 2026, month: 10, day: 14 },
);

describe("PeriodTabs", () => {
  it("今日・今月・今年のタブで、選択状態と切り替えを扱うこと", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PeriodTabs value="day" onChange={onChange} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["今日", "今月", "今年"]);
    expect(screen.getByRole("tab", { name: "今日" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "今年" }));
    expect(onChange).toHaveBeenCalledWith("year");
  });

  it("矢印キーで隣のタブに移ること", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PeriodTabs value="day" onChange={onChange} />);
    screen.getByRole("tab", { name: "今日" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("month");
  });
});

describe("FactChip", () => {
  it("ラベルと値を表示し、タップで詳細シートを開くこと", async () => {
    const user = userEvent.setup();
    const fact = readings[0].natal[0];
    render(<FactChip fact={fact} />);
    await user.click(screen.getByRole("button", { name: /ライフパス/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("SystemPeriodCard", () => {
  it("占術名・期間・一文のまとめ・チップを表示すること", () => {
    const kyusei = readings.find((r) => r.id === "kyusei")!;
    render(<SystemPeriodCard reading={kyusei} period="year" />);
    const card = screen.getByRole("article", { name: "九星気学" });
    expect(card).toHaveTextContent("Nine Star Ki");
    expect(card).toHaveTextContent(kyusei.periods.year.rangeLabel);
    expect(card).toHaveTextContent(composeHeadline(kyusei.periods.year.headline));
    for (const chip of kyusei.periods.year.chips) expect(card).toHaveTextContent(chip.label);
  });

  it("注記があれば表示すること", () => {
    const amb = readAll({ version: 1, date: { year: 1990, month: 2, day: 4 }, time: { kind: "unknown" } }, { year: 2026, month: 10, day: 14 });
    const kyusei = amb.find((r) => r.id === "kyusei")!;
    render(<SystemPeriodCard reading={kyusei} period="day" />);
    expect(screen.getByText(kyusei.periods.day.note!)).toBeInTheDocument();
  });
});
