import { test, expect } from "@playwright/test";

test.describe("1dayタロット占い", () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリアして未占い状態にする
    await page.goto("/daily");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();
  });

  test("ページタイトルが表示されること", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "1dayタロット占い" })
    ).toBeVisible();
  });

  test("カードを引くボタンが表示されること", async ({ page }) => {
    await expect(page.getByLabel("カードを引く")).toBeVisible();
  });

  test("カードを引くと結果が表示されること", async ({ page }) => {
    await page.getByLabel("カードを引く").click();

    // フリップアニメーション後に結果が表示される（最大3秒待機）
    const orientation = page.getByText(/☀ 正位置|☽ 逆位置/);
    await expect(orientation).toBeVisible({ timeout: 5000 });

    // 運勢が表示されること
    await expect(page.getByText(/総合運/)).toBeVisible();
    await expect(page.getByText(/恋愛運/)).toBeVisible();
  });

  test("結果にカード詳細ボタンが含まれること", async ({ page }) => {
    await page.getByLabel("カードを引く").click();

    const btn = page.getByRole("button", { name: /の詳細を見る/ });
    await expect(btn).toBeVisible({ timeout: 5000 });
  });

  test("ページ再読み込み後も結果が保持されること", async ({ page }) => {
    await page.getByLabel("カードを引く").click();

    // 結果が出るのを待つ
    const orientation = page.getByText(/☀ 正位置|☽ 逆位置/);
    await expect(orientation).toBeVisible({ timeout: 5000 });

    // ページ再読み込み
    await page.reload();

    // 結果がそのまま表示される（カードを引くボタンは出ない）
    await expect(orientation).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel("カードを引く")).not.toBeVisible();
  });

  test("BottomNavの1dayタブがアクティブであること", async ({ page }) => {
    const navLink = page.getByRole("link", { name: "1day" });
    await expect(navLink).toHaveAttribute("aria-current", "page");
  });
});
