import { test, expect } from "@playwright/test";

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the manifesto shows one word with its own note at a time, the note under the word", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3500);
    const s = await page.locator("#manifesto").evaluate((root) => {
      const vis = (el: Element) => Number(getComputedStyle(el).opacity) > 0.5;
      const words = [...root.querySelectorAll("[data-word]")];
      const notes = [...root.querySelectorAll("[data-note]")];
      const w = words.findIndex(vis);
      const n = notes.findIndex(vis);
      return {
        words: words.filter(vis).length,
        same: w === n,
        below: notes[n].getBoundingClientRect().top >= words[w].getBoundingClientRect().bottom - 4,
      };
    });
    expect(s).toEqual({ words: 1, same: true, below: true });
  });
});

test("projects statement has a protective backdrop above the drifting photos", async ({ page }) => {
  await page.goto("/");
  const backdrop = page.locator("#projects [data-statement-backdrop]");
  await expect(backdrop).toHaveCount(1);
  // drawn above the WebGL canvas (z-10) and below the text (z-20)
  const z = await backdrop.evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(z).toBeGreaterThan(10);
  expect(z).toBeLessThan(20);
});
