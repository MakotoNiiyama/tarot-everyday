import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SideNav } from "@/components/side-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/guide/tarot/major-00"),
}));

describe("SideNav", () => {
  it("ロゴと4つのナビリンクを表示すること", () => {
    render(<SideNav />);
    expect(screen.getByText("tarot-everyday")).toBeInTheDocument();
    expect(screen.getByText("毎日の占いノート")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
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
});
