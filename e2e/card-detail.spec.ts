import { test, expect } from "@playwright/test";

test.describe("カード詳細ページ", () => {
  test("愚者のカード詳細が表示されること", async ({ page }) => {
    await page.goto("/cards/major-00");
    await expect(
      page.getByRole("heading", { level: 1, name: "愚者" })
    ).toBeVisible();
    await expect(page.getByText("The Fool")).toBeVisible();
    await expect(page.getByText("大アルカナ")).toBeVisible();
  });

  test("小アルカナカードの詳細が表示されること", async ({ page }) => {
    await page.goto("/cards/wands-01");
    await expect(
      page.getByRole("heading", { level: 1, name: "ワンドのエース" })
    ).toBeVisible();
    await expect(page.getByText("ワンド（杖）")).toBeVisible();
  });

  test("パンくずリストから早見表に戻れること", async ({ page }) => {
    await page.goto("/cards/major-00");
    const breadcrumb = page.getByLabel("パンくずリスト");
    await breadcrumb.getByRole("link", { name: "早見表" }).click();
    await expect(page).toHaveURL("/cards");
  });

  test("正位置タブが初期表示されキーワードが見えること", async ({ page }) => {
    await page.goto("/cards/major-00");
    await expect(page.getByText("☀ 正位置")).toBeVisible();
    // キーワードバッジ（exact matchで意味テキストと区別）
    const keywordSection = page.getByLabel("正位置のキーワード");
    await expect(keywordSection.getByText("自由")).toBeVisible();
  });

  test("逆位置タブに切り替えられること", async ({ page }) => {
    await page.goto("/cards/major-00");
    await page.getByText("☽ 逆位置").click();
    const keywordSection = page.getByLabel("逆位置のキーワード");
    await expect(keywordSection.getByText("無謀")).toBeVisible();
  });

  test("運勢アコーディオンが存在すること", async ({ page }) => {
    await page.goto("/cards/major-00");
    await expect(page.getByText(/総合運/)).toBeVisible();
    await expect(page.getByText(/恋愛運/)).toBeVisible();
    await expect(page.getByText(/仕事運/)).toBeVisible();
  });

  test("早見表のカードリンクから詳細に遷移できること", async ({ page }) => {
    await page.goto("/cards");
    await page.getByRole("link", { name: "愚者の詳細を見る" }).click();
    await expect(page).toHaveURL("/cards/major-00");
    await expect(
      page.getByRole("heading", { level: 1, name: "愚者" })
    ).toBeVisible();
  });

  test("存在しないIDでは404ページが表示されること", async ({ page }) => {
    const response = await page.goto("/cards/nonexistent-99");
    expect(response?.status()).toBe(404);
  });
});
