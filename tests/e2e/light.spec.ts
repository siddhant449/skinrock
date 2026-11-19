import { test, expect } from "@playwright/test";
import { wakeWebGL } from "./helpers";

// software WebGL on a dev server is slow, especially with parallel workers
test.describe.configure({ timeout: 60_000 });

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("light chapter copy and backlit stone", async ({ page }) => {
  await page.goto("/");
  const light = page.locator("#light");
  await expect(light.getByRole("heading", { name: "Lit from within." })).toBeAttached();
  await expect(light).toContainText("Backlit, the stone stops being a surface and becomes the lamp.");
  await expect(light.locator("[data-backlight]")).toBeAttached();
  await expect(light).toContainText("Ceilings");
});

test("backlight brightens as the chapter scrolls", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  await page.goto("/");
  await wakeWebGL(page);
  await page.waitForTimeout(2000);
  const meanAt = async (f: number) => {
    const y = await page.evaluate((ff) => {
      const el = document.getElementById("light")!;
      const sp = el.parentElement!.classList.contains("pin-spacer") ? el.parentElement! : el;
      return sp.getBoundingClientRect().top + scrollY + innerHeight * ff;
    }, f);
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(1500);
    const box = (await page.locator("#light [data-backlight]").boundingBox())!;
    const shot = await page.screenshot({ clip: { x: box.x + box.width * 0.2, y: Math.max(box.y, 0) + 80, width: box.width * 0.6, height: 300 } });
    const { channels } = await sharp(shot).stats();
    return (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  };
  const dark = await meanAt(0.0);
  const lit = await meanAt(1.1);
  expect(lit).toBeGreaterThan(dark * 1.6);
});
