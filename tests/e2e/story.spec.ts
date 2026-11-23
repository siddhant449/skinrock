import { test, expect } from "@playwright/test";

test("manifesto words in order", async ({ page }) => {
  await page.goto("/");
  // screen readers get the whole statement even while the morph shows one word at a time
  const text = (await page.locator("#manifesto .sr-only").textContent())!.replace(/\s+/g, " ");
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

test("manifesto words melt into each other (Originkit text morph) the moment you pass them, and never rest half melted", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.waitForTimeout(3500);
  const section = page.locator("#manifesto");
  const top = await section.evaluate((el) => {
    const host = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
    return host.getBoundingClientRect().top + window.scrollY;
  });
  const vh = 900;
  const read = () =>
    section.evaluate((el) => {
      const ops = [...el.querySelectorAll<HTMLElement>("[data-word]")].map((w) => Number(getComputedStyle(w).opacity));
      const notes = [...el.querySelectorAll<HTMLElement>("[data-note]")].map((n) => Number(getComputedStyle(n).opacity));
      return {
        partial: ops.filter((o) => o > 0.08 && o < 0.92).length,
        full: ops.filter((o) => o >= 0.99).length,
        filter: getComputedStyle(el.querySelector<HTMLElement>("[data-morph]")!).filter,
        notes: Math.max(...notes),
      };
    });
  await page.evaluate((y) => window.scrollTo(0, y), top + vh * 0.1);
  await page.waitForTimeout(1200);
  // passing the first word plays the melt straight away: catch it part way, fused through the
  // threshold, with the small notes out of its way
  await page.evaluate((y) => window.scrollTo(0, y), top + vh * 1.0);
  let melt: Awaited<ReturnType<typeof read>> | undefined;
  for (let k = 0; k < 16 && !melt; k++) {
    await page.waitForTimeout(40);
    const r = await read();
    if (r.partial >= 2) melt = r;
  }
  expect(melt).toBeTruthy();
  expect(melt!.filter).toContain("url(");
  expect(melt!.notes).toBeLessThan(0.05);
  // wherever the reader stops, one crisp word stands with no filter
  for (let f = 0.3; f <= 3.2; f += 0.1) {
    await page.evaluate((y) => window.scrollTo(0, y), top + vh * f);
    await page.waitForTimeout(1100);
    const r = await read();
    expect({ partial: r.partial, full: r.full, filter: r.filter }, `stopped ${f.toFixed(1)} screens in`).toEqual({ partial: 0, full: 1, filter: "none" });
  }
});
