import { test, expect } from "@playwright/test";

test.describe("運勢ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fortune");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();
  });

  test("今日の日付と1dayタロットが表示されること", async ({ page }) => {
    await expect(page.getByText("Today")).toBeVisible();
    await expect(page.getByRole("region", { name: "今日の1dayタロット" })).toBeVisible();
  });

  test("カードを引くと結果が表示され、再読み込み後も保持されること", async ({ page }) => {
    const section = page.getByRole("region", { name: "今日の1dayタロット" });
    await section.getByRole("button", { name: "カードを引く" }).click();
    const orientation = section.getByText(/^(正位置|逆位置)$/);
    await expect(orientation).toBeVisible();
    await page.reload();
    await expect(orientation).toBeVisible();
    await expect(section.getByRole("button", { name: "カードを引く" })).toHaveCount(0);
  });

  test("カードをタップすると詳細が開くこと(スマホはボトムシート、PCはサイドパネル)", async ({ page, isMobile }) => {
    const section = page.getByRole("region", { name: "今日の1dayタロット" });
    await section.getByRole("button", { name: "カードを引く" }).click();
    await section.getByRole("button", { name: /の詳細を見る/ }).click();
    if (isMobile) {
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog").getByRole("tab", { name: "正位置" })).toBeVisible();
    } else {
      // Desktop Chrome は 1280×720 なのでサイドパネルになる
      const panel = page.getByRole("complementary", { name: "詳細パネル" });
      await expect(panel).toBeVisible();
      await panel.getByRole("button", { name: "詳細を閉じる" }).click();
      await expect(panel).toHaveCount(0);
    }
  });

  test("運勢ナビがアクティブであること", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "運勢" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
