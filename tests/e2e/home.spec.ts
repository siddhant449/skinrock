import { test, expect } from "@playwright/test";

test("home responds with Skinrock title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Skinrock/);
});
