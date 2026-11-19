import { expect, type Page } from "@playwright/test";

/** Wait for the intro to finish, then act like a visitor so WebGL is allowed to load. */
export async function wakeWebGL(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
  await page.mouse.move(700, 400);
  await page.mouse.move(720, 420);
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 30_000 });
}
