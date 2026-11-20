import { test, expect, type Page } from "@playwright/test";

/** Settle Lenis at an absolute scroll position (it overrides scrollTo while animating). */
async function settleAt(page: Page, y: number) {
  for (let k = 0; k < 6; k++) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(700);
}

const ORDER = ["manifesto", "flex", "light", "collection", "projects", "why", "proof", "samples", "footer"];

test("section grounds alternate: no two neighbouring chapters share one flat colour", async ({ page }) => {
  await page.goto("/");
  const grounds = await page.evaluate(
    (ids) => ids.map((id) => getComputedStyle(document.getElementById(id)!).backgroundColor),
    ORDER,
  );
  // every chapter paints its own ground (no transparent sections falling back to the body blue)
  grounds.forEach((g, i) => expect(g, ORDER[i]).not.toBe("rgba(0, 0, 0, 0)"));
  for (let i = 1; i < grounds.length; i++) {
    expect(grounds[i], `${ORDER[i - 1]} -> ${ORDER[i]}`).not.toBe(grounds[i - 1]);
  }
  // palette grounds only: cream, ink and deep
  expect(new Set(grounds).size).toBeGreaterThanOrEqual(3);
  await expect(page.locator("#manifesto")).toHaveAttribute("data-theme", "cream");
});

test("no progress lines in the flex and light chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#flex [data-flex-rule]")).toHaveCount(0);
  await expect(page.locator("#light [data-switch]")).toHaveCount(0);
});

test("flex chapter shows one figure at a time inside a tick dial", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3500);
  const flex = page.locator("#flex");
  await expect(flex.locator("[data-dial] [data-tick]").first()).toBeAttached();
  const figures = flex.locator("[data-figure]");
  await expect(figures).toHaveCount(3);

  const top = await flex.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const shown = async () =>
    figures.evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity) > 0.5));

  await settleAt(page, top + 10);
  expect(await shown()).toEqual([true, false, false]);
  await settleAt(page, top + 900 * 1.55);
  expect(await shown()).toEqual([false, false, true]);
  // the last figure has counted all the way up
  await expect(figures.nth(2)).toContainText("42");
});

test("why chapter has a quiet silk light behind the grid", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#why [data-silk]")).toBeAttached();
});
