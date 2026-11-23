import { test, expect, type Page } from "@playwright/test";

const loaded = (page: Page) =>
  expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

  test("the intro gets the photos in before you enter: all are on their way, the first screens' are ready", async ({ page }) => {
    await page.goto("/");
    await loaded(page);
    const r = await page.evaluate(() => {
      const shown = [...document.images].filter((i) => i.getClientRects().length);
      const near = shown.filter((i) => i.getBoundingClientRect().top + scrollY < innerHeight * 2.5);
      return {
        total: shown.length,
        lazy: shown.filter((i) => i.loading === "lazy").length,
        near: near.length,
        nearReady: near.filter((i) => i.complete && i.naturalWidth > 0).length,
      };
    });
    expect(r.total).toBeGreaterThan(10);
    expect(r.lazy).toBe(0); // nothing waits for the scroll to start loading
    expect(r.nearReady).toBe(r.near);
    // and well before a reader could scroll down to them, the far photos are in as well
    await expect
      .poll(() => page.evaluate(() => [...document.images].filter((i) => i.getClientRects().length && !(i.complete && i.naturalWidth > 0)).length), {
        timeout: 15_000,
      })
      .toBe(0);
  });

  test("a repeat visit, which skips the intro, still loads every photo early", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("sr-loaded", "1"));
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => [...document.images].filter((i) => i.getClientRects().length && i.loading === "lazy").length), { timeout: 8000 })
      .toBe(0);
  });
});

test("desktop: every photo WebGL draws has its texture file fetched during the intro, even far down", async ({ page }) => {
  await page.goto("/");
  await loaded(page);
  const missing = () =>
    page.evaluate(() => {
      const names = performance.getEntriesByType("resource").map((e) => e.name);
      const drawn = [...document.querySelectorAll("[data-gl-image] img, [data-backlight] img")].map(
        (img) => (img as HTMLImageElement).src.match(/\/_img\/(.+?)-[0-9a-f]{8}-/)?.[1],
      );
      return [...new Set(drawn)].filter((n) => n && !names.some((u) => u.includes(`/_img/${n}-`)));
    });
  await expect.poll(missing, { timeout: 8000 }).toEqual([]);
});
