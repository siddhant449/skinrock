import { test, expect } from "@playwright/test";

test("home responds with Skinrock title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Skinrock/);
});

test("serves organization json-ld, sitemap and robots", async ({ page, request }) => {
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.join(" ")).toContain('"PostalAddress"');
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain("sitemap.xml");
});
