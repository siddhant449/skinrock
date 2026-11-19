import { test, expect } from "@playwright/test";

test("mouse wheel scrolls the page when motion is allowed", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
  await page.mouse.move(700, 450);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
});

test("hero side copy is hidden before hydration so it never pops on repeat visits", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("sr-loaded", "1"));
  await page.route(/\/_next\/static\/chunks\/.*\.js/, (r) => r.abort()); // SSR + CSS + inline head script, no hydration
  await page.goto("/");
  const op = await page.locator("#hero [data-hero-fade]").first().evaluate((el) => getComputedStyle(el).opacity);
  expect(op).toBe("0");
  // the CSS failsafe still reveals it if JS never arrives
  await page.waitForTimeout(4600);
  expect(await page.locator("#hero [data-hero-fade]").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
});

test.describe("phones", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("tall chapters are not pinned on phones", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3500);
    for (const id of ["manifesto", "flex", "light"]) {
      const pinned = await page.locator(`#${id}`).evaluate((el) => el.parentElement!.classList.contains("pin-spacer"));
      expect(pinned, id).toBe(false);
    }
  });
});
