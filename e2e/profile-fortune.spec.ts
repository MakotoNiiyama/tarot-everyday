import { test, expect } from "@playwright/test";

test.describe("プロフィール登録から運勢ページまで", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("tarot-birth-profile");
      localStorage.removeItem("tarot-daily-draw");
    });
  });

  test("登録すると運勢ページに7占術の運勢が表示されること", async ({ page }) => {
    await page.goto("/fortune");
    await page.getByRole("link", { name: "生年月日を登録する" }).click();
    await expect(page).toHaveURL("/fortune/profile");
    await page.getByRole("combobox", { name: "年" }).selectOption("1990");
    await page.getByRole("combobox", { name: "月" }).selectOption("3");
    await page.getByRole("combobox", { name: "日" }).selectOption("29");
    await page.getByRole("radio", { name: "時刻を指定" }).click();
    await page.getByLabel("出生時刻", { exact: true }).fill("14:00");
    await page.getByRole("checkbox", { name: "分は分からない(14時台として計算)" }).check();
    await page.getByRole("combobox", { name: "出生地" }).selectOption("13");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL("/fortune");
    await expect(page.getByText("1990/3/29 生 · 14時台 · 東京都")).toBeVisible();
    for (const name of ["数秘術", "九星気学", "マヤ暦", "四柱推命", "算命学", "宿曜", "西洋占星術"]) {
      await expect(page.getByRole("article", { name })).toBeVisible();
    }
    await page.getByRole("tab", { name: "今年" }).click();
    await expect(page.getByRole("article", { name: "数秘術" })).toContainText("パーソナルイヤー");
  });

  test("分まで入力して保存すると運勢ページの要約にその時刻が出ること", async ({ page }) => {
    await page.goto("/fortune/profile");
    await page.getByRole("combobox", { name: "年" }).selectOption("1990");
    await page.getByRole("combobox", { name: "月" }).selectOption("3");
    await page.getByRole("combobox", { name: "日" }).selectOption("29");
    await page.getByRole("radio", { name: "時刻を指定" }).click();
    await expect(page.getByText("出生時刻を入力してください")).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeDisabled();
    await page.getByLabel("出生時刻", { exact: true }).fill("14:35");
    await expect(page.getByRole("checkbox", { name: "分は分からない(14時台として計算)" })).not.toBeChecked();
    await page.getByRole("combobox", { name: "出生地" }).selectOption("13");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL("/fortune");
    await expect(page.getByText("1990/3/29 生 · 14:35 · 東京都")).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("tarot-birth-profile") ?? "null"));
    expect(saved.time).toEqual({ kind: "minute", hour: 14, minute: 35 });
  });

  test("人物像に命式表と人体星図が表示されること", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" }, gender: "male" }),
      ),
    );
    await page.goto("/fortune");
    const natal = page.getByRole("region", { name: "あなたについて" });
    await natal.getByRole("button", { name: "四柱推命" }).click();
    await expect(natal.getByRole("table", { name: "四柱推命の命式" })).toContainText("癸巳");
    await natal.getByRole("button", { name: "算命学" }).click();
    await expect(natal.getByRole("list", { name: "算命学の人体星図" })).toContainText("鳳閣星");
  });

  test("人物像にホロスコープのチャート円と天体の表が表示されること", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "hour", hour: 14 }, prefecture: "13" }),
      ),
    );
    await page.goto("/fortune");
    const natal = page.getByRole("region", { name: "あなたについて" });
    await natal.getByRole("button", { name: "西洋占星術" }).click();
    await expect(natal.getByRole("img", { name: /ホロスコープ/ })).toBeVisible();
    await expect(natal.getByRole("table", { name: "天体の位置" })).toContainText("牡羊座");
    await natal.getByRole("radio", { name: "ホールサイン" }).click();
    await expect(natal.getByRole("radio", { name: "ホールサイン" })).toHaveAttribute("aria-checked", "true");
  });

  test("チップから要素の詳細を開けること", async ({ page, isMobile }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/fortune");
    await page.getByRole("article", { name: "数秘術" }).getByRole("button", { name: /ライフパス/ }).click();
    if (isMobile) {
      await expect(page.getByRole("dialog")).toContainText("33");
    } else {
      await expect(page.getByRole("complementary", { name: "詳細パネル" })).toContainText("33");
    }
  });

  test("総合鑑定プロンプトをコピーできること", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "クリップボードの権限は chromium で確認する");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/fortune");
    await page.getByRole("textbox", { name: "相談したいこと(任意)" }).fill("仕事のこと");
    await page.getByRole("button", { name: "総合鑑定プロンプトをコピー" }).click();
    await expect(page.getByText("コピーしました")).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("■ 相談内容: 仕事のこと");
    expect(text).toContain("【九星気学】");
  });

  test("ホームに今日の運勢のチップが出て、プロフィールを削除すると誘導に戻ること", async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/");
    await expect(page.getByRole("region", { name: "今日の運勢" })).toContainText("今日のKIN");
    await expect(page.getByRole("region", { name: "今日の運勢" })).toContainText("本命宿との関係");
    await page.goto("/fortune/profile");
    await page.getByRole("button", { name: "登録情報を削除" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page).toHaveURL("/fortune");
    await expect(page.getByRole("link", { name: "生年月日を登録する" })).toBeVisible();
  });

  test("PC で詳細パネルを開くと運勢ページが1カラムになり、カードが狭くならないこと", async ({ page, isMobile }) => {
    test.skip(isMobile, "PC の幅のみ確認する");
    await page.evaluate(() =>
      localStorage.setItem(
        "tarot-birth-profile",
        JSON.stringify({ version: 1, date: { year: 1990, month: 3, day: 29 }, time: { kind: "unknown" } }),
      ),
    );
    await page.goto("/fortune");
    const article = page.getByRole("article", { name: "数秘術" });
    await article.getByRole("button", { name: /ライフパス/ }).click();
    await expect(page.getByRole("complementary", { name: "詳細パネル" })).toBeVisible();
    // 2カラムのままだと左の列が 200px 以下まで縮むため、幅が保たれていることを確かめる
    expect((await article.boundingBox())!.width).toBeGreaterThan(480);
  });
});
