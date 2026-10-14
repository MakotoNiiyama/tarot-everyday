import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GuidePage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("tab=numerology"),
}));

describe("早見表ページ", () => {
  it("見出しと、URL で指定した占術のタブを表示すること", () => {
    render(<GuidePage />);
    expect(screen.getByRole("heading", { level: 1, name: "早見表" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "数秘術" })).toHaveAttribute("aria-selected", "true");
  });
});
