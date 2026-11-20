import { test, expect, type Page } from "@playwright/test";

/** For every SplitText word mask: does any glyph's ink extend past the mask's clipping box? */
async function clippedWords(page: Page) {
  return page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>(".sr-word-mask").forEach((mask) => {
      const word = mask.firstElementChild as HTMLElement | null;
      if (!word || !word.textContent?.trim()) return;
      const cs = getComputedStyle(word);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing;
      const m = ctx.measureText(word.textContent);
      const wr = word.getBoundingClientRect();
      const mr = mask.getBoundingClientRect();
      // ink extents relative to the text origin (left edge of the word box)
      const inkLeft = wr.left - m.actualBoundingBoxLeft;
      const inkRight = wr.left + m.actualBoundingBoxRight;
      if (inkRight > mr.right + 0.5 || inkLeft < mr.left - 0.5) {
        out.push(`${word.textContent} (${(inkRight - mr.right).toFixed(1)}px)`);
      }
    });
    return out;
  });
}

async function revealAll(page: Page) {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
  // scroll through so every heading has split
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  expect(await page.locator(".sr-word-mask").count()).toBeGreaterThan(20);
}

test("no heading glyph is clipped by its reveal mask on desktop", async ({ page }) => {
  test.setTimeout(90_000);
  await revealAll(page);
  expect(await clippedWords(page)).toEqual([]);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("no heading glyph is clipped by its reveal mask on phones", async ({ page }) => {
    test.setTimeout(90_000);
    await revealAll(page);
    expect(await clippedWords(page)).toEqual([]);
  });
});
