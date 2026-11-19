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
  await expect(pre).toBeHidden({ timeout: 6000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded)).toBe("true");
});

test("hero shows the spec line without dashes", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#hero");
  await expect(hero).toContainText("1.5 to 3 mm");
  await expect(hero).toContainText("Engineered in Chur, Switzerland");
});

test("preloader runs on a first visit even though prefs settle after hydration", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(400);
  const pre = page.locator("[data-preloader]");
  await expect(pre).toBeVisible();
  const n = await pre.locator("span.tabular-nums").textContent();
  expect(Number(n)).toBeLessThan(100);
});
