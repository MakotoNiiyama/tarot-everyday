import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SideNav } from "@/components/side-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/guide/tarot/major-00"),
}));

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
};

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
});

describe("SideNav", () => {
  it("ロゴと4つのナビリンクを表示すること", () => {
    render(<SideNav />);
    expect(screen.getByText("tarot-everyday")).toBeInTheDocument();
    expect(screen.getByText("毎日の占いノート")).toBeInTheDocument();
    expect(within(screen.getByRole("navigation")).getAllByRole("link")).toHaveLength(4);
  });

  it("現在地の項目に aria-current='page' が付くこと", () => {
    render(<SideNav />);
    expect(screen.getByRole("link", { name: "早見表" })).toHaveAttribute("aria-current", "page");
  });

  it("lg 未満では非表示であること", () => {
    render(<SideNav />);
    // サイドナビの外枠は補足情報(complementary)ではないので aside を使わない
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    const container = screen.getByRole("navigation").parentElement;
    expect(container).toHaveClass("hidden", "lg:flex");
  });

  it("未登録なら登録へのリンク、登録済みなら要約と編集リンクを表示すること", () => {
    const { unmount } = render(<SideNav />);
    expect(screen.getByRole("link", { name: "生年月日を登録" })).toHaveAttribute("href", "/fortune/profile");
    unmount();
    store["tarot-birth-profile"] = JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" });
    render(<SideNav />);
    expect(screen.getByText("1990/3/29 生")).toBeInTheDocument();
    expect(screen.getByText("14時台 · 東京都")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "編集" })).toHaveAttribute("href", "/fortune/profile");
  });
});
