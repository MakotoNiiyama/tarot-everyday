import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideBrowserView } from "../guide-browser";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => replace.mockClear());

describe("GuideBrowserView", () => {
  it("占術のタブを tablist として表示し、指定のタブを選択状態にすること", () => {
    render(<GuideBrowserView tab="kyusei" />);
    const tabs = screen.getByRole("tablist", { name: "占術" });
    expect(within(tabs).getAllByRole("tab").map((t) => t.textContent)).toEqual(["タロット", "数秘術", "九星気学", "マヤ暦"]);
    expect(screen.getByRole("tab", { name: "九星気学" })).toHaveAttribute("aria-selected", "true");
  });

  it("グループごとに見出しと件数、タイルを表示すること", () => {
    render(<GuideBrowserView tab="kyusei" />);
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { name: "九星" })).toBeInTheDocument();
    expect(within(panel).getAllByText("9項目", { selector: "span" }).length).toBeGreaterThan(0);
    expect(within(panel).getByRole("link", { name: "一白水星の詳細を見る" })).toBeInTheDocument();
  });

  it("タブを押すと URL の tab を置き換えること", async () => {
    const user = userEvent.setup();
    render(<GuideBrowserView tab="tarot" />);
    await user.click(screen.getByRole("tab", { name: "マヤ暦" }));
    expect(replace).toHaveBeenCalledWith("/guide?tab=maya", { scroll: false });
  });

  it("検索すると全占術を横断した結果を表示し、タブの中身を隠すこと", async () => {
    const user = userEvent.setup();
    render(<GuideBrowserView tab="tarot" />);
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "一白");
    expect(screen.getByText(/件見つかりました/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "一白水星の詳細を見る" })).toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("該当がなければその旨を表示すること", async () => {
    const user = userEvent.setup();
    render(<GuideBrowserView tab="tarot" />);
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "存在しない言葉");
    expect(screen.getByText("該当する項目が見つかりません")).toBeInTheDocument();
  });
});
