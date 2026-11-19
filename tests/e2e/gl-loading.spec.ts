import { test, expect } from "@playwright/test";
import { wakeWebGL } from "./helpers";

// software WebGL on a dev server is slow, especially with parallel workers
test.describe.configure({ timeout: 60_000 });

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("webgl waits for the visitor, then loads on first interaction", async ({ page }) => {
  await page.goto("/");
  // longer than the old idle-callback timeout (2.5s): nothing should load without a visitor
  await page.waitForTimeout(3200);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 200);
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 10_000 });
});

test("webgl still arrives without interaction a few seconds after the intro", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
});

test.describe("phones", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("phones keep the lighter DOM version without a canvas", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.touchscreen.tap(200, 400);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(6500);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("[data-gl-image] img").first()).toBeVisible();
  });
});

test("hero photo stays visible when webgl takes over after the intro", async ({ page }) => {
  test.setTimeout(90_000); // several fixed waits plus software WebGL under parallel load
  const sharp = (await import("sharp")).default;
  const hero = page.locator("#hero [data-gl-image]");
  const brightness = async () => {
    const box = (await hero.boundingBox())!;
    const shot = await page.screenshot({ clip: { x: box.x + box.width * 0.3, y: 30, width: box.width * 0.4, height: 140 } });
    const { channels } = await sharp(shot).stats();
    return (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  };
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 10_000 }).toBe("true");
  await page.waitForTimeout(1200);
  await page.mouse.move(900, 300);
  await expect(hero).toHaveAttribute("data-gl", "ready", { timeout: 25_000 });
  // after the DOM image's 300ms fade: a replayed reveal would still be climbing from the bottom
  await page.waitForTimeout(380);
  const justAfter = await brightness();
  await page.waitForTimeout(3000);
  const settled = await brightness(); // the graded WebGL photo once everything has finished
  // a replayed reveal shows up as a dip right after takeover
  expect(justAfter).toBeGreaterThan(settled * 0.9);
});

test("only images near the viewport load their webgl textures", async ({ page }) => {
  await page.goto("/");
  await wakeWebGL(page);
  await expect(page.locator("#hero [data-gl-image]")).toHaveAttribute("data-gl", "ready", { timeout: 30_000 });
  await page.waitForTimeout(1500);
  const live = await page.locator("[data-gl-image] [data-gl-view]").count();
  const total = await page.locator("[data-gl-image]").count();
  expect(total).toBeGreaterThan(10);
  expect(live).toBeLessThanOrEqual(3);
});
