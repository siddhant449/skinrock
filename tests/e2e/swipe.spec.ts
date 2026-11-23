import { test, expect, type Page } from "@playwright/test";

/** a finger drag through the browser's real touch pipeline, drifting like a thumb does */
async function drag(page: Page, from: [number, number], to: [number, number], steps = 12) {
  const cdp = await page.context().newCDPSession(page);
  const point = (k: number) => ({
    x: Math.round(from[0] + (to[0] - from[0]) * k),
    y: Math.round(from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * 9),
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point(0)] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point(i / steps)] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(900);
}

async function toRail(page: Page) {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
  const y = await page.locator("[data-rail-track]").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((v) => window.scrollTo(0, v), y - 120);
  await page.waitForTimeout(1000);
  return page.locator("[data-rail-track]").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, h: r.height, w: window.innerWidth };
  });
}

for (const [name, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["tablet", { width: 820, height: 1180 }],
] as const) {
  test.describe(`${name}: project gallery swipe`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test("a sideways swipe moves the gallery, not the page", async ({ page }) => {
      const r = await toRail(page);
      const y = r.top + Math.min(r.h * 0.4, 260);
      const before = await page.evaluate(() => ({ x: document.querySelector("[data-rail-track]")!.scrollLeft, y: window.scrollY }));
      await drag(page, [r.w * 0.8, y], [r.w * 0.2, y]);
      const after = await page.evaluate(() => ({ x: document.querySelector("[data-rail-track]")!.scrollLeft, y: window.scrollY }));
      expect(after.x - before.x).toBeGreaterThan(r.w * 0.3);
      expect(Math.abs(after.y - before.y)).toBeLessThan(8);
    });

    test("an up swipe that starts on the gallery still scrolls the page", async ({ page }) => {
      const r = await toRail(page);
      const before = await page.evaluate(() => window.scrollY);
      await drag(page, [r.w * 0.5, r.top + Math.min(r.h * 0.7, 420)], [r.w * 0.5, r.top + 60]);
      expect((await page.evaluate(() => window.scrollY)) - before).toBeGreaterThan(150);
    });

    test("arrow buttons step through the projects one at a time", async ({ page }) => {
      await toRail(page);
      const prev = page.getByRole("button", { name: "Previous project" });
      const next = page.getByRole("button", { name: "Next project" });
      await expect(prev).toBeDisabled();
      // the project in view: the card whose resting place (centred, or the start or end of the
      // gallery for cards that cannot be centred) is where the gallery is now
      const centred = () =>
        page.locator("[data-rail-track]").evaluate((el) => {
          const max = el.scrollWidth - el.clientWidth;
          const rests = [...el.children].map((c) => {
            const h = c as HTMLElement;
            return Math.max(0, Math.min(max, h.offsetLeft + h.offsetWidth / 2 - el.clientWidth / 2));
          });
          const gaps = rests.map((r) => Math.abs(r - el.scrollLeft));
          return gaps.indexOf(Math.min(...gaps));
        });
      expect(await centred()).toBe(0);
      await next.click();
      await expect.poll(centred, { timeout: 3000 }).toBe(1);
      await next.click();
      await expect.poll(centred, { timeout: 3000 }).toBe(2);
      await expect(prev).toBeEnabled();
      await prev.click();
      await expect.poll(centred, { timeout: 3000 }).toBe(1);
      // at the last project the next arrow rests
      await page.locator("[data-rail-track]").evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
      await expect(next).toBeDisabled({ timeout: 3000 });
    });
  });
}
