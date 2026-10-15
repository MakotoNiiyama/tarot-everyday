import { test, expect } from "@playwright/test";

/** 日本時間の今日(アプリと同じ基準) */
function todayInTokyo(): { year: number; month: number; day: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

const SAVED = JSON.stringify({ version: 1, date: { year: 1985, month: 1, day: 1 }, time: { kind: "unknown" }, prefecture: "27" });
const SYSTEMS = ["数秘術", "九星気学", "マヤ暦", "四柱推命", "算命学", "宿曜", "西洋占星術"];

test.describe("好きな生年月日で占う", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // 登録済みのプロフィールがあっても書き換えないことを確かめる
    await page.evaluate((saved) => localStorage.setItem("tarot-birth-profile", saved), SAVED);
  });

  test("ホームから開くと今日の日付で7占術が表示され、入力を変えると結果が変わり、再読み込みで初期値に戻ること", async ({ page }) => {
    await page.reload();
    await page.getByRole("region", { name: "メニュー" }).getByRole("link", { name: /好きな生年月日で占う/ }).click();
    await expect(page).toHaveURL("/fortune/other");
    await expect(page.getByRole("heading", { level: 1, name: "好きな生年月日で占う" })).toBeVisible();

    const today = todayInTokyo();
    await expect(page.getByRole("combobox", { name: "年" })).toHaveValue(String(today.year));
    await expect(page.getByRole("combobox", { name: "月" })).toHaveValue(String(today.month));
    await expect(page.getByRole("combobox", { name: "日" })).toHaveValue(String(today.day));
    await expect(page.getByRole("combobox", { name: "出生地" })).toHaveValue("13");
    for (const name of SYSTEMS) {
      await expect(page.getByRole("article", { name })).toBeVisible();
    }
    await expect(page.getByRole("region", { name: "今日の1dayタロット" })).toHaveCount(0);

    await page.getByRole("combobox", { name: "年" }).selectOption("1990");
    await page.getByRole("combobox", { name: "月" }).selectOption("3");
    await page.getByRole("combobox", { name: "日" }).selectOption("29");
    const natal = page.getByRole("region", { name: "この生年月日の人物像" });
    await natal.getByRole("button", { name: "数秘術" }).click();
    await expect(natal).toContainText("ライフパス");
    await expect(natal).toContainText("33");

    await page.reload();
    await expect(page.getByRole("combobox", { name: "年" })).toHaveValue(String(today.year));
    await expect(page.getByRole("combobox", { name: "日" })).toHaveValue(String(today.day));

    expect(await page.evaluate(() => localStorage.getItem("tarot-birth-profile"))).toBe(SAVED);
  });

  test("運勢のナビ項目が選択中になること", async ({ page }) => {
    await page.goto("/fortune/other");
    const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
    await expect(nav.getByRole("link", { name: "運勢" })).toHaveAttribute("aria-current", "page");
  });
});
