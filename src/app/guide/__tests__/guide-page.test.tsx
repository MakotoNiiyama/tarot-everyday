import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import GuidePage from "../page";

describe("早見表ページ", () => {
  it("見出しと、URL で指定した占術のタブを表示すること", () => {
    window.history.replaceState(null, "", "/guide?tab=numerology");
    render(<GuidePage />);
    expect(screen.getByRole("heading", { level: 1, name: "早見表" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "数秘術" })).toHaveAttribute("aria-selected", "true");
  });

  it("事前描画の HTML にはタロットのカード画像を含めないこと", () => {
    window.history.replaceState(null, "", "/guide");
    const html = renderToString(<GuidePage />);
    expect(html).toContain("早見表");
    expect(html).toContain('role="tablist"');
    expect(html).not.toContain("<img");
  });
});
