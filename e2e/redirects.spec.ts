import { test, expect } from "@playwright/test";

const cases: [string, string][] = [
  ["/cards", "/guide"],
  ["/cards/major-00", "/guide/tarot/major-00"],
  ["/reading", "/tarot/reading"],
  ["/quiz", "/tarot/quiz"],
  ["/daily", "/fortune"],
];

test.describe("旧URLの転送", () => {
  for (const [from, to] of cases) {
    test(`${from} は ${to} へ転送されること`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(to);
    });
  }
});
