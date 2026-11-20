import { test, expect } from "@playwright/test";

test("no 01 / 02 style number indices anywhere on the page", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body.innerText);
  const hits = text.match(/(^|\s)0[1-9](?=\s|\/|$)/gm) ?? [];
  expect(hits).toEqual([]);
});

test("no short decorative hairlines beside labels", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-hero-line], [data-bar], #manifesto [data-count]")).toHaveCount(0);
});
