import { test, expect, type Page } from "@playwright/test";

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const TABLET = { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true };

async function intro(page: Page) {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
}

/** Native touch scrolling: set the position and let scroll handlers settle. */
async function scrollToY(page: Page, y: number) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(700);
}

async function topOf(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const host = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
    return host.getBoundingClientRect().top + window.scrollY;
  });
}

test.describe("tablet", () => {
  test.use(TABLET);

  test("the emulated tablet really has no hover", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches || matchMedia("(pointer: coarse)").matches)).toBe(true);
  });

  test("no hover style can stick after a tap: every :hover rule only applies on hover devices", async ({ page }) => {
    await page.goto("/");
    // real phones and iPads keep :hover after a tap; emulation does not, so check the rules themselves
    const unguarded = await page.evaluate(() => {
      const out: string[] = [];
      const walk = (rules: CSSRuleList, guarded: boolean) => {
        for (const r of Array.from(rules)) {
          // style rules first: in modern Chrome they also carry cssRules (CSS nesting)
          if (r instanceof CSSStyleRule) {
            if (r.selectorText.includes(":hover") && !guarded) out.push(r.selectorText);
            if (r.cssRules?.length) walk(r.cssRules, guarded);
          } else if (r instanceof CSSMediaRule) walk(r.cssRules, guarded || /hover:\s*hover/.test(r.conditionText));
          else if ("cssRules" in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules, guarded);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          walk(sheet.cssRules, false);
        } catch {}
      }
      return out;
    });
    expect(unguarded).toEqual([]);
  });
});

for (const [name, device] of [["phone", PHONE], ["tablet", TABLET]] as const) {
  test.describe(`${name}: light`, () => {
    test.use(device);

    test("the backlit stone switches on as you scroll in (no timed breathing)", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#light");
      const glow = () => page.locator("#light .backlight-fallback").evaluate((el) => Number(getComputedStyle(el).opacity));
      await scrollToY(page, top - device.viewport.height * 0.9);
      const off = await glow();
      await scrollToY(page, top + device.viewport.height * (name === "tablet" ? 0.9 : 0.3));
      const on = await glow();
      expect(on - off).toBeGreaterThan(0.4);
      expect(await page.locator("#light .backlight-fallback").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    });
  });
}

for (const [name, device] of [["tablet", TABLET]] as const) {
  test.describe(`${name}: collection and why`, () => {
    test.use(device);

    test("collection shows every stone's thumbnail and activates the row in the middle", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#collection ul");
      await scrollToY(page, top - device.viewport.height * 0.35);
      const rows = page.locator("#collection [data-row]");
      const thumbs = await rows.evaluateAll((els) =>
        els.map((e) => {
          const img = e.querySelector("img");
          return img ? img.getBoundingClientRect().width : 0;
        }),
      );
      expect(thumbs.every((w) => w > 20)).toBe(true);
      await expect.poll(() => page.locator('#collection [data-row][data-active="true"]').count()).toBe(1);
    });

  });
}

for (const [name, device] of [["phone", PHONE], ["tablet", TABLET]] as const) {
  test.describe(`${name}: flex`, () => {
    test.use(device);

    test("the stone sheet turns in 3D as you scroll (no WebGL needed)", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#flex");
      const pose = () =>
        page.locator("#flex [data-bend-dom]").evaluate((el) => getComputedStyle(el).transform);
      await scrollToY(page, top - device.viewport.height * 0.6);
      const before = await pose();
      await scrollToY(page, top + device.viewport.height * (name === "tablet" ? 1.2 : 0.4));
      const after = await pose();
      expect(before).not.toBe("none");
      expect(after).not.toBe(before);
    });
  });
}

for (const [name, device] of [["phone", PHONE], ["tablet", TABLET]] as const) {
  test.describe(`${name}: photos and gallery`, () => {
    test.use(device);

    test("photos wipe in as they enter and drift inside their frame while scrolling", async ({ page }) => {
      await intro(page);
      const img = page.locator("#projects [data-float] img").first();
      const state = () => img.evaluate((el) => ({ clip: getComputedStyle(el).clipPath, transform: getComputedStyle(el).transform }));
      const before = await state();
      expect(before.clip).toContain("polygon(100%"); // hidden behind a slanted edge until it is reached
      const top = await img.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      await scrollToY(page, top - device.viewport.height * 0.5);
      await page.waitForTimeout(1600);
      const shown = await state();
      expect(shown.clip).toMatch(/polygon\(0(px|%)? 0(px|%)?, 100% 0(px|%)?, 100% 100%, 0(px|%)? 100%\)|none/);
      await scrollToY(page, top - device.viewport.height * 0.2);
      expect((await state()).transform).not.toBe(shown.transform); // in-frame parallax
    });

    test("projects become a swipe gallery with snapping cards, not a stack of photos", async ({ page }) => {
      await intro(page);
      const track = page.locator("#projects [data-rail-track]");
      const s = await track.evaluate((el) => {
        const cs = getComputedStyle(el);
        const tops = [...el.querySelectorAll("figure")].map((f) => Math.round(f.getBoundingClientRect().top));
        return {
          overflow: cs.overflowX,
          snap: cs.scrollSnapType,
          scrollable: el.scrollWidth > el.clientWidth + 50,
          oneRow: Math.max(...tops) - Math.min(...tops) < 40,
          pinned: !!el.closest(".pin-spacer"),
        };
      });
      expect(s).toEqual({ overflow: "auto", snap: "x mandatory", scrollable: true, oneRow: true, pinned: false });
    });

    test("sample tiles lift one after another as the fan opens", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#samples");
      await scrollToY(page, top + 120);
      await page.waitForTimeout(1500);
      const lifts = await page.locator("#samples [data-tilt]").evaluateAll((els) => els.map((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42));
      expect(Math.min(...lifts)).toBeLessThan(-6);
    });
  });
}

test.describe("tablet: why grid", () => {
  test.use(TABLET);
  const device = TABLET;
  test("why choose us lights exactly one cell at a time", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#why [data-why-grid]");
      const counts: number[] = [];
      for (let i = 1; i <= 6; i++) {
        await scrollToY(page, top - device.viewport.height * 0.5 + i * 220);
        counts.push(await page.locator('#why [data-why-cell][data-active="true"]').count());
      }
      expect(Math.max(...counts)).toBe(1);
      expect(counts.filter((c) => c === 1).length).toBeGreaterThan(3);
    });
});

test.describe("phone: collection", () => {
  test.use(PHONE);
  test("a two-column grid of stone swatches, big enough to see the stone, each named beneath (Monolith)", async ({ page }) => {
    await intro(page);
    const top = await topOf(page, "#collection ul");
    await scrollToY(page, top - PHONE.viewport.height * 0.15);
    await page.waitForTimeout(1500);
    const cells = await page.locator("#collection [data-row]").evaluateAll((els) =>
      els.map((e) => {
        const tile = e.querySelector("[data-swatch]")!;
        const t = tile.getBoundingClientRect();
        const n = e.querySelector("[data-name]")!.getBoundingClientRect();
        const r = e.getBoundingClientRect();
        return {
          left: Math.round(r.left),
          w: t.width,
          h: t.height,
          nameBelow: n.top >= t.bottom - 1,
          nameFits: n.right <= r.right + 1,
          op: Number(getComputedStyle(e).opacity),
          clip: getComputedStyle(tile).clipPath,
        };
      }),
    );
    expect(cells).toHaveLength(4);
    expect(new Set(cells.map((c) => c.left)).size).toBe(2); // two columns
    for (const c of cells) {
      expect(c.w).toBeGreaterThan(150);
      expect(c.h).toBeGreaterThan(c.w); // portrait tiles, like sample sheets
      expect(c.nameBelow).toBe(true);
      expect(c.nameFits).toBe(true);
      expect(c.op).toBeGreaterThan(0.95); // nothing steps back on phones: every stone shows
    }
    expect(cells[0].clip).toMatch(/none|inset\(0(px|%)?( 0(px|%)?){0,3}\)/); // opened once in view
  });
});

test.describe("tablet: collection focus", () => {
  test.use(TABLET);
  test("the other stone rows step back while one is active (ESR marques)", async ({ page }) => {
    await intro(page);
    const top = await topOf(page, "#collection ul");
    await scrollToY(page, top - TABLET.viewport.height * 0.35);
    await expect.poll(() => page.locator('#collection [data-row][data-active="true"]').count()).toBe(1);
    const dim = await page.locator('#collection [data-row][data-active="false"]').evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    // stepped back but still readable (the audits asked for about half, not near invisible)
    expect(Math.max(...dim)).toBeLessThanOrEqual(0.55);
    expect(Math.min(...dim)).toBeGreaterThanOrEqual(0.4);
  });
});

const LANDSCAPE = { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true };

for (const [name, device] of [["tablet", TABLET], ["tablet landscape", LANDSCAPE]] as const) {
  test.describe(`${name}: audit fixes`, () => {
    test.use(device);

    test("the flex sheet never covers the title or the body copy", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#flex");
      for (const f of [0, 0.5, 1.0, 1.5]) {
        await scrollToY(page, top + device.viewport.height * f);
        const hit = await page.locator("#flex").evaluate((el) => {
          const sheet = el.querySelector("[data-bend-dom]")!.getBoundingClientRect(); // the curling strips live inside it
          return [el.querySelector("h2")!, el.querySelector("p")!].some((n) => {
            const r = n.getBoundingClientRect();
            return sheet.right > r.left && sheet.left < r.right && sheet.bottom > r.top && sheet.top < r.bottom;
          });
        });
        expect(hit, `pin ${f}`).toBe(false);
      }
    });

    test("the nav uses the menu button, so labels can never collide", async ({ page }) => {
      await intro(page);
      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("button", { name: /menu/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Projects" })).toBeHidden();
    });

    test("the scroll cue never sits on the headline", async ({ page }) => {
      await intro(page);
      const overlaps = await page.locator("#hero").evaluate((hero) => {
        const cue = hero.querySelector(".scroll-cue")!.parentElement!;
        if (getComputedStyle(cue).display === "none") return false;
        const c = cue.getBoundingClientRect();
        const h = hero.querySelector("h1")!.getBoundingClientRect();
        return c.right > h.left && c.left < h.right && c.bottom > h.top && c.top < h.bottom;
      });
      expect(overlaps).toBe(false);
    });
  });
}

for (const [name, device] of [["phone", PHONE], ["tablet", TABLET]] as const) {
  test.describe(`${name}: audit fixes`, () => {
    test.use(device);

    test("the page never jumps while collection rows take turns being active", async ({ page }) => {
      await intro(page);
      const top = await topOf(page, "#collection ul");
      const heights = new Set<number>();
      for (let i = 0; i < 6; i++) {
        await scrollToY(page, top - device.viewport.height * 0.6 + i * 90);
        heights.add(await page.evaluate(() => document.documentElement.scrollHeight));
      }
      expect(heights.size).toBe(1);
    });

    test("why choose us tells touch visitors to scroll, not hover", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("#why")).not.toContainText(/hover/i);
    });

    test("gallery cards share one shape", async ({ page }) => {
      await intro(page);
      const heights = await page.locator("#projects [data-rail-track] figure [data-gl-image]").evaluateAll((els) =>
        // layout height: the focus animation scales cards, which changes their on-screen size
        els.map((e) => (e as HTMLElement).offsetHeight),
      );
      expect(new Set(heights).size).toBe(1);
    });

    test("small links have a finger-sized hit area", async ({ page }) => {
      await intro(page);
      await page.waitForTimeout(1500); // nav items finish dropping into place
      const ok = await page.evaluate(() => {
        const targets = [document.querySelector('header a[href="#hero"]'), document.querySelector("header button")].filter(Boolean) as HTMLElement[];
        return targets.map((el) => {
          const r = el.getBoundingClientRect();
          const probe = document.elementFromPoint(r.left + r.width / 2, Math.max(1, r.top - 9));
          return !!probe && (probe === el || el.contains(probe));
        });
      });
      expect(ok).toEqual([true, true]);
    });
  });
}
