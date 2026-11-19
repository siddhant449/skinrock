import { test, expect } from "@playwright/test";

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("no horizontal overflow at 390px", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3500);
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((ff) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ff), f);
      await page.waitForTimeout(500);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over, `overflow at ${f}`).toBeLessThanOrEqual(0);
    }
  });
});

test("fast scroll round trip is clean", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await page.waitForTimeout(3500);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2000);
  await expect(page.locator("[data-wordmark]")).toBeInViewport();
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, -1600);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  await expect(page.locator("h1")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("rendered text has no dashes and there is a single h1", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3000);
  const text = await page.evaluate(() => document.body.innerText + " " + document.title + " " + [...document.querySelectorAll("img")].map((i) => i.alt).join(" "));
  expect(text).not.toMatch(/[–—]/);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("every section heading level is h2 under the single h1", async ({ page }) => {
  await page.goto("/");
  const levels = await page.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3")].map((h) => h.tagName));
  expect(levels[0]).toBe("H1");
  expect(levels.slice(1).every((l) => l === "H2")).toBe(true);
});
