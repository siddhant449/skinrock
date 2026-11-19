import { test, expect } from "@playwright/test";

test("collection index lists four categories linking to their pages", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#collection [data-row]");
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText("Slate");
  await expect(rows.nth(3)).toContainText("Acoustic");
  await expect(rows.nth(1)).toHaveAttribute("href", /quartzite/);
});

test("collection is a cream chapter and switches the nav to ink", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3500);
  await page.locator("#collection").evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 120));
  await page.waitForTimeout(800);
  await expect(page.locator("header[data-nav-theme]")).toHaveAttribute("data-nav-theme", "cream");
});

test("hovering a stone shows its preview by the cursor", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3500);
  const row = page.locator("#collection [data-row]").first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await row.hover();
  await expect(page.locator("[data-cursor-preview] img").first()).toBeVisible();
});

test("projects have at least eight captioned figures", async ({ page }) => {
  await page.goto("/");
  const figs = page.locator("#projects figure:has(figcaption)");
  expect(await figs.count()).toBeGreaterThanOrEqual(8);
});

test("projects statement stays pinned while the collage drifts past", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3500);
  const collage = page.locator("#projects [data-collage]");
  const top = await collage.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 0.4), top);
  await page.waitForTimeout(1000);
  const h2Top = await page.locator("#projects h2").evaluate((el) => el.getBoundingClientRect().top);
  expect(h2Top).toBeGreaterThan(100);
});
