import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ScratchDivider,
  ScratchFrame,
  ScratchMoon,
  ScratchHeader,
} from "@/components/svg/scratch-decorations";

describe("ScratchDivider", () => {
  it("SVG要素がレンダリングされること", () => {
    const { container } = render(<ScratchDivider />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("aria-hiddenが設定されていること", () => {
    const { container } = render(<ScratchDivider />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});

describe("ScratchFrame", () => {
  it("子要素を正しくレンダリングすること", () => {
    render(
      <ScratchFrame>
        <span>テスト</span>
      </ScratchFrame>
    );
    expect(screen.getByText("テスト")).toBeInTheDocument();
  });

  it("SVGボーダーフレームが存在すること", () => {
    const { container } = render(
      <ScratchFrame>
        <span>テスト</span>
      </ScratchFrame>
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("ScratchMoon", () => {
  it("SVG要素がレンダリングされること", () => {
    const { container } = render(<ScratchMoon />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("ScratchHeader", () => {
  it("SVG要素がレンダリングされること", () => {
    const { container } = render(<ScratchHeader />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("太陽（circle）要素が含まれること", () => {
    const { container } = render(<ScratchHeader />);
    expect(container.querySelector("circle")).toBeInTheDocument();
  });
});
