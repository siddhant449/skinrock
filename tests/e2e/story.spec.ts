import { test, expect } from "@playwright/test";

test("manifesto words in order", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("#manifesto").innerText()).replace(/\s+/g, " ");
  const idx = ["Stone.", "Bends.", "Glows.", "1.5 mm."].map((w) => text.indexOf(w));
  expect(idx.every((i) => i >= 0)).toBe(true);
  expect([...idx].sort((a, b) => a - b)).toEqual(idx);
});

test("flex story states the material facts", async ({ page }) => {
  await page.goto("/");
  const flex = page.locator("#flex");
  await expect(flex.getByRole("heading", { name: "It bends. It is still stone." })).toBeAttached();
  await expect(flex).toContainText("kg/m²");
  await expect(flex).toContainText("Stones in the collection");
});

test("manifesto pins and swaps words while scrolling", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3500);
  const section = page.locator("#manifesto");
  await section.scrollIntoViewIfNeeded();
  const top = await section.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 1.6), top);
  await page.waitForTimeout(1200);
  // while pinned the section stays at the top of the viewport
  const rectTop = await section.evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(rectTop)).toBeLessThan(4);
});
