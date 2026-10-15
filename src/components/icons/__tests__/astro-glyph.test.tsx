import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AstroGlyph,
  AstroGlyphPaths,
  CELESTIAL_BODIES,
  ZODIAC_SIGNS,
} from "../astro-glyph";

const ALL = [...ZODIAC_SIGNS, ...CELESTIAL_BODIES];

describe("AstroGlyph", () => {
  it("十二星座と十三の天体を定義順に持つこと", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    expect(ZODIAC_SIGNS[0]).toBe("aries");
    expect(ZODIAC_SIGNS[11]).toBe("pisces");
    expect(CELESTIAL_BODIES).toHaveLength(13);
    expect(CELESTIAL_BODIES[0]).toBe("sun");
    expect(CELESTIAL_BODIES[12]).toBe("lilith");
  });

  it("すべての記号が線画の SVG として描画できること", () => {
    for (const name of ALL) {
      const { container, unmount } = render(<AstroGlyph name={name} />);
      const svg = container.querySelector("svg");
      expect(svg, name).not.toBeNull();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(svg).toHaveAttribute("stroke-linecap", "round");
      expect(svg).toHaveAttribute("stroke-linejoin", "round");
      expect(svg?.querySelectorAll("path, circle").length, name).toBeGreaterThan(0);
      unmount();
    }
  });

  it("既定では aria-hidden で、size と strokeWidth を反映すること", () => {
    const { container } = render(<AstroGlyph name="leo" size={16} strokeWidth={1.4} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
    expect(svg).toHaveAttribute("stroke-width", "1.4");
    expect(container.querySelector("title")).toBeNull();
  });

  it("title を渡すと role=img と title 要素を持つこと", () => {
    const { container, getByRole } = render(<AstroGlyph name="sun" title="太陽" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).not.toHaveAttribute("aria-hidden");
    expect(container.querySelector("title")?.textContent).toBe("太陽");
    expect(getByRole("img", { name: "太陽" })).toBe(svg);
  });

  it("AstroGlyphPaths は外側の svg を持たずに別の svg へ埋め込めること", () => {
    const { container } = render(
      <svg>
        <g>
          <AstroGlyphPaths name="moon" />
        </g>
      </svg>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.querySelector("g")?.childElementCount).toBeGreaterThan(0);
  });

  it("ソースに絵文字や記号文字(U+2600-27BF, U+1F000-1FAFF)を含まないこと", () => {
    const src = readFileSync(resolve(__dirname, "../astro-glyph.tsx"), "utf8");
    expect(src).not.toMatch(/[\u2600-\u27BF]|[\u{1F000}-\u{1FAFF}]/u);
  });
});
