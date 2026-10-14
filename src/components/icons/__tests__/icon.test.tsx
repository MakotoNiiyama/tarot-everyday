import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon, iconNames } from "../icon";

describe("Icon", () => {
  it("aria-hidden の SVG を描画すること", () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg?.querySelectorAll("path, rect, circle").length).toBeGreaterThan(0);
  });

  it("size と strokeWidth を反映すること", () => {
    const { container } = render(<Icon name="up" size={14} strokeWidth={1.8} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "14");
    expect(svg).toHaveAttribute("height", "14");
    expect(svg).toHaveAttribute("stroke-width", "1.8");
  });

  it("線画の共通属性(塗りなし・丸い端点・currentColor)を持つこと", () => {
    const { container } = render(<Icon name="guide" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("stroke-linecap", "round");
    expect(svg).toHaveAttribute("stroke-linejoin", "round");
  });

  it("定義済みのすべてのアイコンが描画できること", () => {
    for (const name of iconNames) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector("svg")?.childElementCount).toBeGreaterThan(0);
      unmount();
    }
  });
});
