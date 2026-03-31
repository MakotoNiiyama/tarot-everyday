import { test, expect } from "@playwright/test";

test.describe("タロット占い（スプレッド）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reading");
  });

  test("ページタイトルが表示されること", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "タロット占い" })
    ).toBeVisible();
  });

  test("4種類のスプレッドが選択できること", async ({ page }) => {
    await expect(page.getByText("スリーカード")).toBeVisible();
    await expect(page.getByText("二者択一")).toBeVisible();
    await expect(page.getByText("ヘキサグラム")).toBeVisible();
    await expect(page.getByText("ケルト十字")).toBeVisible();
  });

  test("スプレッド選択後に質問入力画面が表示されること", async ({ page }) => {
    await page.getByText("スリーカード").click();
    await expect(page.getByText("占いたい内容を入力してください")).toBeVisible();
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("質問未入力では占いを開始できないこと", async ({ page }) => {
    await page.getByText("スリーカード").click();
    const startButton = page.getByText("占いを始める");
    await expect(startButton).toBeDisabled();
  });

  test("戻るボタンでスプレッド選択に戻れること", async ({ page }) => {
    await page.getByText("スリーカード").click();
    await page.getByText("戻る").click();
    await expect(page.getByText("スプレッドを選択してください")).toBeVisible();
  });

  test("スリーカードで占い全フローが完了すること", async ({ page }) => {
    // スプレッド選択
    await page.getByText("スリーカード").click();

    // 質問入力
    await page.getByRole("textbox").fill("転職すべきかどうか");
    await page.getByText("占いを始める").click();

    // シャッフル演出
    await expect(page.getByText("カードをシャッフルしています")).toBeVisible();

    // 3山カット
    await expect(
      page.getByText("3つの山から1つを選んでください")
    ).toBeVisible({ timeout: 5000 });
    await page.getByLabel("中央の山").click();

    // 展開演出→結果
    await expect(page.getByText("AI分析用プロンプト")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("別のスプレッドで占う")).toBeVisible();
  });

  test("プロンプトにスプレッド名と質問が含まれること", async ({ page }) => {
    await page.getByText("スリーカード").click();
    await page.getByRole("textbox").fill("恋愛の相談");
    await page.getByText("占いを始める").click();
    await expect(
      page.getByText("3つの山から1つを選んでください")
    ).toBeVisible({ timeout: 5000 });
    await page.getByLabel("左の山").click();
    await expect(page.getByText("AI分析用プロンプト")).toBeVisible({
      timeout: 10000,
    });

    // プロンプト内容を確認
    await expect(page.getByText("スリーカード（3枚展開）")).toBeVisible();
    await expect(page.getByText("恋愛の相談")).toBeVisible();
  });

  test("BottomNavの占いタブがアクティブであること", async ({ page }) => {
    const nav = page.getByRole("navigation", {
      name: "メインナビゲーション",
    });
    const readingLink = nav.getByRole("link", { name: /占い/ });
    await expect(readingLink).toHaveAttribute("aria-current", "page");
  });
});
