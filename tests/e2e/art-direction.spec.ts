import { test, expect, type Page } from "@playwright/test";

/** Settle at an absolute scroll position (pinned chapters re-measure after a jump). */
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


test("the bending sheet never runs into the flex title or body copy", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1854, height: 960 });
  await page.goto("/");
  await page.waitForTimeout(3500);
  await page.mouse.move(900, 500);
  await page.mouse.wheel(0, 200); // wake webgl
  await page.waitForTimeout(3500);
  const flex = page.locator("#flex");
  const top = await flex.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  for (const f of [0, 0.3, 0.6, 0.9]) {
    await settleAt(page, top + 960 * 1.6 * f);
    // hide the copy while sampling its boxes, so any warm pixel left there can only be stone
    const boxes = await flex.evaluate((el) =>
      [el.querySelector("h2")!, el.querySelector("p")!].map((n) => {
        const r = n.getBoundingClientRect();
        (n as HTMLElement).style.visibility = "hidden";
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      }),
    );
    for (const b of boxes) {
      const shot = await page.screenshot({ clip: b });
      // the stone texture is a warm mid tone; the ground behind is dark blue
      const { default: sharp } = await import("sharp");
      const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
      let stone = 0;
      for (let i = 0; i < data.length; i += info.channels) {
        const [r, g, bl] = [data[i], data[i + 1], data[i + 2]];
        if (r > 90 && r < 215 && g > 70 && r - bl > 18) stone++;
      }
      expect(stone / (info.width * info.height), `pin ${f}`).toBeLessThan(0.01);
    }
    await flex.evaluate((el) => el.querySelectorAll<HTMLElement>("h2, p").forEach((n) => (n.style.visibility = "")));
  }
});

test("dark chapters share one studio (the user's reference): beams and a stone floor, toned per section", async ({ page }) => {
  await page.goto("/");
  const studio = (id: string) =>
    page.locator(`#${id} [data-studio]`).evaluate((el) => ({
      beams: el.querySelectorAll("[data-studio-beam]").length,
      floor: el.querySelectorAll("[data-studio-floor]").length,
      behind: Number(getComputedStyle(el).zIndex) <= 0 || getComputedStyle(el).zIndex === "auto",
    }));
  expect(await studio("flex")).toEqual({ beams: 2, floor: 1, behind: true });
  // the user wants Light on its plain single-colour ground: no studio there
  await expect(page.locator("#light [data-studio]")).toHaveCount(0);
  expect(await studio("why")).toMatchObject({ beams: 0, floor: 1 });
  expect(await studio("samples")).toMatchObject({ beams: 0, floor: 1 });
  // the silk light it replaces in Why is gone; nothing in the studio animates
  await expect(page.locator("#why [data-silk]")).toHaveCount(0);
  const animated = await page.locator("[data-studio] *").evaluateAll((els) =>
    els.filter((e) => getComputedStyle(e).animationName !== "none").length,
  );
  expect(animated).toBe(0);
  // the floor photo waits until it is near the viewport
  // the floor never competes with the hero for the first paint: the page is served with it lazy
  // (the intro then fetches it early, with every other photo, once the hero is under way)
  const html = await (await page.request.get("/")).text();
  expect(html).toMatch(/data-studio-floor[\s\S]{0,600}?loading="lazy"/);
});

test("desktop keeps the film grain over the page", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator(".grain").evaluate((el) => getComputedStyle(el).display)).not.toBe("none");
});
