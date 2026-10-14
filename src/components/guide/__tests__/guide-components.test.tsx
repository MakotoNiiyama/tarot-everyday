import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideImageView } from "../guide-image";
import { GuideTile } from "../guide-tile";
import { GuideEntryBody } from "../guide-entry-body";
import { ElementDetailSheet } from "../element-detail-sheet";
import { getGuideEntry } from "@/data/guide";

const star1 = getGuideEntry("kyusei", "star-1")!;
const fool = getGuideEntry("tarot", "major-00")!;

describe("GuideImageView", () => {
  it("漢字のタイポグラフィを指定色で描くこと", () => {
    render(<GuideImageView image={star1.image} size="tile" />);
    const glyph = screen.getByText("一白");
    expect(glyph).toHaveStyle({ color: "#F5E6C8" });
  });

  it("カード画像を alt 付きで描くこと", () => {
    render(<GuideImageView image={fool.image} size="tile" />);
    expect(screen.getByRole("img", { name: "愚者" })).toBeInTheDocument();
  });
});

describe("GuideTile", () => {
  it("詳細ページへのリンクと名前を表示すること", () => {
    render(<GuideTile entry={star1} />);
    const link = screen.getByRole("link", { name: "一白水星の詳細を見る" });
    expect(link).toHaveAttribute("href", "/guide/kyusei/star-1");
    expect(link).toHaveTextContent("一白水星");
  });

  it("タロットは縦長の枠にすること", () => {
    const { container } = render(<GuideTile entry={fool} />);
    expect(container.querySelector("[data-shape='portrait']")).not.toBeNull();
  });
});

describe("GuideEntryBody", () => {
  it("キーワード・説明・運勢の一文を表示すること", () => {
    render(<GuideEntryBody entry={star1} />);
    for (const k of star1.keywords) expect(screen.getByText(k)).toBeInTheDocument();
    expect(screen.getByText(star1.summary)).toBeInTheDocument();
    expect(screen.getByText(star1.periodNote!)).toBeInTheDocument();
  });
});

describe("ElementDetailSheet", () => {
  it("参照先の項目をシートで開き、早見表へのリンクを出すこと", async () => {
    const user = userEvent.setup();
    render(
      <ElementDetailSheet element={{ system: "kyusei", id: "star-1" }}>
        <span>本命星 一白水星</span>
      </ElementDetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "本命星 一白水星" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("一白水星");
    expect(screen.getByRole("link", { name: "早見表で見る" })).toHaveAttribute("href", "/guide/kyusei/star-1");
  });

  it("参照先がなければトリガーの中身だけを表示すること", () => {
    render(
      <ElementDetailSheet element={{ system: "kyusei", id: "nothing" }}>
        <span>不明</span>
      </ElementDetailSheet>,
    );
    expect(screen.getByText("不明")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
