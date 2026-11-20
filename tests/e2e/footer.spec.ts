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
  test(`wordmark runs edge to edge and is cut in half by the page end at ${width}px`, async ({ page }) => {
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
    expect(m.visibleShare).toBeGreaterThan(0.4);
    expect(m.visibleShare).toBeLessThan(0.6); // roughly half cut
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
