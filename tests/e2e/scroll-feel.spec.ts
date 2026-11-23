import { test, expect, type Page } from "@playwright/test";

const loaded = (page: Page) =>
  expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");

/** where the reader is: a point in plain flow, in the collection */
async function settleInCollection(page: Page) {
  const top = await page.locator("#collection").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((v) => window.scrollTo(0, v), top + 40);
  await page.waitForTimeout(1200);
  return page.evaluate(() => window.scrollY);
}

/** a quick thumb flick through the browser's touch pipeline: 260px in about 90ms */
async function flick(page: Page, dy = 260) {
  const cdp = await page.context().newCDPSession(page);
  const x = 195;
  const y0 = 600;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= 6; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: Math.round(y0 - (dy * i) / 6) }] });
    // a flick lifts off while the thumb is still moving: no pause after the last move
    if (i < 6) await page.waitForTimeout(15);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test.describe("phone scroll feel", () => {
  test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

  test("the page carries the thumb's scroll itself, instead of handing it to the phone's native fling", async ({ page }) => {
    await page.goto("/");
    await loaded(page);
    const y0 = await settleInCollection(page);
    // listening after the scroller: a move it takes over arrives already claimed (defaultPrevented)
    await page.evaluate(() => {
      const w = window as unknown as { claimed: boolean[] };
      w.claimed = [];
      window.addEventListener("touchmove", (e) => w.claimed.push(e.defaultPrevented), { passive: true });
    });
    await flick(page);
    await page.waitForTimeout(2000);
    const claimed = await page.evaluate(() => (window as unknown as { claimed: boolean[] }).claimed);
    expect(claimed.length).toBeGreaterThan(0);
    expect(claimed.every(Boolean)).toBe(true);
    // and the page still follows the thumb
    expect((await page.evaluate(() => window.scrollY)) - y0).toBeGreaterThan(220);
  });
});

test("desktop: one turn of the wheel moves the page a measured step", async ({ page }) => {
  await page.goto("/");
  await loaded(page);
  const y0 = await settleInCollection(page);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(2200);
  const travel = (await page.evaluate(() => window.scrollY)) - y0;
  expect(travel).toBeGreaterThan(300);
  expect(travel).toBeLessThan(370); // a little shorter than the raw 400px the wheel asks for
});
