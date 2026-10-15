import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideBrowser, GuideBrowserView } from "../guide-browser";
import { DetailPanelLayout } from "@/components/detail/detail-panel";

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

beforeEach(() => {
  window.history.replaceState(null, "", "/guide");
});

function renderAt(search: string) {
  window.history.replaceState(null, "", `/guide${search}`);
  return render(<GuideBrowser />);
}

describe("GuideBrowser", () => {
  it("占術のタブを tablist として表示し、URL の tab を選択状態にすること", () => {
    renderAt("?tab=kyusei");
    const tabs = screen.getByRole("tablist", { name: "占術" });
    expect(within(tabs).getAllByRole("tab").map((t) => t.textContent)).toEqual(["タロット", "数秘術", "九星気学", "マヤ暦", "四柱推命", "算命学", "宿曜", "西洋占星術"]);
    expect(screen.getByRole("tab", { name: "九星気学" })).toHaveAttribute("aria-selected", "true");
  });

  it("tab がない・不正なときはタロットを選ぶこと", () => {
    renderAt("?tab=unknown");
    expect(screen.getByRole("tab", { name: "タロット" })).toHaveAttribute("aria-selected", "true");
  });

  it("グループごとに見出し(件数つき)とタイルを表示すること", () => {
    renderAt("?tab=kyusei");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { name: "九星 9項目" })).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "一白水星の詳細を見る" })).toBeInTheDocument();
  });

  it("タブを押すと URL の tab を置き換え、一覧が変わること", async () => {
    const user = userEvent.setup();
    renderAt("");
    await user.click(screen.getByRole("tab", { name: "マヤ暦" }));
    expect(window.location.pathname).toBe("/guide");
    expect(window.location.search).toBe("?tab=maya");
    expect(screen.getByRole("tab", { name: "マヤ暦" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "白い魔法使いの詳細を見る" })).toBeInTheDocument();
  });

  it("選択中のタブだけがタブ順に入り、矢印・Home・End でフォーカスと選択が移ること", async () => {
    const user = userEvent.setup();
    renderAt("?tab=numerology");
    const tab = (name: string) => screen.getByRole("tab", { name });
    expect(tab("数秘術")).toHaveAttribute("tabindex", "0");
    expect(tab("タロット")).toHaveAttribute("tabindex", "-1");

    tab("数秘術").focus();
    await user.keyboard("{ArrowRight}");
    expect(tab("九星気学")).toHaveFocus();
    expect(tab("九星気学")).toHaveAttribute("aria-selected", "true");
    expect(tab("九星気学")).toHaveAttribute("tabindex", "0");
    expect(window.location.search).toBe("?tab=kyusei");

    await user.keyboard("{End}");
    expect(tab("西洋占星術")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("タロット")).toHaveFocus();
    expect(tab("タロット")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}");
    expect(tab("西洋占星術")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tab("タロット")).toHaveFocus();
    expect(window.location.search).toBe("?tab=tarot");
  });

  it("検索すると占術ごとに見出しを付けて結果を表示し、タブの中身を隠すこと", async () => {
    const user = userEvent.setup();
    renderAt("");
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "一白");
    expect(screen.getByRole("status")).toHaveTextContent(/件見つかりました/);
    const results = screen.getByRole("region", { name: "検索結果" });
    const kyusei = within(results).getByRole("region", { name: /九星気学/ });
    expect(within(kyusei).getByRole("button", { name: "一白水星の詳細を見る" })).toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("複数の占術にまたがる結果は占術の順に分けること", async () => {
    const user = userEvent.setup();
    renderAt("");
    // 「白」は九星(一白など)とマヤ暦(白い風など)の両方に一致する
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "白");
    const results = screen.getByRole("region", { name: "検索結果" });
    const headings = within(results).getAllByRole("heading").map((h) => h.textContent);
    expect(headings.findIndex((h) => h?.startsWith("九星気学"))).toBeLessThan(headings.findIndex((h) => h?.startsWith("マヤ暦")));
  });

  it("タイルを押すとページを移らずに詳細シートで開き、「詳しく見る」で詳細ページへ移れること", async () => {
    const user = userEvent.setup();
    renderAt("?tab=maya");
    await user.click(screen.getByRole("button", { name: "白い魔法使いの詳細を見る" }));
    const dialog = await screen.findByRole("dialog", { name: "白い魔法使い" });
    expect(dialog).toHaveTextContent("しろいまほうつかい");
    expect(window.location.pathname).toBe("/guide");
    expect(within(dialog).getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/guide/maya/seal-14");
    expect(within(dialog).queryByRole("link", { name: "早見表で見る" })).not.toBeInTheDocument();
  });

  it("タロットのタイルはカードの詳細(正位置・逆位置)をシートで開くこと", async () => {
    const user = userEvent.setup();
    renderAt("?tab=tarot");
    await user.click(screen.getByRole("button", { name: "愚者の詳細を見る" }));
    const dialog = await screen.findByRole("dialog", { name: "愚者" });
    expect(within(dialog).getByRole("tab", { name: /正位置/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/guide/tarot/major-00");
  });

  it("検索結果のタイルも詳細シートで開くこと", async () => {
    const user = userEvent.setup();
    renderAt("");
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "一白");
    await user.click(screen.getByRole("button", { name: "一白水星の詳細を見る" }));
    const dialog = await screen.findByRole("dialog", { name: "一白水星" });
    expect(within(dialog).getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/guide/kyusei/star-1");
  });

  it("該当がなければその旨を status で伝えること", async () => {
    const user = userEvent.setup();
    renderAt("");
    await user.type(screen.getByRole("searchbox", { name: "早見表を検索" }), "存在しない言葉");
    expect(screen.getByRole("status")).toHaveTextContent("該当する項目が見つかりません");
  });

  it("スマホの検索ボタンで検索欄を開くと入力欄にフォーカスし、閉じると検索語を消すこと", async () => {
    const user = userEvent.setup();
    renderAt("");
    const toggle = screen.getByRole("button", { name: "検索欄を開く" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    const input = screen.getByRole("searchbox", { name: "早見表を検索" });
    expect(input).toHaveFocus();
    expect(toggle).toHaveAccessibleName("検索欄を閉じる");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.type(input, "一白");
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
    await user.click(toggle);
    expect(input).toHaveValue("");
    expect(toggle).toHaveAccessibleName("検索欄を開く");
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });
});

describe("GuideBrowser(PC幅のサイドパネル)", () => {
  it("1280px 以上ではタイルの詳細を右のサイドパネルに表示すること", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/guide?tab=horoscope");
    render(
      <DetailPanelLayout>
        <GuideBrowser />
      </DetailPanelLayout>,
    );
    const tile = screen.getByRole("button", { name: "牡羊座の詳細を見る" });
    await user.click(tile);
    const panel = screen.getByRole("complementary", { name: "詳細パネル" });
    expect(within(panel).getByRole("heading", { level: 2, name: "牡羊座" })).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/guide/horoscope/sign-aries");
    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // 詳細ページへ移る前にパネルを閉じる(戻ったときに一覧を元の幅・位置で復元するため)
    fireEvent.click(within(panel).getByRole("link", { name: "詳しく見る" }));
    expect(screen.queryByRole("complementary", { name: "詳細パネル" })).not.toBeInTheDocument();
  });
});

describe("GuideBrowserView(URL がまだわからないとき)", () => {
  it("どのタブも選択せず、タイルの代わりに軽い仮の表示を出すこと", () => {
    render(<GuideBrowserView tab={null} onSelectTab={() => {}} />);
    for (const t of screen.getAllByRole("tab")) expect(t).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "タロット" })).toHaveAttribute("tabindex", "0");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-busy", "true");
  });
});
