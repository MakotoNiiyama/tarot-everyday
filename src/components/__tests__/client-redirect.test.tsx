import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientRedirect } from "../client-redirect";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("ClientRedirect", () => {
  it("新しいURLへ router.replace で移動すること", () => {
    render(<ClientRedirect to="/guide" />);
    expect(replace).toHaveBeenCalledWith("/guide");
  });

  it("移動できなかった場合のためにリンクを表示すること", () => {
    render(<ClientRedirect to="/tarot/quiz" />);
    expect(screen.getByRole("link", { name: "新しいページを開く" })).toHaveAttribute("href", "/tarot/quiz");
  });
});
