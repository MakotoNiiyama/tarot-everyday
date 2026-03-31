import { test, expect } from "@playwright/test";

test.describe("ボトムナビゲーション", () => {
  test("4つのナビリンクが表示されていること", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", {
      name: "メインナビゲーション",
    });
    await expect(nav).toBeVisible();
    await expect(nav.getByText("ホーム")).toBeVisible();
    await expect(nav.getByText("早見表")).toBeVisible();
    await expect(nav.getByText("クイズ")).toBeVisible();
    await expect(nav.getByText("1day占い")).toBeVisible();
  });

  test("早見表リンクをクリックすると /cards に遷移すること", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "メインナビゲーション" }).getByText("早見表").click();
    await expect(page).toHaveURL(/\/cards/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("早見表");
  });

  test("1day占いリンクをクリックすると /daily に遷移すること", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "メインナビゲーション" }).getByText("1day占い").click();
    await expect(page).toHaveURL(/\/daily/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "1dayタロット占い"
    );
  });

  test("ホームリンクをクリックすると / に遷移すること", async ({ page }) => {
    await page.goto("/cards");
    await page.getByRole("navigation", { name: "メインナビゲーション" }).getByText("ホーム").click();
    await expect(page).toHaveURL("/");
  });

  test("全ページでボトムナビが表示されること", async ({ page }) => {
    for (const path of ["/", "/cards", "/quiz", "/daily"]) {
      await page.goto(path);
      await expect(
        page.getByRole("navigation", { name: "メインナビゲーション" })
      ).toBeVisible();
    }
  });
});
