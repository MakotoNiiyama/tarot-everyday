import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailHeadingView } from "../detail-heading";

describe("DetailHeadingView", () => {
  it("読みは通常の書体、英名はアクセントの書体で別々に表示すること", () => {
    render(<DetailHeadingView heading={{ title: "白い魔法使い", subtitle: "太陽の紋章", reading: "しろいまほうつかい", nameEn: "White Wizard" }} />);
    expect(screen.getByRole("heading", { name: "白い魔法使い" })).toBeInTheDocument();
    const reading = screen.getByText("しろいまほうつかい");
    expect(reading.className).not.toContain("font-accent");
    expect(reading.className).toContain("text-gold-dim");
    expect(screen.getByText("White Wizard").className).toContain("font-accent");
  });

  it("description も従来どおり表示すること", () => {
    render(<DetailHeadingView heading={{ title: "星", description: "補足" }} />);
    expect(screen.getByText("補足")).toBeInTheDocument();
  });
});
