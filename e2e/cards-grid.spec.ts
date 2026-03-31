import { test, expect } from "@playwright/test";

test.describe("早見表ページ — カード一覧", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cards");
  });

  test("ページタイトルと説明が表示されること", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "早見表" })
    ).toBeVisible();
    await expect(page.getByText("全78枚のタロットカード")).toBeVisible();
  });

  test("初期表示で78枚のカードリンクが存在すること", async ({ page }) => {
    const links = page.getByRole("link", { name: /の詳細を見る/ });
    await expect(links).toHaveCount(78);
  });

  test("件数表示に78枚と表示されること", async ({ page }) => {
    await expect(page.getByText("78枚のカード")).toBeVisible();
  });

  test("検索フィールドが表示されること", async ({ page }) => {
    await expect(page.getByLabel("カード検索")).toBeVisible();
  });

  test("フィルタータブが表示されること", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "全て" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "大アルカナ" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "ワンド" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "カップ" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "ソード" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "ペンタクル" })).toBeVisible();
  });

  test("大アルカナフィルターで22枚に絞り込めること", async ({ page }) => {
    await page.getByRole("tab", { name: "大アルカナ" }).click();
    await expect(page.getByText("22枚のカード")).toBeVisible();
    const links = page.getByRole("link", { name: /の詳細を見る/ });
    await expect(links).toHaveCount(22);
  });

  test("ワンドフィルターで14枚に絞り込めること", async ({ page }) => {
    await page.getByRole("tab", { name: "ワンド" }).click();
    await expect(page.getByText("14枚のカード")).toBeVisible();
  });

  test("カード名で検索できること", async ({ page }) => {
    await page.getByLabel("カード検索").fill("愚者");
    await expect(page.getByText(/1枚のカード/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "愚者の詳細を見る" })
    ).toBeVisible();
  });

  test("英語名で検索できること", async ({ page }) => {
    await page.getByLabel("カード検索").fill("Fool");
    await expect(page.getByText(/1枚のカード/)).toBeVisible();
  });

  test("検索結果0件のメッセージが表示されること", async ({ page }) => {
    await page.getByLabel("カード検索").fill("存在しないカード名");
    await expect(page.getByText(/0枚のカード/)).toBeVisible();
    await expect(page.getByText("該当するカードが見つかりません")).toBeVisible();
  });

  test("表示切替ボタンでリスト表示に切り替えられること", async ({ page }) => {
    await page.getByLabel("リスト表示に切り替え").click();
    await expect(page.getByLabel("グリッド表示に切り替え")).toBeVisible();
    // リスト表示でもカードリンクが78件あること
    const links = page.getByRole("link", { name: /の詳細を見る/ });
    await expect(links).toHaveCount(78);
  });

  test("カードリンクが正しいhrefを持つこと", async ({ page }) => {
    const foolLink = page.getByRole("link", { name: "愚者の詳細を見る" });
    await expect(foolLink).toHaveAttribute("href", "/cards/major-00");
  });

  test("BottomNavの早見表タブがアクティブであること", async ({ page }) => {
    const navLink = page.getByRole("link", { name: "早見表" });
    await expect(navLink).toHaveAttribute("aria-current", "page");
  });
});
