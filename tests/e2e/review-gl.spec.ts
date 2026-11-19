import { test, expect } from "@playwright/test";
import { wakeWebGL } from "./helpers";

test.describe.configure({ timeout: 60_000 });
test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("light and flex photos never go blank while webgl loads", async ({ page }) => {
  await page.goto("/");
  await wakeWebGL(page);
  for (const sel of ["[data-backlight]", "[data-bend]"]) {
    const ok = await page.locator(sel).evaluate((el) => !!el.querySelector("img") || el.getAttribute("data-gl") === "ready");
    expect(ok, sel).toBe(true);
  }
});
