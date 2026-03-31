import { describe, it, expect } from "vitest";
import { theme } from "@/lib/theme";

describe("テーマ定数", () => {
  it("メインカラーが #CC8F1F であること", () => {
    expect(theme.colors.gold).toBe("#CC8F1F");
  });

  it("背景色が #130C06 であること", () => {
    expect(theme.colors.background).toBe("#130C06");
  });

  it("サーフェスカラーが #2A1D0A であること", () => {
    expect(theme.colors.surface).toBe("#2A1D0A");
  });

  it("必要なカラーキーがすべて定義されていること", () => {
    const requiredKeys = [
      "gold",
      "goldLight",
      "goldDim",
      "goldDark",
      "background",
      "surface",
      "cream",
      "terracotta",
    ];
    for (const key of requiredKeys) {
      expect(theme.colors).toHaveProperty(key);
      expect(
        (theme.colors as Record<string, string>)[key]
      ).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
