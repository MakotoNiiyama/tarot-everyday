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
const heading2 = { title: "月", subtitle: "大アルカナ", description: "The Moon" };

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

    const trigger = screen.getByRole("button", { name: "開く" });
    await user.click(trigger);

    const panel = screen.getByRole("complementary", { name: "詳細パネル" });
    expect(panel).toHaveTextContent("星");
    expect(panel).toHaveTextContent("本文テキスト");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // パネルが開いている間、トリガーの aria-expanded は "true" にならないこと
    // (Drawer は open={false} のまま維持されるため)
    expect(trigger).not.toHaveAttribute("aria-expanded", "true");

    // フォーカスがパネルの内側に移動すること
    expect(panel.contains(document.activeElement) || document.activeElement === panel).toBe(true);

    await user.click(screen.getByRole("button", { name: "詳細を閉じる" }));
    expect(screen.queryByRole("complementary", { name: "詳細パネル" })).not.toBeInTheDocument();

    // 閉じた後、フォーカスがトリガーに戻ること
    expect(document.activeElement).toBe(trigger);
  });

  it("2つ目の DetailSheet を開くとパネルの内容が置き換わること", async () => {
    mockWide(true);
    const user = userEvent.setup();
    render(
      <DetailPanelLayout>
        <DetailSheet heading={heading} body={<p>星の本文</p>}>
          <span>星を開く</span>
        </DetailSheet>
        <DetailSheet heading={heading2} body={<p>月の本文</p>}>
          <span>月を開く</span>
        </DetailSheet>
      </DetailPanelLayout>,
    );

    await user.click(screen.getByRole("button", { name: "星を開く" }));
    expect(screen.getByRole("complementary", { name: "詳細パネル" })).toHaveTextContent("星");

    await user.click(screen.getByRole("button", { name: "月を開く" }));
    const panel = screen.getByRole("complementary", { name: "詳細パネル" });
    expect(panel).toHaveTextContent("月");
    expect(panel).not.toHaveTextContent("星の本文");
    expect(panel).toHaveTextContent("月の本文");
  });
});
