import { test, expect } from "@playwright/test";

test.describe("タロットの入口", () => {
  test("占いとクイズを選べること", async ({ page }) => {
    await page.goto("/tarot");
    await expect(page.getByRole("heading", { level: 1, name: "タロット" })).toBeVisible();
    await page.getByRole("link", { name: /タロット占いをする/ }).click();
    await expect(page).toHaveURL("/tarot/reading");
    await expect(page.getByRole("heading", { level: 1, name: "タロット占い" })).toBeVisible();
    await page.goto("/tarot");
    await page.getByRole("link", { name: /クイズで練習する/ }).click();
    await expect(page).toHaveURL("/tarot/quiz");
    await expect(page.getByRole("heading", { level: 1, name: "キーワードクイズ" })).toBeVisible();
  });
});
