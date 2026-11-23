import { test, expect, type Page } from "@playwright/test";

const loaded = (page: Page) =>
  expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");

for (const [name, opts] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["phone", { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true }],
] as const) {
  test.describe(name, () => {
    test.use(opts);
    test("a refresh always opens the page at the top, wherever the reader was", async ({ page }) => {
      await page.goto("/");
      await loaded(page);
      await page.evaluate(() => window.scrollTo(0, 3200));
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
      await page.reload();
      await loaded(page);
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  });
}
