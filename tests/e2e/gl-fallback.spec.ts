import { test, expect } from "@playwright/test";

test.use({ launchOptions: { args: ["--disable-gpu", "--disable-webgl", "--disable-3d-apis"] } });

test("falls back to DOM images without WebGL", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForTimeout(1500);
  const img = page.locator("[data-gl-image] img").first();
  await expect(img).toBeVisible();
  expect(await img.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
