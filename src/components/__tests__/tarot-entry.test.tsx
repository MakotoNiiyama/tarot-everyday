import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TarotEntry } from "../tarot-entry";

describe("TarotEntry", () => {
  it("見出しと案内文を表示すること", () => {
    render(<TarotEntry />);
    expect(screen.getByRole("heading", { level: 1, name: "タロット" })).toBeInTheDocument();
    expect(screen.getByText("今日はどちらにしますか")).toBeInTheDocument();
  });

  it("占いとクイズの2択へのリンクを表示すること", () => {
    render(<TarotEntry />);
    expect(screen.getByRole("link", { name: /タロット占いをする/ })).toHaveAttribute("href", "/tarot/reading");
    expect(screen.getByRole("link", { name: /クイズで練習する/ })).toHaveAttribute("href", "/tarot/quiz");
  });
});
