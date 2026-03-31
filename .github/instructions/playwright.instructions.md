---
applyTo: "e2e/**"
---

# Playwright Testing — Tarot Everyday

## Project Configuration

- **Config**: `playwright.config.ts`
- **Base URL**: `http://localhost:3100`
- **Dev server**: `npm run dev -- --port 3100` (started by Playwright automatically)
- **Projects**: `chromium` (desktop 1280×720) + `mobile-chrome` (Pixel 7)
- **Test directory**: `e2e/`

## Test Writing Conventions

### Language

- **Test names (`test(...)`) and `describe` blocks**: Japanese
- **Code identifiers**: English

```typescript
test.describe("クイズモード", () => {
  test("10問すべて回答すると結果が表示されること", async ({ page }) => {
    // ...
  });
});
```

### Locator Strategy (Priority Order)

1. `page.getByRole("button", { name: "..." })` — semantic role + accessible name
2. `page.getByText("...")` — visible text content
3. `page.getByTestId("...")` — only when roles/text are ambiguous
4. `page.locator("css-selector")` — last resort

### Navigation

- Use relative paths: `page.goto("/cards")`, not full URLs.
- Wait for navigation implicitly via assertions, not `waitForURL` unless necessary.

### Assertions

- Prefer `expect(locator).toBeVisible()` over checking count.
- Use `expect(locator).toHaveText(...)` for content verification.
- Avoid `page.waitForTimeout()` — use `expect` with auto-retry instead.

### Scoped Locators

- Narrow scope to avoid brittle selectors:

```typescript
const nav = page.getByRole("navigation");
await expect(nav.getByRole("link", { name: "カード一覧" })).toBeVisible();
```

### Common Patterns in This Project

- **Bottom nav**: 4 tabs — Home(`/`), Cards(`/cards`), Quiz(`/quiz`), Daily(`/daily`)
- **Card grid**: Cards have `role="link"` or clickable `<div>` triggers.
- **Bottom sheet**: Appears as Drawer overlay; check `.getByRole("dialog")`.
- **Quiz flow**: Start → 10 questions (auto-flip) → Result. Each question has 4 choice buttons.

## Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("機能名", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/target-page");
  });

  test("期待する動作の説明", async ({ page }) => {
    // Arrange — setup is in beforeEach
    // Act
    await page.getByRole("button", { name: "開始" }).click();
    // Assert
    await expect(page.getByText("結果")).toBeVisible();
  });
});
```

## Debugging Tips

- Run single test: `npx playwright test e2e/foo.spec.ts --headed`
- Debug mode: `npx playwright test --debug`
- If port 3100 is occupied, kill it: `lsof -ti:3100 | xargs kill -9`
