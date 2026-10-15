import { test, expect } from "@playwright/test";

test.describe("ホーム画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("tarot-daily-draw");
      localStorage.removeItem("tarot-birth-profile");
    });
    await page.reload();
  });

  test("背景色が適用されていること", async ({ page }) => {
    const bgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bgColor).toBe("rgb(19, 12, 6)");
  });

  test("今日の運勢カードからカードを引けること", async ({ page }) => {
    const today = page.getByRole("region", { name: "今日のあなたの運勢" });
    await today.getByRole("button", { name: "カードを引く" }).click();
    await expect(today.getByText(/^(正位置|逆位置)$/)).toBeVisible();
  });

  test("「詳しく見る」で運勢ページへ遷移すること(登録済み)", async ({ page }) => {
    // 「詳しく見る」は登録済みのときだけ表示される
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.reload();
    await page.getByRole("link", { name: "詳しく見る" }).click();
    await expect(page).toHaveURL("/fortune");
  });

  test("未登録のときは「詳しく見る」の代わりに登録への誘導が表示されること", async ({ page }) => {
    const today = page.getByRole("region", { name: "今日のあなたの運勢" });
    await expect(today.getByRole("link", { name: "生年月日を登録する" })).toBeVisible();
    await expect(page.getByRole("link", { name: "詳しく見る" })).toHaveCount(0);
  });

  test("入口カードから各ページへ遷移できること", async ({ page }) => {
    const menu = () => page.getByRole("region", { name: "メニュー" });
    await menu().getByRole("link", { name: /相談したいことがある/ }).click();
    await expect(page).toHaveURL("/tarot/reading");
    await page.goto("/");
    await menu().getByRole("link", { name: /タロットクイズ/ }).click();
    await expect(page).toHaveURL("/tarot/quiz");
    await page.goto("/");
    await menu().getByRole("link", { name: /好きな生年月日で占う/ }).click();
    await expect(page).toHaveURL("/fortune/other");
    await page.goto("/");
    await menu().getByRole("link", { name: /早見表/ }).click();
    await expect(page).toHaveURL("/guide");
  });

  test("画面に絵文字が表示されないこと", async ({ page }) => {
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u);
  });
});
