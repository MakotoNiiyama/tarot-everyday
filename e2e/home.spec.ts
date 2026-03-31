import { test, expect } from "@playwright/test";

test.describe("ホーム画面 — スクラッチアート風テーマ", () => {
  test("ページが正しく表示され、背景色が適用されていること", async ({
    page,
  }) => {
    await page.goto("/");

    // bodyの背景色が #130C06 であること
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // rgb(19, 12, 6) = #130C06
    expect(bgColor).toBe("rgb(19, 12, 6)");
  });

  test("アプリタイトル「Tarot Everyday」が表示されること", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Tarot Everyday"
    );
  });

  test("SVG装飾要素が描画されていること", async ({ page }) => {
    await page.goto("/");
    const svgs = page.locator('svg[aria-hidden="true"]');
    // ヘッダー装飾1 + ディバイダー2 + ScratchFrame1 + ScratchMoon1 + BottomNavアイコン4 = 9
    await expect(svgs).toHaveCount(9);
  });

  test("ナビゲーションリンク（早見表・1dayタロット）が表示されること", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("📖 早見表")).toBeVisible();
    await expect(page.getByText("🔮 1dayタロット")).toBeVisible();
  });

  test("占い未済時にCTA「今日のカードを引いてみましょう」が表示されること", async ({
    page,
  }) => {
    // localStorageクリアして未済状態にする
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();

    await expect(page.getByText("今日のカードを")).toBeVisible();
    await expect(page.getByText("引いてみましょう")).toBeVisible();
  });

  test("占い未済CTAをクリックすると /daily へ遷移すること", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();

    await page.getByLabel("今日のカードを引く").click();
    await expect(page).toHaveURL(/\/daily/);
  });

  test("占い実行後にホームに戻ると結果サマリーが表示されること", async ({
    page,
  }) => {
    // まず占いを実行
    await page.goto("/daily");
    await page.evaluate(() => localStorage.removeItem("tarot-daily-draw"));
    await page.reload();
    await page.getByLabel("カードを引く").click();
    // 結果が表示されるまで待つ
    await expect(page.getByText(/正位置|逆位置/)).toBeVisible({ timeout: 5000 });

    // ホームに戻る
    await page.goto("/");
    // 結果サマリーが表示されること
    await expect(page.getByRole("region", { name: "今日の占い結果" })).toBeVisible();
    await expect(page.getByText("⭐ 総合運")).toBeVisible();
  });
});
