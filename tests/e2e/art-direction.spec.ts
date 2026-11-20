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

test("flex figures hand over one after the other: never two visible at once", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.waitForTimeout(3500);
  const flex = page.locator("#flex");
  const top = await flex.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  // densely through both handovers (at 0.36 and 0.68 of the pin, 0.12 long)
  const points = [0.36, 0.68].flatMap((at) => Array.from({ length: 9 }, (_, i) => at + i * 0.015));
  for (const f of points) {
    await settleAt(page, top + 900 * 1.6 * f);
    const visible = await flex.locator("[data-figure]").evaluateAll(
      (els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.02).length,
    );
    expect(visible, `pin ${f.toFixed(2)}`).toBeLessThanOrEqual(1);
  }
});

test("flex figures never pile up, even if the scroll animation's inline styles are lost", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(3500);
  const figures = page.locator("#flex [data-figure]");
  // what a hot reload or a torn-down timeline leaves behind: no inline styles at all
  await figures.evaluateAll((els) => els.forEach((e) => e.removeAttribute("style")));
  const shown = await figures.evaluateAll((els) =>
    els.filter((e) => {
      const cs = getComputedStyle(e);
      return cs.visibility !== "hidden" && Number(cs.opacity) > 0.1;
    }).length,
  );
  expect(shown).toBe(1);
});

test("why chapter has a quiet silk light behind the grid", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#why [data-silk]")).toBeAttached();
});
