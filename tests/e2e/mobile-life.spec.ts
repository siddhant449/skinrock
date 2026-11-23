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

test("hero: the stone sits in a window, then scrolling opens it to full screen while the copy arrives", async ({ page }) => {
  await intro(page);
  await page.waitForTimeout(1500);
  const state = () =>
    page.locator("#hero").evaluate((hero) => {
      const win = hero.querySelector("[data-hero-window]")!;
      const lede = hero.querySelector("[data-hero-lede]")!;
      const r = win.getBoundingClientRect();
      return {
        clip: getComputedStyle(win).clipPath,
        lede: Number(getComputedStyle(lede).opacity),
        pinned: !!hero.parentElement?.classList.contains("pin-spacer"),
        drift: getComputedStyle(hero.querySelector("[data-gl-image]")!).animationName,
        winTop: r.top,
      };
    });
  const start = await state();
  expect(start.clip).toContain("round"); // a framed window, not full bleed
  expect(start.clip).not.toMatch(/^inset\(0(px|%)?\)/);
  expect(start.lede).toBeLessThan(0.1); // the paragraph waits for the scroll
  expect(start.pinned).toBe(true);
  expect(start.drift).not.toBe("none");
  await scrollToY(page, 844 * 0.85);
  const open = await state();
  expect(open.clip).toMatch(/inset\(0(px|%)?( 0(px|%)?){0,3}( round 0px)?\)|none/);
  expect(open.lede).toBeGreaterThan(0.9);
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

test("why choose us becomes a pinned stepper on phones: one reason at a time, the key list follows", async ({ page }) => {
  await intro(page);
  expect(await page.locator("#why").evaluate((el) => el.parentElement!.classList.contains("pin-spacer"))).toBe(true);
  const top = await spacerTop(page, "why");
  const state = () =>
    page.locator("#why").evaluate((el) => {
      const cards = [...el.querySelectorAll<HTMLElement>("[data-why-cell]")];
      const shown = cards.map((c) => !getComputedStyle(c).clipPath.includes("inset(100%"));
      const keys = [...el.querySelectorAll("[data-why-key]")].map((k) => k.hasAttribute("data-on"));
      // the top-most revealed card is the one on screen
      return { front: shown.lastIndexOf(true), on: keys.indexOf(true), lit: keys.filter(Boolean).length, keys: keys.length };
    });
  await scrollToY(page, top + 10);
  const first = await state();
  expect(first).toMatchObject({ front: 0, on: 0, lit: 1, keys: 7 });
  await scrollToY(page, top + 844 * 1.6);
  const later = await state();
  expect(later.front).toBeGreaterThan(1);
  expect(later.on).toBe(later.front);
  expect(later.lit).toBe(1);
});

test("light: the backlit stone opens from a window to full width while the lamp switches on", async ({ page }) => {
  await intro(page);
  const photo = page.locator("#light [data-backlight]");
  const top = await photo.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const state = () =>
    photo.evaluate((el) => ({
      clip: getComputedStyle(el).clipPath,
      glow: Number(getComputedStyle(el.querySelector(".backlight-fallback")!).opacity),
    }));
  await scrollToY(page, top - 844 * 0.85);
  const before = await state();
  await scrollToY(page, top - 844 * 0.15);
  const after = await state();
  expect(before.clip).toMatch(/inset\((?!0px 0px 0px 0px|0%)/); // still a window
  expect(after.clip).toMatch(/inset\(0(px|%)? ?(0(px|%)? ?){0,3}(round 0px)?\)|none/); // full width
  expect(after.glow - before.glow).toBeGreaterThan(0.4);
});

test("intro paragraphs fill word by word as you read down (Riotters)", async ({ page }) => {
  await intro(page);
  const para = page.locator("#collection [data-scroll-fill]");
  const top = await para.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const words = () => para.evaluate((el) => [...el.querySelectorAll<HTMLElement>("div, span")].map((w) => Number(getComputedStyle(w).opacity)));
  await scrollToY(page, top - 844 * 0.88);
  const early = await words();
  await scrollToY(page, top - 844 * 0.3);
  const late = await words();
  expect(early.length).toBeGreaterThan(8);
  expect(Math.min(...early)).toBeLessThan(0.6);
  expect(Math.min(...late)).toBeGreaterThan(0.9);
});

test("cream chapters rise as an arched sheet that flattens as it lands, over a receding dark chapter (ERA)", async ({ page }) => {
  await intro(page);
  for (const [b, a] of [["collection", "light"], ["proof", "why"]] as const) {
    const top = await page.locator(`#${b}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const radius = () => page.locator(`#${b}`).evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius.split(" ").pop()!));
    const recede = () => page.locator(`#${a}`).evaluate((el) => Number(getComputedStyle(el, "::after").opacity));
    await scrollToY(page, top - 844 * 0.95);
    const arched = await radius();
    await scrollToY(page, top - 844 * 0.12);
    const almost = await recede();
    await scrollToY(page, top + 2);
    const landed = await radius();
    expect(arched, b).toBeGreaterThan(40); // a real arch while it rises
    expect(landed, b).toBeLessThan(4); // flat once it has landed
    expect(almost, a).toBeGreaterThan(0.25); // the chapter underneath steps back
  }
});

test("the lab results print row by row as you read (White Desert ink)", async ({ page }) => {
  await intro(page);
  const rows = page.locator("#proof [data-cell]");
  const firstTop = await rows.first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollToY(page, firstTop - 844 * 0.45); // the first row has passed the reading line
  const s = await rows.evaluateAll((els) =>
    els.map((e) => ({ top: e.getBoundingClientRect().top / innerHeight, ink: Number(getComputedStyle(e.querySelector("dd")!).opacity), line: getComputedStyle(e).backgroundSize })),
  );
  const printed = s.filter((r) => r.top < 0.55);
  const waiting = s.filter((r) => r.top > 1.0);
  expect(printed.length).toBeGreaterThan(0);
  expect(waiting.length).toBeGreaterThan(0);
  expect(Math.min(...printed.map((r) => r.ink))).toBeGreaterThan(0.9);
  expect(Math.max(...waiting.map((r) => r.ink))).toBeLessThan(0.35);
  expect(printed[0].line.startsWith("100%")).toBe(true);
});
