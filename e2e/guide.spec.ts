import { test, expect, type Page } from "@playwright/test";

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

/** 詳細の表示先。スマホはボトムシート(dialog)、PC(1280px〜)は右のサイドパネル */
const detailView = (page: Page, isMobile: boolean) =>
  isMobile ? page.getByRole("dialog") : page.getByRole("complementary", { name: "詳細パネル" });

/** 一覧を下の方のグループまでスクロールし、そのタイルを画面の中ほどに出す */
async function scrollToTile(page: Page, name: string) {
  const tile = page.getByRole("button", { name: `${name}の詳細を見る` });
  await tile.evaluate((el) => el.scrollIntoView({ block: "center" }));
  // スクロールが落ち着くのを待つ
  await expect.poll(async () => {
    const a = await scrollY(page);
    await page.waitForTimeout(100);
    return a === (await scrollY(page)) && a > 0;
  }).toBe(true);
  return tile;
}

test.describe("早見表", () => {
  test("初期表示はタロットのタブで78枚のカードがあること", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByRole("heading", { level: 1, name: "早見表" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "タロット" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("button", { name: /の詳細を見る/ })).toHaveCount(78);
  });

  test("タブを切り替えると URL と一覧が変わること", async ({ page }) => {
    await page.goto("/guide");
    await page.getByRole("tab", { name: "九星気学" }).click();
    await expect(page).toHaveURL("/guide?tab=kyusei");
    await expect(page.getByRole("button", { name: "一白水星の詳細を見る" })).toBeVisible();
  });

  test("URL の tab で初期タブを指定できること", async ({ page }) => {
    await page.goto("/guide?tab=maya");
    await expect(page.getByRole("tab", { name: "マヤ暦" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: "白い魔法使いの詳細を見る" })).toBeVisible();
  });

  test("全占術を横断して検索できること", async ({ page, isMobile }) => {
    await page.goto("/guide");
    if (isMobile) await page.getByRole("button", { name: "検索欄を開く" }).click();
    await page.getByRole("searchbox", { name: "早見表を検索" }).fill("一白");
    await expect(page.getByText(/件見つかりました/)).toBeVisible();
    await expect(page.getByRole("button", { name: "一白水星の詳細を見る" })).toBeVisible();
  });

  test("タイルを押すとページを移らずに詳細を開き、閉じてもスクロール位置が変わらないこと", async ({ page, isMobile }) => {
    await page.goto("/guide?tab=maya");
    const tile = await scrollToTile(page, "黒KIN");
    const before = await scrollY(page);
    const tileTop = (await tile.boundingBox())!.y;
    await tile.click();
    const view = detailView(page, isMobile);
    await expect(view.getByRole("heading", { name: "黒KIN", exact: true })).toBeVisible();
    await expect(view.getByRole("link", { name: "詳しく見る" })).toHaveAttribute("href", "/guide/maya/black-kin");
    await expect(page).toHaveURL("/guide?tab=maya");
    if (isMobile) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(Math.abs((await scrollY(page)) - before)).toBeLessThanOrEqual(4);
    } else {
      // PC はパネルの分だけ一覧が狭まり、タイルが小さくなる。押したタイルは画面に残ること
      // (ページの末尾では一覧が短くなった分だけスクロールが止まるので、位置は厳密には保てない)
      await expect(tile).toBeInViewport();
      await page.getByRole("button", { name: "詳細を閉じる" }).click();
      await expect(view).toHaveCount(0);
      expect(Math.abs((await tile.boundingBox())!.y - tileTop)).toBeLessThanOrEqual(4);
      expect(Math.abs((await scrollY(page)) - before)).toBeLessThanOrEqual(4);
      // 一覧の幅が戻ったときに横にはみ出さないこと
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("西洋占星術の下の方のグループのタイルも詳細を開けること", async ({ page, isMobile }) => {
    await page.goto("/guide?tab=horoscope");
    const tile = await scrollToTile(page, "火");
    await tile.click();
    await expect(detailView(page, isMobile).getByRole("heading", { name: "火", exact: true })).toBeVisible();
    if (!isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  for (const [name, id] of [["黒KIN", "black-kin"], ["太陽の月", "moon-9"]]) {
    test(`「詳しく見る」で詳細ページへ移り、戻るボタンで一覧のスクロール位置に戻ること(${name})`, async ({ page }) => {
      await page.goto("/guide?tab=maya");
      const tile = await scrollToTile(page, name);
      const before = await scrollY(page);
      await tile.click();
      await page.getByRole("link", { name: "詳しく見る" }).click();
      await expect(page).toHaveURL(`/guide/maya/${id}`);
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await page.getByRole("link", { name: "早見表に戻る" }).click();
      await expect(page).toHaveURL("/guide?tab=maya");
      await expect(page.getByRole("tab", { name: "マヤ暦" })).toHaveAttribute("aria-selected", "true");
      await expect.poll(async () => Math.abs((await scrollY(page)) - before)).toBeLessThanOrEqual(30);
    });
  }

  test("関連項目をたどったあとも、戻るボタンで1つずつ戻れること", async ({ page }) => {
    await page.goto("/guide?tab=numerology");
    await page.getByRole("button", { name: "7の詳細を見る" }).click();
    await page.getByRole("link", { name: "詳しく見る" }).click();
    await expect(page).toHaveURL("/guide/numerology/number-7");
    const related = page.locator("section", { has: page.getByRole("heading", { name: "関連項目" }) });
    const next = related.getByRole("link", { name: /の詳細を見る/ }).first();
    const nextHref = await next.getAttribute("href");
    await next.click();
    await expect(page).toHaveURL(nextHref!);
    await page.getByRole("link", { name: "早見表に戻る" }).click();
    await expect(page).toHaveURL("/guide/numerology/number-7");
    await page.getByRole("link", { name: "早見表に戻る" }).click();
    await expect(page).toHaveURL("/guide?tab=numerology");
  });

  test("詳細ページを直接開いたときは、戻るボタンで一覧の該当タブへ移ること", async ({ page }) => {
    await page.goto("/guide/numerology/number-7");
    await expect(page.getByRole("heading", { level: 1, name: "7" })).toBeVisible();
    await page.getByRole("link", { name: "早見表に戻る" }).click();
    await expect(page).toHaveURL("/guide?tab=numerology");
    await expect(page.getByRole("tab", { name: "数秘術" })).toHaveAttribute("aria-selected", "true");
  });

  test("四柱推命・算命学のタブがあること", async ({ page }) => {
    await page.goto("/guide?tab=shichu");
    await expect(page.getByRole("tab", { name: "四柱推命" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /十干/ })).toBeVisible();
    await page.getByRole("tab", { name: "算命学" }).click();
    await expect(page).toHaveURL("/guide?tab=sanmei");
    await expect(page.getByRole("heading", { name: /十大主星/ })).toBeVisible();
  });

  test("宿曜のタブがあること", async ({ page }) => {
    await page.goto("/guide?tab=sukuyo");
    await expect(page.getByRole("tab", { name: "宿曜" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /二十七宿/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /三九の関係/ })).toBeVisible();
  });

  test("西洋占星術のタブがあること", async ({ page }) => {
    await page.goto("/guide?tab=horoscope");
    await expect(page.getByRole("tab", { name: "西洋占星術" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /十二星座/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /アスペクト/ })).toBeVisible();
  });

  test("早見表ナビがアクティブであること", async ({ page }) => {
    await page.goto("/guide");
    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole("link", { name: "早見表" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
