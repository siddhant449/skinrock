import { test, expect } from "@playwright/test";

test("footer opens with the invitation and a samples link", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer#footer");
  await expect(footer.getByText("Let's talk stone.")).toBeAttached();
  await expect(footer.getByRole("link", { name: /Request samples/ })).toHaveAttribute("href", /contact/);
});

test("footer link rows go to their sections", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
  const rows = page.getByRole("navigation", { name: "Footer" }).getByRole("link");
  await expect(rows).toHaveText([/Stones/, /Projects/, /Light/, /Specs/]);
  await expect(rows.nth(3)).toHaveAttribute("href", "#proof");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  await rows.nth(3).click();
  await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById("proof")!.getBoundingClientRect().top)), { timeout: 6000 }).toBeLessThan(120);
});

test("footer keeps the address, legal links and faint wordmark", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer#footer");
  await expect(footer).toContainText("Hartbertstrasse 9");
  await expect(footer.getByRole("link", { name: "Terms and Conditions" })).toBeAttached();
  await expect(footer.getByRole("link", { name: "Privacy Policy" })).toBeAttached();
  const mark = footer.locator("[data-wordmark]");
  await expect(mark).toHaveText("SKINROCK");
  // faint: drawn at low alpha, a texture rather than a solid block
  const alpha = await mark.evaluate((el) => {
    const t = el.querySelector("text") ?? el;
    const c = getComputedStyle(t).fill || getComputedStyle(t).color;
    const m = c.match(/\/\s*([\d.]+)\s*\)$/) ?? c.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return m ? parseFloat(m[1]) : 1;
  });
  expect(alpha).toBeLessThan(0.15);
});

for (const width of [1440, 1865, 390]) {
  test(`wordmark runs edge to edge and its bottom is trimmed by the page end at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    // pinned sections recalculate the page height after a jump, so repeat until truly at the end
    await expect
      .poll(
        async () => {
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(700);
          return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
        },
        { timeout: 15_000 },
      )
      .toBeLessThan(2);
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const svg = document.querySelector("footer#footer [data-wordmark]") as SVGSVGElement;
      const t = svg.querySelector("text")!;
      const vb = svg.viewBox.baseVal;
      const r = svg.getBoundingClientRect();
      const f = document.getElementById("footer")!.getBoundingClientRect();
      // real letter height (cap height) from the font, in viewBox units
      const cs = getComputedStyle(t);
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const cap = ctx.measureText("SKINROCK").actualBoundingBoxAscent;
      const baseline = parseFloat(t.getAttribute("y")!);
      const inkTop = baseline - cap;
      return {
        left: r.left, right: r.right, vw: document.documentElement.clientWidth,
        textW: t.getComputedTextLength(), vbW: vb.width,
        visibleShare: (vb.height - inkTop) / cap, // share of the letters above the cut
        bottomGap: f.bottom - r.bottom,
      };
    });
    expect(Math.abs(m.left)).toBeLessThan(1.5);
    expect(Math.abs(m.right - m.vw)).toBeLessThan(1.5);
    expect(m.textW / m.vbW).toBeGreaterThan(0.97); // letters span the full width
    // letters clearly readable, sitting on the page edge with the bottom quarter or so trimmed
    expect(m.visibleShare).toBeGreaterThan(0.66);
    expect(m.visibleShare).toBeLessThan(0.78);
    expect(Math.abs(m.bottomGap)).toBeLessThan(1.5); // flush with the very bottom
  });
}


test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("footer fits the phone width", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1200);
    const over = await page.locator("footer#footer").evaluate((el) => {
      const bad: string[] = [];
      el.querySelectorAll<HTMLElement>("*").forEach((c) => {
        if (c.closest("[data-wordmark]")) return;
        const r = c.getBoundingClientRect();
        if (r.width && (r.right > window.innerWidth + 1 || r.left < -1)) bad.push(c.textContent!.slice(0, 20));
      });
      return bad;
    });
    expect(over).toEqual([]);
  });
});

for (const [w, h] of [[1366, 768], [1440, 900], [1920, 1080]]) {
  test(`whole footer fits one screen at the end of the page on ${w}x${h}`, async ({ page }) => {
    // the browser's own toolbars take ~120px of a 1080 screen
    await page.setViewportSize({ width: w, height: h === 1080 ? 960 : h - 80 });
    await page.goto("/");
    await expect
      .poll(
        async () => {
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(700);
          return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
        },
        { timeout: 15_000 },
      )
      .toBeLessThan(2);
    await page.waitForTimeout(600);
    const top = await page.locator("footer#footer").getByText("Let's talk stone.").evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(16); // fully readable, not cut by the top of the screen
  });
}

/** scroll to the true end of the page (pins recalculate the page height after a jump) */
async function toEnd(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () => {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(700);
        return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
      },
      { timeout: 15_000 },
    )
    .toBeLessThan(2);
}

test.describe("footer stone sketch (after the Truvolt footer drawing)", () => {
  test("draws itself in as the page ends, then stays live: the skin flexes and light runs through it", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
    const sketch = page.locator("footer#footer [data-footer-sketch]");
    await expect(sketch).toHaveAttribute("aria-hidden", "true");
    const lines = sketch.locator("[data-draw]");
    expect(await lines.count()).toBeGreaterThan(8);
    // nothing is drawn before the footer arrives
    expect(await lines.evaluateAll((els) => els.every((e) => Number(e.getAttribute("stroke-dashoffset")) > 0.9))).toBe(true);
    await toEnd(page);
    await expect
      .poll(() => lines.evaluateAll((els) => els.every((e) => Math.abs(Number(e.getAttribute("stroke-dashoffset"))) < 0.01)), { timeout: 8000 })
      .toBe(true);
    await expect(sketch).toHaveAttribute("data-live", "on", { timeout: 4000 });
    const read = () =>
      sketch.evaluate((el) => ({
        skin: el.querySelector("[data-skin]")!.getAttribute("d"),
        light: el.querySelector("[data-flow]")!.getAttribute("stroke-dashoffset"),
        lit: Number(getComputedStyle(el.querySelector("[data-flow]")!).opacity),
      }));
    const a = await read();
    await page.waitForTimeout(800);
    const b = await read();
    expect(b.skin).not.toBe(a.skin); // the stone skin keeps flexing
    expect(b.light).not.toBe(a.light); // light keeps running through it
    expect(b.lit).toBeGreaterThan(0.5);
  });

  test("the live drawing rests while the footer is off screen", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
    const sketch = page.locator("footer#footer [data-footer-sketch]");
    await toEnd(page);
    await expect(sketch).toHaveAttribute("data-live", "on", { timeout: 8000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(sketch).toHaveAttribute("data-live", "off", { timeout: 4000 });
    const skin = () => sketch.locator("[data-skin]").first().getAttribute("d");
    const a = await skin();
    await page.waitForTimeout(700);
    expect(await skin()).toBe(a);
  });

  test("with reduced motion it is a finished, still drawing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await toEnd(page);
    await page.waitForTimeout(1200);
    const sketch = page.locator("footer#footer [data-footer-sketch]");
    const hidden = await sketch.locator("[data-draw]").evaluateAll((els) => els.filter((e) => Number(e.getAttribute("stroke-dashoffset") ?? 0) > 0.01).length);
    expect(hidden).toBe(0);
    const skin = () => sketch.locator("[data-skin]").first().getAttribute("d");
    const a = await skin();
    await page.waitForTimeout(700);
    expect(await skin()).toBe(a);
  });

  for (const [w, h] of [[1366, 688], [1440, 820], [1920, 960]]) {
    test(`sits between the invitation and the link rows, clear of both, at ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await toEnd(page);
      const r = await page.evaluate(() => {
        const f = document.querySelector("footer#footer")!;
        const box = (s: string) => f.querySelector(s)!.getBoundingClientRect().toJSON() as DOMRect;
        return { say: box("[data-footer-say]"), info: box("[data-footer-info]"), sketch: box("[data-footer-sketch] svg"), rows: box("[data-rows]") };
      });
      expect(r.sketch.width).toBeGreaterThan(280);
      expect(r.sketch.left).toBeGreaterThanOrEqual(Math.max(r.say.right, r.info.right) - 1);
      expect(r.sketch.right).toBeLessThanOrEqual(r.rows.left + 1);
    });
  }
});

test.describe("phone footer sketch", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("the drawing follows the invitation, full width, before the address", async ({ page }) => {
    await page.goto("/");
    await toEnd(page);
    const r = await page.evaluate(() => {
      const f = document.querySelector("footer#footer")!;
      const box = (s: string) => f.querySelector(s)!.getBoundingClientRect().toJSON() as DOMRect;
      return { say: box("[data-footer-say]"), info: box("[data-footer-info]"), sketch: box("[data-footer-sketch] svg") };
    });
    expect(r.sketch.width).toBeGreaterThan(300);
    expect(r.sketch.top).toBeGreaterThanOrEqual(r.say.bottom);
    expect(r.sketch.bottom).toBeLessThanOrEqual(r.info.top);
  });
});
