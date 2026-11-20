import { test, expect, type Page } from "@playwright/test";

async function intro(page: Page) {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
}

async function reach(page: Page, sel: string, f = 0.1) {
  // pinned sections change the page height as they refresh, so repeat until the target lands
  await expect
    .poll(
      async () => {
        await page.evaluate(
          ([s, ff]) => {
            const el = document.querySelector(s as string)!;
            window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * (ff as number));
          },
          [sel, f],
        );
        await page.waitForTimeout(600);
        return page.evaluate(
          ([s, ff]) => Math.abs(document.querySelector(s as string)!.getBoundingClientRect().top - window.innerHeight * (ff as number)),
          [sel, f],
        );
      },
      { timeout: 15_000 },
    )
    .toBeLessThan(40);
  await page.waitForTimeout(1200);
}

test("why choose us lists the seven reasons from the current site", async ({ page }) => {
  await page.goto("/");
  const why = page.locator("#why");
  await expect(why.getByRole("heading", { name: "Real stone. Revolutionary flexibility." })).toBeAttached();
  const titles = why.locator("[data-why-cell] h3");
  await expect(titles).toHaveText([
    "Swiss innovation.",
    "Ultra thin natural stone.",
    "Flexible and bendable.",
    "Translucent options.",
    "Easy installation.",
    "Sustainable solution.",
    "Durable and long lasting.",
  ]);
});

test("why sits between projects and the Swiss proof", async ({ page }) => {
  await page.goto("/");
  const order = await page.evaluate(() => [...document.querySelectorAll("main > section, main > div > section")].map((s) => s.id).filter(Boolean));
  expect(order.indexOf("why")).toBe(order.indexOf("projects") + 1);
  expect(order.indexOf("proof")).toBe(order.indexOf("why") + 1);
});

test("hovering a reason reveals its project photo inside the cell", async ({ page }) => {
  await intro(page);
  await reach(page, "#why", 0.05);
  const cell = page.locator("#why [data-why-cell]").nth(3);
  const photo = cell.locator("[data-why-photo]");
  const before = await photo.evaluate((el) => getComputedStyle(el).clipPath);
  await cell.hover();
  await page.waitForTimeout(1100);
  const after = await photo.evaluate((el) => getComputedStyle(el).clipPath);
  expect(before).not.toBe(after);
  expect(after).toMatch(/inset\(0(px|%)?( 0(px|%)?)*\)/);
});

test("samples: four real stone tiles fan open when the section is in view", async ({ page }) => {
  await intro(page);
  const tiles = page.locator("#samples [data-sample-tile]");
  await expect(tiles).toHaveCount(4);
  await expect(tiles).toHaveText([/Slate/, /Quartzite/, /Marble/, /Acoustic/]);
  const spread = async () =>
    tiles.evaluateAll((els) => {
      const xs = els.map((e) => e.getBoundingClientRect()).map((r) => r.left + r.width / 2);
      return Math.max(...xs) - Math.min(...xs);
    });
  const closed = await spread();
  await reach(page, "#samples", 0.05);
  await page.waitForTimeout(1500);
  const open = await spread();
  expect(open).toBeGreaterThan(closed + 150);
  await expect(page.locator("#samples").getByRole("link", { name: /Request samples/ })).toHaveAttribute("href", /contact/);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("why cells stack and reveal their photo as they scroll into the middle", async ({ page }) => {
    await intro(page);
    await reach(page, "#why [data-why-cell]:nth-child(2)", 0.45);
    const cell = page.locator("#why [data-why-cell]").nth(1);
    await expect(cell).toHaveAttribute("data-active", "true", { timeout: 4000 });
  });
});

test("the samples button label is clearly readable", async ({ page }) => {
  await page.goto("/");
  const btn = page.locator("#samples").getByRole("link", { name: /Request samples/ });
  const ratio = await btn.evaluate((el) => {
    const lum = (c: string) => {
      const v = c.match(/[\d.]+/g)!.slice(0, 3).map((n) => Number(n) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    // the label's colour against the colour actually painted behind it
    const label = el.querySelector("span.relative") ?? el;
    const fg = getComputedStyle(label).color;
    let bgEl: Element | null = el;
    let bg = "rgba(0, 0, 0, 0)";
    while (bgEl && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) {
      bg = getComputedStyle(bgEl).backgroundColor;
      bgEl = bgEl.parentElement;
    }
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
  expect(ratio).toBeGreaterThan(4.5);
});
