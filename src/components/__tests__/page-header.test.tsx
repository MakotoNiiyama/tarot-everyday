import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  it("アクセント・見出し(h1)・説明を表示すること", () => {
    render(<PageHeader accent="Tarot" title="タロット" description="今日はどちらにしますか" />);
    expect(screen.getByText("Tarot")).toHaveClass("font-accent");
    expect(screen.getByRole("heading", { level: 1, name: "タロット" })).toBeInTheDocument();
    expect(screen.getByText("今日はどちらにしますか")).toBeInTheDocument();
  });

  it("区切り線を表示すること", () => {
    const { container } = render(<PageHeader accent="Guide" title="早見表" />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });
});
