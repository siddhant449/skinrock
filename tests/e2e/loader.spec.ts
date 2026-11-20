import { test, expect } from "@playwright/test";

test("loader shows the Skinrock mark and a window of stone, not a counter", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const pre = page.locator("[data-preloader]");
  await expect(pre).toBeVisible();
  await expect(pre.locator("[data-loader-mark] svg")).toBeAttached();
  await expect(pre.locator("[data-loader-window] img")).toBeAttached();
  // no 000 to 100 count anywhere in the loader
  expect(await pre.innerText()).not.toMatch(/\b\d{2,3}\b/);
});

test("the stone window only opens to full screen once the hero photo has loaded", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const pre = page.locator("[data-preloader]");
  await expect(pre).toHaveAttribute("data-phase", "open", { timeout: 8000 });
  const img = pre.locator("[data-loader-window] img");
  expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  // and it is the same file the hero shows, so the photo downloads once
  const heroSrc = await page.locator("#hero img").first().evaluate((i: HTMLImageElement) => i.currentSrc);
  expect(await img.evaluate((i: HTMLImageElement) => i.currentSrc)).toBe(heroSrc);
  await expect(pre).toBeHidden({ timeout: 6000 });
});
