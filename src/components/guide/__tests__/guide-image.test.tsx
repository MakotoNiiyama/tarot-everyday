import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { glyphFontSize, GuideImageView } from "../guide-image";

describe("glyphFontSize", () => {
  it("タイルは一番長い行の文字数で段階的に決め、15px より小さくしないこと", () => {
    expect(["1", "一白", "黄色い", "空歩く人", "白い世界の橋渡し", "あいうえおかきくけこ"].map((t) => glyphFontSize(t, "tile").base)).toEqual([
      34, 24, 20, 17, 15, 15,
    ]);
  });

  it("改行で区切った行のうち一番長い行で決めること", () => {
    expect(glyphFontSize("赤い\n空歩く人", "tile").base).toBe(17);
    expect(glyphFontSize("白い\n世界の\n橋渡し", "tile").base).toBe(20);
  });

  it("シート・詳細はタイルの段階を拡大し、枠に収まる大きさまでにすること", () => {
    const sheet = glyphFontSize("一", "sheet");
    expect(sheet.base).toBe(Math.round(34 * 1.9));
    const detail = glyphFontSize("一", "detail");
    expect(detail.base).toBe(34 * 4);
    expect(detail.lg).toBeGreaterThan(detail.base);
    // 長い行ほど小さく、行の幅が枠を超えないこと
    for (const size of ["sheet", "detail"] as const) {
      const sizes = ["一", "一白", "黄色い", "空歩く人", "あいうえお"].map((t) => glyphFontSize(t, size).base);
      expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
    }
    expect(glyphFontSize("空歩く人", "sheet").base * 4).toBeLessThanOrEqual(112);
    expect(glyphFontSize("空歩く人", "detail").base * 4).toBeLessThanOrEqual(184);
  });
});

describe("GuideImageView(文字)", () => {
  it("改行を保って描き、読み上げからは隠すこと", () => {
    const { container } = render(<GuideImageView image={{ kind: "glyph", text: "白い\n魔法使い" }} size="tile" />);
    const glyph = container.querySelector("span")!;
    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(glyph.className).toContain("whitespace-pre-line");
    expect(glyph.textContent).toBe("白い\n魔法使い");
    expect(screen.queryByText("白い魔法使い")).toBeNull();
  });
});
