import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("BottomNav", () => {
  it("4つのナビリンクが正しいhrefで表示されること", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "運勢" })).toHaveAttribute("href", "/fortune");
    expect(screen.getByRole("link", { name: "タロット" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "早見表" })).toHaveAttribute("href", "/guide");
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("navigation ロールとaria-labelが設定されていること", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "メインナビゲーション");
  });

  it("4項目を均等に並べ、強調表示の項目を持たないこと", () => {
    const { container } = render(<BottomNav />);
    expect(container.querySelector("ul")).toHaveClass("grid-cols-4");
    expect(container.querySelector(".rounded-full")).toBeNull();
  });

  it("PC幅(lg)では非表示になること", () => {
    render(<BottomNav />);
    expect(screen.getByRole("navigation")).toHaveClass("lg:hidden");
  });

  it("配下のページでも該当項目に aria-current='page' が付くこと", () => {
    vi.mocked(usePathname).mockReturnValue("/tarot/quiz");
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "タロット" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "ホーム" })).not.toHaveAttribute("aria-current");
  });
});
