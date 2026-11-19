import { test, expect } from "@playwright/test";

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("mounts one canvas and hands images to it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator("[data-gl-image]").first()).toHaveAttribute("data-gl", "ready", { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test("webgl hero image is actually drawn after the intro", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  await page.goto("/");
  await expect(page.locator("[data-gl-image]").first()).toHaveAttribute("data-gl", "ready", { timeout: 15_000 });
  await page.waitForTimeout(5500); // intro signal (<=3s) + reveal (1.8s)
  const box = (await page.locator("[data-gl-image]").first().boundingBox())!;
  const shot = await page.screenshot({ clip: { x: box.x + box.width * 0.3, y: 40, width: box.width * 0.4, height: 300 } });
  const { channels } = await sharp(shot).stats();
  const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  expect(mean).toBeGreaterThan(45); // base colour is ~22; the stone photo is far brighter
});
