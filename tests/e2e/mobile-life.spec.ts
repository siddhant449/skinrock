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

// real phones show less than the full screen: Safari's bars leave about 550 to 660px
for (const [w, h] of [
  [390, 844],
  [390, 664],
  [375, 553],
  [360, 640],
  [430, 740],
] as const) {
  test(`hero at ${w}x${h}: a full-bleed stone photo, the headline at its foot, the paragraph arriving as it lifts`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await intro(page);
    await page.waitForTimeout(1600);
    const state = () =>
      page.locator("#hero").evaluate((hero) => {
        const box = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
        return {
          photo: box(hero.querySelector("[data-hero-window]")!),
          title: box(hero.querySelector("[data-hero-title]")!),
          lede: box(hero.querySelector("[data-hero-lede]")!),
          eyebrow: box(hero.querySelector("[data-hero-eyebrow]")!),
          ledeShown: Number(getComputedStyle(hero.querySelector("[data-hero-lede]")!).opacity),
          navBottom: document.querySelector("header")!.getBoundingClientRect().bottom,
          words: hero.querySelectorAll("[data-hero-word]").length,
          pinned: !!hero.parentElement?.classList.contains("pin-spacer"),
          vw: innerWidth,
          vh: innerHeight,
        };
      });
    const rest = await state();
    expect(rest.words).toBe(0); // no split name over the photo
    expect(rest.photo.width).toBeGreaterThanOrEqual(rest.vw - 1);
    expect(rest.photo.height).toBeGreaterThanOrEqual(rest.vh - 1);
    // the headline rests at the foot, wholly on screen and clear of the menu bar
    expect(rest.title.bottom).toBeLessThanOrEqual(rest.vh);
    expect(rest.title.bottom).toBeGreaterThan(rest.vh * 0.75);
    expect(rest.title.top).toBeGreaterThan(rest.navBottom);
    expect(rest.ledeShown).toBeLessThan(0.1);
    expect(rest.pinned).toBe(true);
    await scrollToY(page, h * 0.85);
    const open = await state();
    expect(open.ledeShown).toBeGreaterThan(0.9);
    // headline, then the label, then the paragraph: nothing overlaps and all of it is on screen
    expect(open.eyebrow.top).toBeGreaterThanOrEqual(open.title.bottom - 1);
    expect(open.lede.top).toBeGreaterThanOrEqual(open.eyebrow.bottom - 1);
    expect(open.lede.bottom).toBeLessThanOrEqual(open.vh);
    expect(open.title.top).toBeGreaterThan(Math.max(0, open.navBottom) - 1);
  });
}

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

for (const [w, h] of [
  [375, 553],
  [360, 640],
  [390, 664],
] as const) {
  test(`flex at ${w}x${h}: the stone sheet keeps clear of the copy and the figures, and nothing is cut off`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await intro(page);
    const top = await spacerTop(page, "flex");
    for (const f of [0.05, 0.5, 1.0, 1.5]) {
      await scrollToY(page, top + h * f);
      const r = await page.locator("#flex").evaluate((el) => {
        const sheet = el.querySelector(".bend-dom")!.getBoundingClientRect();
        const copy = [el.querySelector("p")!, ...el.querySelectorAll("[data-figure]")]
          .filter((n) => Number(getComputedStyle(n).opacity) > 0.5)
          .map((n) => n.getBoundingClientRect());
        const overlap = (a: DOMRect, b: DOMRect) =>
          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
        return { hits: copy.filter((b) => overlap(sheet, b)).length, sheetH: sheet.height, bottom: Math.max(...copy.map((b) => b.bottom)), vh: innerHeight };
      });
      expect(r.hits, `sheet over the copy ${f} screens in`).toBe(0);
      expect(r.sheetH, `a real sheet, not a sliver, ${f} screens in`).toBeGreaterThan(80);
      expect(r.bottom, `nothing cut off ${f} screens in`).toBeLessThanOrEqual(r.vh);
    }
  });
}

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
    // the arch is a cream cap riding on the sheet's top edge; the chapter underneath dims under a veil
    const arch = () => page.locator(`#${b} [data-sheet-cap]`).evaluate((el) => el.getBoundingClientRect().height);
    const recede = () => page.locator(`#${a} [data-sheet-veil]`).evaluate((el) => Number(getComputedStyle(el).opacity));
    await scrollToY(page, top - 844 * 0.95);
    const arched = await arch();
    await scrollToY(page, top - 844 * 0.12);
    const almost = await recede();
    await scrollToY(page, top + 2);
    const landed = await arch();
    expect(arched, b).toBeGreaterThan(40); // a real arch while it rises
    expect(landed, b).toBeLessThan(4); // flat once it has landed
    expect(almost, a).toBeGreaterThan(0.25); // the chapter underneath steps back
  }
});

test("scrolling never rewrites style variables on whole chapters (each change would restyle the chapter)", async ({ page }) => {
  await intro(page);
  await page.evaluate(() => {
    const w = window as unknown as { varWrites: string[] };
    w.varWrites = [];
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        const el = m.target as HTMLElement;
        if (el.style.cssText.includes("--")) w.varWrites.push(`${el.id}: ${el.style.cssText.slice(0, 60)}`);
      }
    });
    document.querySelectorAll("main > section, main > .pin-spacer > section, footer").forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["style"] }));
  });
  const max = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < max; y += 420) await scrollToY(page, y);
  expect(await page.evaluate(() => (window as unknown as { varWrites: string[] }).varWrites)).toEqual([]);
});

test("touch devices skip the film grain: a moving, blended layer over the whole page costs every frame", async ({ page }) => {
  await intro(page);
  expect(await page.locator(".grain").evaluate((el) => getComputedStyle(el).display)).toBe("none");
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
  const r = await page.locator("#light").evaluate((el) => {
    // where the photo is really drawn: object-fit cover inside the (scaled) image box
    const frame = el.querySelector("[data-backlight]")!.getBoundingClientRect();
    const img = el.querySelector<HTMLImageElement>("[data-backlight] img")!;
    const box = img.getBoundingClientRect();
    const s = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const drawnH = img.naturalHeight * s;
    const posY = parseFloat(getComputedStyle(img).objectPosition.split(" ")[1]) / 100;
    const pictureTop = box.top + (box.height - drawnH) * posY;
    return {
      hiddenTop: (frame.top - pictureTop) / drawnH,
      tops: [...el.querySelectorAll("[data-use]")].map((u) => Math.round(u.getBoundingClientRect().top)),
    };
  });
  expect(new Set(r.tops).size).toBe(1);
  // the top fifth of the shot has a plastic sheet and a track light: it stays outside the frame
  expect(r.hiddenTop).toBeGreaterThanOrEqual(0.2);
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
