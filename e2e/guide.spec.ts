import { test, expect } from "@playwright/test";

test.describe("早見表", () => {
  test("初期表示はタロットのタブで78枚のカードがあること", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByRole("heading", { level: 1, name: "早見表" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "タロット" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("link", { name: /の詳細を見る/ })).toHaveCount(78);
  });

  test("タブを切り替えると URL と一覧が変わること", async ({ page }) => {
    await page.goto("/guide");
    await page.getByRole("tab", { name: "九星気学" }).click();
    await expect(page).toHaveURL("/guide?tab=kyusei");
    await expect(page.getByRole("link", { name: "一白水星の詳細を見る" })).toBeVisible();
  });

  test("URL の tab で初期タブを指定できること", async ({ page }) => {
    await page.goto("/guide?tab=maya");
    await expect(page.getByRole("tab", { name: "マヤ暦" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "白い魔法使いの詳細を見る" })).toBeVisible();
  });

  test("全占術を横断して検索できること", async ({ page, isMobile }) => {
    await page.goto("/guide");
    if (isMobile) await page.getByRole("button", { name: "検索欄を開く" }).click();
    await page.getByRole("searchbox", { name: "早見表を検索" }).fill("一白");
    await expect(page.getByText(/件見つかりました/)).toBeVisible();
    await expect(page.getByRole("link", { name: "一白水星の詳細を見る" })).toBeVisible();
  });

  test("項目の詳細ページに遷移し、戻れること", async ({ page }) => {
    await page.goto("/guide?tab=numerology");
    await page.getByRole("link", { name: "7の詳細を見る" }).click();
    await expect(page).toHaveURL("/guide/numerology/number-7");
    await expect(page.getByRole("heading", { level: 1, name: "7" })).toBeVisible();
    await page.getByRole("link", { name: "早見表に戻る" }).click();
    await expect(page).toHaveURL("/guide?tab=numerology");
  });

  test("早見表ナビがアクティブであること", async ({ page }) => {
    await page.goto("/guide");
    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "早見表" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
