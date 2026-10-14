import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetailSheet } from "../detail-sheet";
import { DetailPanelLayout } from "../detail-panel";

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

function mockWide(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const heading = { title: "星", subtitle: "大アルカナ", description: "The Star" };

describe("DetailSheet", () => {
  it("トリガーを押すとボトムシートに見出しと本文を表示すること", async () => {
    const user = userEvent.setup();
    render(
      <DetailSheet heading={heading} body={<p>本文テキスト</p>}>
        <span>開く</span>
      </DetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "星" })).toBeInTheDocument();
    expect(screen.getByText("The Star")).toBeInTheDocument();
    expect(screen.getByText("本文テキスト")).toBeInTheDocument();
  });

  it("DetailPanelLayout の中でも幅が狭いときはボトムシートを使うこと", async () => {
    mockWide(false);
    const user = userEvent.setup();
    render(
      <DetailPanelLayout>
        <DetailSheet heading={heading} body={<p>本文テキスト</p>}>
          <span>開く</span>
        </DetailSheet>
      </DetailPanelLayout>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "詳細パネル" })).not.toBeInTheDocument();
  });

  it("DetailPanelLayout の中で幅が広いときはサイドパネルに表示し、閉じられること", async () => {
    mockWide(true);
    const user = userEvent.setup();
    render(
      <DetailPanelLayout>
        <DetailSheet heading={heading} body={<p>本文テキスト</p>}>
          <span>開く</span>
        </DetailSheet>
      </DetailPanelLayout>,
    );
    await user.click(screen.getByRole("button", { name: "開く" }));
    const panel = screen.getByRole("complementary", { name: "詳細パネル" });
    expect(panel).toHaveTextContent("星");
    expect(panel).toHaveTextContent("本文テキスト");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "詳細を閉じる" }));
    expect(screen.queryByRole("complementary", { name: "詳細パネル" })).not.toBeInTheDocument();
  });
});
