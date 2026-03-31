import { test, expect } from "@playwright/test";

test.describe("キーワードクイズ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quiz");
  });

  test("ページタイトルが表示されること", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "キーワードクイズ" })
    ).toBeVisible();
  });

  test("開始ボタンが表示されること", async ({ page }) => {
    await expect(page.getByText("クイズを始める")).toBeVisible();
  });

  test("クイズを始めると出題画面に遷移すること", async ({ page }) => {
    await page.getByText("クイズを始める").click();
    await expect(
      page.getByText("このカードのキーワードはどれ？")
    ).toBeVisible();
  });

  test("4択が表示されること", async ({ page }) => {
    await page.getByText("クイズを始める").click();
    await expect(
      page.getByText("このカードのキーワードはどれ？")
    ).toBeVisible();
    const choicesArea = page.getByText("このカードのキーワードはどれ？").locator("..");
    await expect(choicesArea.getByRole("button")).toHaveCount(4);
  });

  test("10問完了すると結果が表示されること", async ({ page }) => {
    await page.getByText("クイズを始める").click();

    for (let i = 0; i < 10; i++) {
      // 「このカードのキーワードはどれ？」が表示されるのを待つ
      await expect(
        page.getByText("このカードのキーワードはどれ？")
      ).toBeVisible();

      // 最初の選択肢をクリック
      const firstChoice = page.getByText("このカードのキーワードはどれ？").locator("..").getByRole("button").first();
      await firstChoice.click();

      // 「次へ」をクリック
      await page.getByText("次へ").click();
    }

    // 結果画面
    await expect(page.getByText("結果")).toBeVisible();
    await expect(page.getByText("もう一度挑戦する")).toBeVisible();
  });

  test("BottomNavのクイズタブがアクティブであること", async ({ page }) => {
    const nav = page.getByRole("navigation", {
      name: "メインナビゲーション",
    });
    const quizLink = nav.getByRole("link", { name: /クイズ/ });
    await expect(quizLink).toHaveAttribute("aria-current", "page");
  });
});
