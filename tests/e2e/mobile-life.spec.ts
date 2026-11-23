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

test("hero: a full-bleed stone poster, Skin above and rock below, that parts as you scroll while the copy arrives", async ({ page }) => {
  await intro(page);
  await page.waitForTimeout(1800);
  const state = () =>
    page.locator("#hero").evaluate((hero) => {
      const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
      const win = hero.querySelector("[data-hero-window]")!;
      return {
        clip: getComputedStyle(win).clipPath,
        photo: box(win),
        skin: box(hero.querySelector('[data-hero-word="skin"]')!),
        rock: box(hero.querySelector('[data-hero-word="rock"]')!),
        title: box(hero.querySelector("h1")!),
        lede: Number(getComputedStyle(hero.querySelector("[data-hero-lede]")!).opacity),
        pinned: !!hero.parentElement?.classList.contains("pin-spacer"),
        w: innerWidth,
        h: innerHeight,
      };
    });
  const start = await state();
  // full bleed from the first frame: no framed card
  expect(start.clip === "none" || /^inset\(0(px|%)?\)/.test(start.clip)).toBe(true);
  expect(start.photo.width).toBeGreaterThanOrEqual(start.w - 1);
  expect(start.photo.height).toBeGreaterThanOrEqual(start.h - 1);
  // the name runs edge to edge, Skin at the top and rock at the bottom
  expect(start.skin.width).toBeGreaterThan(start.w * 0.85);
  expect(start.rock.width).toBeGreaterThan(start.w * 0.85);
  expect(start.skin.bottom).toBeLessThan(start.h * 0.35);
  expect(start.rock.top).toBeGreaterThan(start.h * 0.65);
  // the headline sits between them, clear of both
  expect(start.title.top).toBeGreaterThan(start.skin.bottom);
  expect(start.title.bottom).toBeLessThan(start.rock.top);
  expect(start.lede).toBeLessThan(0.1);
  expect(start.pinned).toBe(true);
  await scrollToY(page, 844 * 0.85);
  const open = await state();
  // the words part to let the copy through
  expect(open.skin.top).toBeLessThan(start.skin.top - 60);
  expect(open.rock.top).toBeGreaterThan(start.rock.top + 60);
  expect(open.lede).toBeGreaterThan(0.9);
  await expect(page.locator("#hero [data-hero-sheen]")).toHaveCount(1);
});

test("manifesto pins on phones; each word melts into the next as you pass it, and it never rests half melted", async ({ page }) => {
  test.setTimeout(90_000);
  await intro(page);
  const top = await spacerTop(page, "manifesto");
  expect(await page.locator("#manifesto").evaluate((el) => el.parentElement!.classList.contains("pin-spacer"))).toBe(true);
  const read = () =>
    page.locator("#manifesto").evaluate((el) => {
      const ops = [...el.querySelectorAll("[data-word]")].map((w) => Number(getComputedStyle(w).opacity));
      return {
        partial: ops.filter((o) => o > 0.08 && o < 0.92).length,
        full: ops.filter((o) => o >= 0.99).length,
        filter: getComputedStyle(el.querySelector("[data-morph]")!).filter,
      };
    });
  await page.evaluate((v) => window.scrollTo(0, v), top + 844 * 0.1);
  await page.waitForTimeout(900);
  // passing the first word plays the melt into the next: catch it part way
  await page.evaluate((v) => window.scrollTo(0, v), top + 844 * 0.7);
  let melted = false;
  for (let k = 0; k < 16 && !melted; k++) {
    await page.waitForTimeout(40);
    const r = await read();
    melted = r.partial >= 2 && r.filter.includes("url(");
  }
  expect(melted).toBe(true);
  // wherever the reader stops, one word stands crisp: never a frozen half melt
  for (let f = 0.3; f <= 1.31; f += 0.05) {
    await page.evaluate((v) => window.scrollTo(0, v), top + 844 * f);
    await page.waitForTimeout(1100);
    expect(await read(), `stopped ${f.toFixed(2)} screens in`).toEqual({ partial: 0, full: 1, filter: "none" });
  }
});

test("manifesto words fill the phone screen, edge to edge, without running off it", async ({ page }) => {
  await intro(page);
  const widths = await page.locator("#manifesto [data-word]").evaluateAll((els) => els.map((w) => (w as HTMLElement).offsetWidth));
  expect(Math.max(...widths)).toBeGreaterThan(390 * 0.8);
  expect(Math.max(...widths)).toBeLessThanOrEqual(390 - 2 * 16);
  expect(Math.min(...widths)).toBeGreaterThan(390 * 0.6);
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

test("why choose us becomes a pinned stepper on phones: one reason at a time, nothing at the foot for the next chapter to cover", async ({ page }) => {
  await intro(page);
  expect(await page.locator("#why").evaluate((el) => el.parentElement!.classList.contains("pin-spacer"))).toBe(true);
  // each card names its reason in large type; no wrapping strip of keywords
  expect(await page.locator("#why [data-why-key]").count()).toBe(0);
  const top = await spacerTop(page, "why");
  const state = () =>
    page.locator("#why").evaluate((el) => {
      const cards = [...el.querySelectorAll<HTMLElement>("[data-why-cell]")];
      const shown = cards.map((c) => !getComputedStyle(c).clipPath.includes("inset(100%"));
      const front = shown.lastIndexOf(true);
      const copy = [...cards[front].querySelectorAll("[data-why-step-copy]")].map((c) => c.getBoundingClientRect().bottom);
      return { front, copyBottom: Math.max(...copy), h: innerHeight };
    });
  await scrollToY(page, top + 10);
  expect((await state()).front).toBe(0);
  await scrollToY(page, top + 844 * 1.6);
  const later = await state();
  expect(later.front).toBeGreaterThan(1);
  // the cream chapter rises over the last tenth of the screen: no words live there
  expect(later.copyBottom).toBeLessThan(later.h * 0.9);
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

test("lab results rise in row by row as they arrive, and their rules are always whole (no stubs)", async ({ page }) => {
  await intro(page);
  const rows = page.locator("#proof [data-cell]");
  const firstTop = await rows.first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const read = () =>
    rows.evaluateAll((els) =>
      els.map((e) => ({
        top: e.getBoundingClientRect().top / innerHeight,
        ink: Number(getComputedStyle(e.querySelector("dd")!).opacity),
        line: getComputedStyle(e).backgroundSize,
      })),
    );
  for (const f of [0.95, 0.7, 0.45]) {
    await scrollToY(page, firstTop - 844 * f);
    for (const r of await read()) expect(r.line.startsWith("100%")).toBe(true); // never a partial rule
  }
  const s = await read();
  const arrived = s.filter((r) => r.top < 0.6);
  const waiting = s.filter((r) => r.top > 1.05);
  expect(arrived.length).toBeGreaterThan(0);
  expect(waiting.length).toBeGreaterThan(0);
  expect(Math.min(...arrived.map((r) => r.ink))).toBeGreaterThan(0.95);
  expect(Math.max(...waiting.map((r) => r.ink))).toBeLessThan(0.05);
});

test("light on phones: the backlit stone is framed below the site clutter, and its uses sit on one line", async ({ page }) => {
  await intro(page);
  const r = await page.locator("#light").evaluate((el) => ({
    pos: getComputedStyle(el.querySelector("[data-backlight] img")!).objectPosition,
    tops: [...el.querySelectorAll("[data-use]")].map((u) => Math.round(u.getBoundingClientRect().top)),
  }));
  expect(new Set(r.tops).size).toBe(1);
  // the top of the shot has a plastic sheet and a track light: frame the lower part of the column
  expect(parseFloat(r.pos.split(" ")[1])).toBeGreaterThanOrEqual(70);
});

test.describe("sharp photos", () => {
  test.use({ deviceScaleFactor: 2 });
  test("each photo is fetched wide enough for how it is cropped on a phone screen", async ({ page }) => {
    await intro(page);
    // photos load lazily: bring each one on screen, then read which file the browser chose
    const file = async (sel: string) => {
      const img = page.locator(sel).first();
      const y = await img.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      await scrollToY(page, Math.max(0, y - 200));
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && !!el.currentSrc), { timeout: 8000 }).toBe(true);
      return img.evaluate((el: HTMLImageElement) => Number(el.currentSrc.match(/-(\d+)\.webp/)?.[1] ?? 0));
    };
    expect(await file("#hero [data-gl-image] img")).toBeGreaterThanOrEqual(1920);
    expect(await file("#why [data-why-photo] img")).toBeGreaterThanOrEqual(1080);
    expect(await file("#projects [data-rail-track] img")).toBeGreaterThanOrEqual(1080);
    expect(await file("#light [data-backlight] img")).toBeGreaterThanOrEqual(1080);
  });
});
