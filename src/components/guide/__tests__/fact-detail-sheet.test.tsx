import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FactDetailSheet } from "../fact-detail-sheet";
import { DetailPanelLayout } from "@/components/detail/detail-panel";
import type { Fact } from "@/lib/fortune/types";

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

const single: Fact = { key: "honmei", label: "本命星", value: "一白水星", refs: [{ system: "kyusei", id: "star-1" }] };
const lucky: Fact = {
  key: "lucky",
  label: "吉方位",
  value: "北・南東",
  refs: [
    { system: "kyusei", id: "direction-n" },
    { system: "kyusei", id: "direction-se" },
  ],
};
const candidates: Fact = {
  key: "honmei",
  label: "本命星",
  value: "一白水星(〜5:01) / 九紫火星(5:01〜)",
  refs: [
    { system: "kyusei", id: "star-1" },
    { system: "kyusei", id: "star-9" },
  ],
  candidates: [
    { value: "一白水星", rangeLabel: "〜5:01" },
    { value: "九紫火星", rangeLabel: "5:01〜" },
  ],
};

describe("FactDetailSheet", () => {
  it("参照が1つなら、その項目をシートで開くこと", async () => {
    const user = userEvent.setup();
    render(
      <FactDetailSheet fact={single}>
        <span>本命星 一白水星</span>
      </FactDetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "本命星 一白水星" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { level: 2, name: "一白水星" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "早見表で見る" })).toHaveAttribute("href", "/guide/kyusei/star-1");
  });

  it("参照が複数なら、1つのシートに項目ごとの節と早見表へのリンクを並べること", async () => {
    const user = userEvent.setup();
    render(
      <FactDetailSheet fact={lucky}>
        <span>吉方位 北・南東</span>
      </FactDetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "吉方位 北・南東" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { level: 2, name: "吉方位 北・南東" })).toBeInTheDocument();
    const names = within(dialog).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["北", "南東"]);
    // 本文の小見出しは h4 になる
    expect(within(dialog).getAllByRole("heading", { level: 4, name: "運勢として出たとき" })).toHaveLength(2);
    expect(within(dialog).getByRole("link", { name: "北を早見表で見る" })).toHaveAttribute("href", "/guide/kyusei/direction-n");
    expect(within(dialog).getByRole("link", { name: "南東を早見表で見る" })).toHaveAttribute("href", "/guide/kyusei/direction-se");
  });

  it("候補があれば、項目の名前に時刻の範囲を添えること", async () => {
    const user = userEvent.setup();
    render(
      <FactDetailSheet fact={candidates}>
        <span>本命星</span>
      </FactDetailSheet>,
    );
    await user.click(screen.getByRole("button", { name: "本命星" }));
    const dialog = await screen.findByRole("dialog");
    const names = within(dialog).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["一白水星〜5:01", "九紫火星5:01〜"]);
  });

  it("参照がなければトリガーの中身だけを表示すること", () => {
    render(
      <FactDetailSheet fact={{ key: "lucky", label: "吉方位", value: "なし", refs: [] }}>
        <span>なし</span>
      </FactDetailSheet>,
    );
    expect(screen.getByText("なし")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  describe("DetailPanelLayout の中(1280px 以上)", () => {
    it("参照が1つならサイドパネルにその項目を表示すること", async () => {
      mockWide(true);
      const user = userEvent.setup();
      render(
        <DetailPanelLayout>
          <FactDetailSheet fact={single}>
            <span>本命星 一白水星</span>
          </FactDetailSheet>
        </DetailPanelLayout>,
      );
      await user.click(screen.getByRole("button", { name: "本命星 一白水星" }));
      const panel = screen.getByRole("complementary", { name: "詳細パネル" });
      expect(within(panel).getByRole("heading", { level: 2, name: "一白水星" })).toBeInTheDocument();
      expect(within(panel).getByRole("link", { name: "早見表で見る" })).toHaveAttribute("href", "/guide/kyusei/star-1");
    });

    it("参照が複数ならサイドパネルに項目ごとの節を並べること", async () => {
      mockWide(true);
      const user = userEvent.setup();
      render(
        <DetailPanelLayout>
          <FactDetailSheet fact={lucky}>
            <span>吉方位 北・南東</span>
          </FactDetailSheet>
        </DetailPanelLayout>,
      );
      await user.click(screen.getByRole("button", { name: "吉方位 北・南東" }));
      const panel = screen.getByRole("complementary", { name: "詳細パネル" });
      expect(within(panel).getByRole("heading", { level: 2, name: "吉方位 北・南東" })).toBeInTheDocument();
      expect(within(panel).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["北", "南東"]);
      expect(within(panel).getByRole("link", { name: "南東を早見表で見る" })).toBeInTheDocument();
    });
  });
});
