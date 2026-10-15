import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HomeFortuneChips } from "../home-fortune-chips";

describe("HomeFortuneChips", () => {
  it("今日の要点に宿曜の関係を含めること", () => {
    render(
      <HomeFortuneChips
        profile={{ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }}
        today={{ year: 2026, month: 10, day: 14 }}
      />,
    );
    const list = screen.getByRole("list", { name: "今日の運勢の要点" });
    expect(within(list).getByText("本命宿との関係")).toBeInTheDocument();
    expect(within(list).getByText("壊")).toBeInTheDocument();
  });

  it("黒KINの日だけ黒KINのチップを出すこと", () => {
    const profile = { version: 1 as const, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" as const } };
    const { unmount } = render(<HomeFortuneChips profile={profile} today={{ year: 2026, month: 10, day: 15 }} />);
    expect(within(screen.getByRole("list", { name: "今日の運勢の要点" })).getByText("黒KINの日")).toBeInTheDocument();
    unmount();
    render(<HomeFortuneChips profile={profile} today={{ year: 2026, month: 10, day: 14 }} />);
    expect(within(screen.getByRole("list", { name: "今日の運勢の要点" })).queryByText("黒KINの日")).toBeNull();
  });
});
