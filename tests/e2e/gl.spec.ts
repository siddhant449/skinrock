import { test, expect } from "@playwright/test";
import { wakeWebGL } from "./helpers";

// software WebGL on a dev server is slow, especially with parallel workers
test.describe.configure({ timeout: 60_000 });

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("mounts one canvas and hands images to it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await wakeWebGL(page);
  await expect(page.locator("[data-gl-image]").first()).toHaveAttribute("data-gl", "ready", { timeout: 25_000 });
  expect(errors).toEqual([]);
});

test("webgl hero image is actually drawn after the intro", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  await page.goto("/");
  await wakeWebGL(page);
  await expect(page.locator("[data-gl-image]").first()).toHaveAttribute("data-gl", "ready", { timeout: 25_000 });
  await page.waitForTimeout(2500); // reveal (1.8s) settles
  const box = (await page.locator("[data-gl-image]").first().boundingBox())!;
  const shot = await page.screenshot({ clip: { x: box.x + box.width * 0.3, y: 40, width: box.width * 0.4, height: 300 } });
  const { channels } = await sharp(shot).stats();
  const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  expect(mean).toBeGreaterThan(45); // base colour is ~22; the stone photo is far brighter
});
