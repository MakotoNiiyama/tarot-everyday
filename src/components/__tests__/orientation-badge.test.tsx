import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrientationBadge } from "../orientation-badge";

describe("OrientationBadge", () => {
  it("正位置のときは「正位置」と上向き矢印を表示すること", () => {
    const { container } = render(<OrientationBadge isReversed={false} />);
    expect(screen.getByText("正位置")).toBeInTheDocument();
    expect(container.querySelector("svg path")).toHaveAttribute("d", "M12 19V5M6 11l6-6 6 6");
    expect(container.firstElementChild).toHaveClass("text-gold-light");
  });

  it("逆位置のときは「逆位置」と下向き矢印をテラコッタ色で表示すること", () => {
    const { container } = render(<OrientationBadge isReversed />);
    expect(screen.getByText("逆位置")).toBeInTheDocument();
    expect(container.querySelector("svg path")).toHaveAttribute("d", "M12 5v14M6 13l6 6 6-6");
    expect(container.firstElementChild).toHaveClass("text-terracotta");
  });

  it("記号文字を含まないこと", () => {
    const { container } = render(<OrientationBadge isReversed={false} />);
    expect(container.textContent).toBe("正位置");
  });
});
