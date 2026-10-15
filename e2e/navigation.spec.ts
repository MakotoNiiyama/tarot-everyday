import { test, expect } from "@playwright/test";

const nav = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "メインナビゲーション" });

test.describe("メインナビゲーション", () => {
  test("4つのナビリンクが表示されていること", async ({ page }) => {
    await page.goto("/");
    await expect(nav(page)).toBeVisible();
    for (const label of ["ホーム", "運勢", "タロット", "早見表"]) {
      await expect(nav(page).getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav(page).getByRole("link")).toHaveCount(4);
  });

  test("各リンクで正しいページに遷移すること", async ({ page }) => {
    await page.goto("/");
    await nav(page).getByRole("link", { name: "早見表" }).click();
    await expect(page).toHaveURL("/guide");
    await nav(page).getByRole("link", { name: "タロット" }).click();
    await expect(page).toHaveURL("/tarot");
    await nav(page).getByRole("link", { name: "運勢" }).click();
    await expect(page).toHaveURL("/fortune");
    await nav(page).getByRole("link", { name: "ホーム" }).click();
    await expect(page).toHaveURL("/");
  });

  test("配下のページでも該当項目がアクティブであること", async ({ page }) => {
    await page.goto("/tarot/quiz");
    await expect(nav(page).getByRole("link", { name: "タロット" })).toHaveAttribute("aria-current", "page");
    await page.goto("/guide/tarot/major-00");
    await expect(nav(page).getByRole("link", { name: "早見表" })).toHaveAttribute("aria-current", "page");
  });

  test("全ページでナビが表示されること", async ({ page }) => {
    for (const path of ["/", "/fortune", "/tarot", "/tarot/reading", "/tarot/quiz", "/guide"]) {
      await page.goto(path);
      await expect(nav(page)).toBeVisible();
    }
  });

  test("スマホでは下部ナビ、PCでは左サイドナビになること", async ({ page, isMobile }) => {
    await page.goto("/");
    const box = await nav(page).boundingBox();
    const viewport = page.viewportSize()!;
    if (isMobile) {
      expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 120);
    } else {
      expect(box!.x).toBeLessThan(240);
      await expect(page.getByText("毎日の占いノート")).toBeVisible();
    }
  });
});

test.describe("ランドマークとスキップリンク", () => {
  test("本文が main ランドマークに入っていること", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("main").getByRole("heading", { name: "今日のあなたの運勢" })).toBeVisible();
  });

  test("最初の Tab で「本文へスキップ」が表示され、押すと本文へ移動すること", async ({ page, isMobile }) => {
    test.skip(isMobile, "キーボード操作は PC のみ確認する");
    await page.goto("/");
    const skip = page.getByRole("link", { name: "本文へスキップ" });
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await expect(page.getByRole("main")).toBeFocused();
  });
});
