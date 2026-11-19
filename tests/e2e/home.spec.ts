import { test, expect } from "@playwright/test";

test("home responds with Skinrock title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Skinrock/);
});

test("serves organization json-ld, sitemap and robots", async ({ page, request }) => {
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.join(" ")).toContain('"PostalAddress"');
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain("sitemap.xml");
});

test.describe("without javascript", () => {
  test.use({ javaScriptEnabled: false });
  test("renders all copy without JS", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Real stone. Thin enough to let light through.");
    await expect(page.getByText("Backlit, the stone stops being a surface and becomes the lamp.", { exact: false })).toBeVisible();
  });
});

test("headline reveals with javascript and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await page.waitForTimeout(5500);
  const h1 = page.locator("h1");
  await expect(h1).toHaveAttribute("data-revealed", "true");
  const firstWordTop = await h1.evaluate((el) => {
    const w = el.querySelector("[class*=word], div > div") as HTMLElement | null;
    const target = w ?? el;
    return target.getBoundingClientRect().top - el.getBoundingClientRect().top;
  });
  expect(Math.abs(firstWordTop)).toBeLessThan(20);
  expect(errors).toEqual([]);
});
