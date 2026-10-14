// 早見表ページのユニットテスト
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GuidePage from "../page";

describe("早見表ページ", () => {
  it("見出しと占術タブ(タロット)を表示すること", () => {
    render(<GuidePage />);
    expect(screen.getByRole("heading", { level: 1, name: "早見表" })).toBeInTheDocument();
    const tabs = screen.getByRole("navigation", { name: "占術" });
    expect(tabs).toHaveTextContent("タロット");
    expect(screen.getByText("タロット", { selector: "[aria-current='page']" })).toBeInTheDocument();
  });

  it("タロットのカード一覧を表示すること", () => {
    render(<GuidePage />);
    expect(screen.getByText("全78枚のタロットカード")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /の詳細を見る/ })).toHaveLength(78);
  });
});
