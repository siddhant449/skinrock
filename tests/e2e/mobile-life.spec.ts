import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function intro(page: Page) {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
}
async function scrollToY(page: Page, y: number) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(800);
}
const spacerTop = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((el) => {
    const host = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
    return host.getBoundingClientRect().top + window.scrollY;
  });

test("hero: the photo owns the screen, the copy gathers at the bottom, and the photo drifts", async ({ page }) => {
  await intro(page);
  const s = await page.locator("#hero").evaluate((hero) => {
    const lede = hero.querySelector("[data-hero-fade]")!.getBoundingClientRect();
    const h1 = hero.querySelector("h1")!.getBoundingClientRect();
    const photo = hero.querySelector("[data-gl-image]")!;
    return { ledeTop: lede.top / innerHeight, ledeAboveH1: lede.bottom <= h1.top + 2, drift: getComputedStyle(photo).animationName };
  });
  expect(s.ledeTop).toBeGreaterThan(0.38);
  expect(s.ledeAboveH1).toBe(true);
  expect(s.drift).not.toBe("none");
  await expect(page.locator("#hero [data-hero-sheen]")).toHaveCount(1);
});

test("manifesto pins on phones and its words melt into each other", async ({ page }) => {
  test.setTimeout(90_000);
  await intro(page);
  const top = await spacerTop(page, "manifesto");
  expect(await page.locator("#manifesto").evaluate((el) => el.parentElement!.classList.contains("pin-spacer"))).toBe(true);
  let melted = false;
  for (let f = 0.3; f <= 1.2 && !melted; f += 0.05) {
    await scrollToY(page, top + 844 * f);
    melted = await page.locator("#manifesto").evaluate((el) => {
      const partial = [...el.querySelectorAll("[data-word]")].filter((w) => {
        const o = Number(getComputedStyle(w).opacity);
        return o > 0.08 && o < 0.92;
      }).length;
      return partial >= 2 && getComputedStyle(el.querySelector("[data-morph]")!).filter.includes("url(");
    });
  }
  expect(melted).toBe(true);
});

test("flex pins on phones and the stone sheet really curls as you scroll", async ({ page }) => {
  await intro(page);
  expect(await page.locator("#flex").evaluate((el) => el.parentElement!.classList.contains("pin-spacer"))).toBe(true);
  const strips = page.locator("#flex [data-bend-strip]");
  expect(await strips.count()).toBeGreaterThanOrEqual(12);
  const outer = () => strips.last().evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m13);
  const top = await spacerTop(page, "flex");
  await scrollToY(page, top + 10);
  const flat = await outer();
  await scrollToY(page, top + 844 * 1.4);
  const curled = await outer();
  expect(Math.abs(curled - flat)).toBeGreaterThan(0.05);
  // the curled sheet stays clear of the title and the body copy
  const hit = await page.locator("#flex").evaluate((el) => {
    const sheet = el.querySelector("[data-bend-dom]")!.getBoundingClientRect();
    return [el.querySelector("h2")!, el.querySelector("p")!].some((n) => {
      const r = n.getBoundingClientRect();
      return sheet.right > r.left && sheet.left < r.right && sheet.bottom > r.top && sheet.top < r.bottom;
    });
  });
  expect(hit).toBe(false);
});
