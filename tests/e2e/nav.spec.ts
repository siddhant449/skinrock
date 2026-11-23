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
  // let the wheel's scroll settle before the next jump
  await page.waitForTimeout(1500);
  await scrollToSection(page, "collection", 0.1);
  await page.mouse.wheel(0, -60);
  await expect(header).toHaveAttribute("data-nav-theme", "cream");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the menu button opens the menu and Escape closes it, handing focus back", async ({ page }) => {
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

test.describe("phone dock (after Fluid Glass)", () => {
  // a real phone in Safari: the bars leave about 660px
  test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

  test("phones navigate from a dock at the foot of the screen, within thumb reach; no top bar", async ({ page }) => {
    await intro(page);
    expect(await page.locator("header").evaluate((el) => getComputedStyle(el).display)).toBe("none");
    const dock = page.getByRole("navigation", { name: "Main" });
    await expect(dock).toBeVisible();
    await page.waitForTimeout(900); // the dock rises into place as the intro hands over
    const box = (await dock.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(664 - 8);
    expect(box.y).toBeGreaterThan(664 - 130);
    expect(box.height).toBeGreaterThanOrEqual(48);
    await expect(dock.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(dock.getByRole("link", { name: "Skinrock, back to top" })).toBeVisible();
  });

  test("the dock names the chapter you are reading", async ({ page }) => {
    await intro(page);
    const chapter = page.locator("[data-dock-chapter]");
    await scrollToSection(page, "collection", 0.2);
    await expect(chapter).toHaveText("Collection");
    await scrollToSection(page, "projects", 0.4);
    await expect(chapter).toHaveText("Projects");
  });

  test("the dock steps aside while you read on and comes back when you scroll up", async ({ page }) => {
    await intro(page);
    const shown = () => page.locator("[data-dock]").evaluate((el) => el.getBoundingClientRect().top < window.innerHeight);
    expect(await shown()).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 2600));
    await page.waitForTimeout(1000);
    expect(await shown()).toBe(false);
    await page.evaluate(() => window.scrollTo(0, 2300));
    await page.waitForTimeout(1000);
    expect(await shown()).toBe(true);
  });

  test("the menu grows out of the dock as a card: the stones, the chapters and a samples button, under the thumb", async ({ page }) => {
    await intro(page);
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await page.waitForTimeout(900);
    const r = await menu.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, swatches: el.querySelectorAll("[data-menu-swatch] img").length };
    });
    expect(r.swatches).toBe(4);
    expect(r.top).toBeGreaterThan(40); // a card, not the whole screen
    expect(r.bottom).toBeGreaterThan(664 - 130); // resting on the dock
    expect(r.left).toBeGreaterThanOrEqual(8);
    await expect(menu.getByRole("link", { name: /Request samples/ })).toBeVisible();
  });

  test("tapping the dimmed page closes the menu", async ({ page }) => {
    await intro(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.waitForTimeout(800);
    await page.touchscreen.tap(195, 24);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });

  test("on a short phone the whole menu still fits on screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 553 });
    await intro(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.waitForTimeout(900);
    const r = await page.getByRole("dialog", { name: "Menu" }).evaluate((el) => {
      const b = el.getBoundingClientRect();
      const cta = [...el.querySelectorAll("a")].find((a) => a.textContent?.includes("Request samples"))!.getBoundingClientRect();
      return { top: b.top, ctaBottom: cta.bottom };
    });
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.ctaBottom).toBeLessThanOrEqual(553);
  });
});

test.describe("tablet", () => {
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true });
  test("tablets keep the top bar; the dock is a phone thing", async ({ page }) => {
    await intro(page);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("[data-dock]")).toBeHidden();
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

test("nav links are refined uppercase labels, not plain text", async ({ page }) => {
  await intro(page);
  const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" });
  const s = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { transform: cs.textTransform, tracking: parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize), size: parseFloat(cs.fontSize) };
  });
  expect(s.transform).toBe("uppercase");
  expect(s.tracking).toBeGreaterThanOrEqual(0.06);
  expect(s.size).toBeGreaterThanOrEqual(12);
});

test("hovering a nav link dims the others and marks the one you are on", async ({ page }) => {
  await intro(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Light" }).hover();
  await page.waitForTimeout(700);
  const opacity = (name: string) => nav.getByRole("link", { name }).evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(await opacity("Light")).toBeGreaterThan(0.95);
  expect(await opacity("Stones")).toBeLessThan(0.6);
  const marker = (name: string) =>
    nav.getByRole("link", { name }).evaluate((el) => (getComputedStyle(el, "::before").content === "none" ? 0 : new DOMMatrixReadOnly(getComputedStyle(el, "::before").transform).a));
  expect(await marker("Light")).toBeGreaterThan(0.95);
  expect(await marker("Stones")).toBeLessThan(0.05);
});

test("the current section also carries the marker without hovering", async ({ page }) => {
  await intro(page);
  await scrollToSection(page, "light", 0.2);
  await page.mouse.wheel(0, -60);
  await page.mouse.move(700, 600);
  await page.waitForTimeout(800);
  const a = await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Light" })
    .evaluate((el) => (getComputedStyle(el, "::before").content === "none" ? 0 : new DOMMatrixReadOnly(getComputedStyle(el, "::before").transform).a));
  expect(a).toBeGreaterThan(0.95);
});

test("the hover roll lands exactly where the label rested (no jump)", async ({ page }) => {
  await intro(page);
  const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Light" });
  const visibleTop = () =>
    link.evaluate((el) => {
      const box = el.querySelector(".roll")!.getBoundingClientRect();
      // the copy that is inside the clipped box is the one you see
      const shown = [...el.querySelectorAll<HTMLElement>(".roll-a, .roll-b")].find((s) => {
        const r = s.getBoundingClientRect();
        return r.top >= box.top - 1 && r.top < box.top + box.height / 2;
      })!;
      return shown.getBoundingClientRect().top;
    });
  await page.mouse.move(700, 600);
  await page.waitForTimeout(400);
  const rest = await visibleTop();
  await link.hover();
  await page.waitForTimeout(900);
  expect(Math.abs((await visibleTop()) - rest)).toBeLessThan(0.5);
});

test("the request samples arrow rests in place and only nudges on hover", async ({ page }) => {
  await intro(page);
  const cta = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /request samples/i });
  const shift = () => cta.locator(".nav-arrow").evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  await page.mouse.move(700, 600);
  await page.waitForTimeout(800);
  expect(Math.abs(await shift())).toBeLessThan(0.5);
  await cta.hover();
  await page.waitForTimeout(900);
  expect(await shift()).toBeGreaterThan(2);
});
