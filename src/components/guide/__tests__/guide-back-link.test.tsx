import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GuideBackLink } from "../guide-back-link";
import { DetailGuideLink } from "@/components/detail/detail-heading";
import { canGoBackToGuide, markGuideNavigation, resetGuideNavigationMark } from "@/lib/guide-back";
import type { MouseEvent } from "react";

const click = (init: Partial<MouseEvent> = {}) => ({ button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...init }) as MouseEvent;

beforeEach(() => {
  resetGuideNavigationMark();
  window.history.replaceState(null, "", "/guide/maya/seal-14");
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("GuideBackLink", () => {
  it("早見表の中から来たときは、履歴に記録し、押すとブラウザの戻ると同じにすること", () => {
    markGuideNavigation(click());
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<GuideBackLink href="/guide?tab=maya" />);
    expect(canGoBackToGuide()).toBe(true);
    const link = screen.getByRole("link", { name: "早見表に戻る" });
    expect(link).toHaveAttribute("href", "/guide?tab=maya");
    const notPrevented = fireEvent.click(link);
    expect(notPrevented).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("直接開いたときは一覧へのリンクとして動くこと", () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    render(<GuideBackLink href="/guide?tab=maya" />);
    expect(canGoBackToGuide()).toBe(false);
    // jsdom はリンク先へ移らないので、既定の動作を止めていないことだけを確かめる
    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "早見表に戻る" }));
    expect(notPrevented).toBe(true);
    expect(back).not.toHaveBeenCalled();
  });

  it("一度記録した履歴エントリーは、あとから印が立っても判定を変えないこと", () => {
    const { unmount } = render(<GuideBackLink href="/guide?tab=maya" />);
    unmount();
    markGuideNavigation(click());
    render(<GuideBackLink href="/guide?tab=maya" />);
    expect(canGoBackToGuide()).toBe(false);
  });

  it("新しいタブで開くクリック(修飾キーつき)では印を立てないこと", () => {
    markGuideNavigation(click({ metaKey: true }));
    markGuideNavigation(click({ button: 1 }));
    render(<GuideBackLink href="/guide?tab=maya" />);
    expect(canGoBackToGuide()).toBe(false);
  });
});

describe("DetailGuideLink", () => {
  it("既定は「早見表で見る」、早見表の一覧から開いたときは「詳しく見る」にすること", () => {
    const { rerender } = render(<DetailGuideLink href="/guide/maya/seal-14" />);
    expect(screen.getByRole("link", { name: "早見表で見る" })).toHaveAttribute("href", "/guide/maya/seal-14");
    rerender(<DetailGuideLink href="/guide/maya/seal-14" inGuide />);
    expect(screen.getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/guide/maya/seal-14");
  });
});
