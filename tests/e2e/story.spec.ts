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

test("manifesto words melt into each other (Originkit text morph), crisp at rest", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.waitForTimeout(3500);
  const section = page.locator("#manifesto");
  const top = await section.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const vh = 900;
  const samples: { words: number; partial: number; filter: string; notes: number }[] = [];
  for (let f = 0.05; f <= 3.4; f += 0.1) {
    for (let k = 0; k < 4; k++) {
      await page.evaluate((y) => window.scrollTo(0, y), top + vh * f);
      await page.waitForTimeout(160);
    }
    await page.waitForTimeout(900);
    samples.push(
      await section.evaluate((el) => {
        const ops = [...el.querySelectorAll<HTMLElement>("[data-word]")].map((w) => Number(getComputedStyle(w).opacity));
        const notes = [...el.querySelectorAll<HTMLElement>("[data-note]")].map((n) => Number(getComputedStyle(n).opacity));
        const box = el.querySelector<HTMLElement>("[data-morph]")!;
        return {
          words: ops.filter((o) => o > 0.02).length,
          partial: ops.filter((o) => o > 0.08 && o < 0.92).length,
          filter: getComputedStyle(box).filter,
          notes: Math.max(...notes),
        };
      }),
    );
  }
  const melting = samples.filter((s) => s.partial >= 2);
  // the words really overlap and fuse mid-switch
  expect(melting.length).toBeGreaterThan(0);
  for (const s of melting) {
    expect(s.filter).toContain("url(");
    expect(s.notes).toBeLessThan(0.05); // small text never goes through the threshold
  }
  // at rest: one crisp word, no filter
  const resting = samples.filter((s) => s.words === 1);
  expect(resting.length).toBeGreaterThan(5);
  for (const s of resting) expect(s.filter).toBe("none");
});
