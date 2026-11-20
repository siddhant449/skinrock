import { test, expect } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("reduced motion shows content immediately", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    await expect(page.locator("[data-preloader]")).toBeHidden();
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.locator("h1").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });
});

test("nav has the agreed links and a plain text cta", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["Stones", "Projects", "Light", "Specs", "Studio", "Request samples"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible({ timeout: 8000 });
  }
});

test("preloader counts up then gets out of the way", async ({ page }) => {
  await page.goto("/");
  const pre = page.locator("[data-preloader]");
  await expect(pre).toBeVisible();
  // count (1.7s) + hold for assets (<=2.2s) + wipe (1.1s), plus headroom for loaded CI machines
  await expect(pre).toBeHidden({ timeout: 10_000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded)).toBe("true");
});

test("hero carries no spec list beside the headline (the user removed it)", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#hero");
  await expect(hero).not.toContainText("Swiss engineered");
  await expect(hero).not.toContainText("kg/m²");
});

test("preloader runs on a first visit even though prefs settle after hydration", async ({ page }) => {
  // the bug this guards: the preloader skipped itself because prefs read "reduced" during hydration
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const pre = page.locator("[data-preloader]");
  await expect(pre).toBeVisible();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("sr-loaded")), { timeout: 10_000 }).toBe("1");
});
