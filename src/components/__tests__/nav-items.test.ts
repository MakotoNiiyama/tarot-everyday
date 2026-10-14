import { describe, it, expect } from "vitest";
import { navItems, isNavActive } from "../nav-items";

describe("navItems", () => {
  it("ホーム・運勢・タロット・早見表の4項目であること", () => {
    expect(navItems.map((i) => [i.href, i.label])).toEqual([
      ["/", "ホーム"],
      ["/fortune", "運勢"],
      ["/tarot", "タロット"],
      ["/guide", "早見表"],
    ]);
  });
});

describe("isNavActive", () => {
  it("ホームは / のときだけアクティブ", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/", "/guide")).toBe(false);
  });

  it("配下のパスでもアクティブ", () => {
    expect(isNavActive("/tarot", "/tarot")).toBe(true);
    expect(isNavActive("/tarot", "/tarot/quiz")).toBe(true);
    expect(isNavActive("/guide", "/guide/tarot/major-00")).toBe(true);
    expect(isNavActive("/fortune", "/fortune/profile")).toBe(true);
  });

  it("前方一致だけの別パスはアクティブにしない", () => {
    expect(isNavActive("/tarot", "/tarotx")).toBe(false);
  });
});
