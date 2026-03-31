import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("BottomNav", () => {
  it("5つのナビリンクが表示されること", () => {
    render(<BottomNav />);
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("早見表")).toBeInTheDocument();
    expect(screen.getByText("占い")).toBeInTheDocument();
    expect(screen.getByText("クイズ")).toBeInTheDocument();
    expect(screen.getByText("1day")).toBeInTheDocument();
  });

  it("各リンクに正しいhrefが設定されていること", () => {
    render(<BottomNav />);
    expect(screen.getByText("ホーム").closest("a")).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByText("早見表").closest("a")).toHaveAttribute(
      "href",
      "/cards"
    );
    expect(screen.getByText("占い").closest("a")).toHaveAttribute(
      "href",
      "/reading"
    );
    expect(screen.getByText("クイズ").closest("a")).toHaveAttribute(
      "href",
      "/quiz"
    );
    expect(screen.getByText("1day").closest("a")).toHaveAttribute(
      "href",
      "/daily"
    );
  });

  it("navigation ロールとaria-labelが設定されていること", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "メインナビゲーション");
  });

  it("SVGアイコンが5つ描画されていること", () => {
    const { container } = render(<BottomNav />);
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs).toHaveLength(5);
  });

  it("アクティブなリンクにaria-current='page'が設定されていること", () => {
    render(<BottomNav />);
    const homeLink = screen.getByText("ホーム").closest("a");
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });
});
