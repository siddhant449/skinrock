import { test, expect, type Page } from "@playwright/test";

async function intro(page: Page) {
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.loaded), { timeout: 15_000 }).toBe("true");
}

async function scrollToSection(page: Page, id: string, extra = 0.3) {
  await page.evaluate(
    ([i, f]) => {
      const el = document.getElementById(i as string)!;
      const sp = el.parentElement!.classList.contains("pin-spacer") ? el.parentElement! : el;
      window.scrollTo(0, sp.getBoundingClientRect().top + window.scrollY + window.innerHeight * (f as number));
    },
    [id, extra],
  );
  await page.waitForTimeout(900);
}

test("desktop links sit on the page grid", async ({ page }) => {
  await intro(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  // 12 columns, 32px gutters each side, 20px column gap: "Stones" starts on column 5
  const x = await nav.getByRole("link", { name: "Stones" }).evaluate((el) => el.getBoundingClientRect().left);
  const col = (1440 - 64 - 11 * 20) / 12;
  expect(Math.abs(x - (32 + 4 * (col + 20)))).toBeLessThan(2);
});

test("the current section is marked in the nav", async ({ page }) => {
  await intro(page);
  await scrollToSection(page, "light", 0.2);
  await page.mouse.wheel(0, -60); // reveal the bar
  await page.waitForTimeout(600);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Light" })).toHaveAttribute("aria-current", "true");
  await expect(nav.getByRole("link", { name: "Stones" })).not.toHaveAttribute("aria-current", "true");
});

test("bar turns solid after the hero and cream on cream chapters", async ({ page }) => {
  await intro(page);
  const header = page.locator("header[data-nav-theme]");
  await expect(header).toHaveAttribute("data-solid", "false");
  await scrollToSection(page, "flex", 0.1);
  await page.mouse.wheel(0, -60);
  await expect(header).toHaveAttribute("data-solid", "true");
  // let Lenis finish the wheel's smooth scroll, or it carries on and overrides the next jump
  await page.waitForTimeout(1500);
  await scrollToSection(page, "collection", 0.1);
  await page.mouse.wheel(0, -60);
  await expect(header).toHaveAttribute("data-nav-theme", "cream");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("menu button opens a full screen index and closes with Escape", async ({ page }) => {
    await intro(page);
    const button = page.getByRole("button", { name: "Menu" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    for (const label of ["Stones", "Projects", "Light", "Specs", "Studio", "Request samples"]) {
      await expect(menu.getByRole("link", { name: label })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("choosing a menu link closes the menu and goes there", async ({ page }) => {
    await intro(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Specs" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.getElementById("proof")!.getBoundingClientRect().top), { timeout: 6000 }).toBeLessThan(200);
  });
});

test("nav labels render once and the cta stays on one line", async ({ page }) => {
  await intro(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  const stones = nav.getByRole("link", { name: "Stones" });
  // the link fills its grid column; the rolling label inside should be one word wide
  const box = (await stones.locator(".roll").boundingBox())!;
  expect(box.width).toBeLessThan(70); // a duplicated inline label would be ~100px
  const cta = nav.getByRole("link", { name: "Request samples" });
  expect((await cta.boundingBox())!.height).toBeLessThan(30);
});

test.describe("phone menu", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("the open menu covers the whole screen", async ({ page }) => {
    await intro(page);
    await page.getByRole("button", { name: "Menu" }).click();
    const box = (await page.getByRole("dialog", { name: "Menu" }).boundingBox())!;
    expect(box.y).toBeLessThanOrEqual(1);
    expect(box.height).toBeGreaterThanOrEqual(843);
  });
});

test("nav shows the real Skinrock logo, recoloured to the theme", async ({ page }) => {
  await intro(page);
  const logo = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Skinrock/ }).locator("svg");
  await expect(logo).toBeVisible();
  // vector paths in currentColor: stone on the ink bar
  const fill = await logo.evaluate((el) => getComputedStyle(el).color);
  expect(fill).toMatch(/238, 233, 224|eee9e0/i);
  const box = (await logo.boundingBox())!;
  expect(box.width).toBeGreaterThan(110);
  expect(box.width).toBeLessThan(200);
});
