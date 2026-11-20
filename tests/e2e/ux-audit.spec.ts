import { test, expect } from "@playwright/test";

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("each manifesto note sits directly under its word", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2500);
    const order = await page.locator("#manifesto").evaluate((root) => {
      const items = [...root.querySelectorAll<HTMLElement>("[data-word], [data-note]")].filter((el) => el.offsetParent);
      return items.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map((el) => (el.hasAttribute("data-word") ? "W" : "N"));
    });
    expect(order.join("")).toBe("WNWNWNWN");
  });
});

test("projects statement has a protective backdrop above the drifting photos", async ({ page }) => {
  await page.goto("/");
  const backdrop = page.locator("#projects [data-statement-backdrop]");
  await expect(backdrop).toHaveCount(1);
  // drawn above the WebGL canvas (z-10) and below the text (z-20)
  const z = await backdrop.evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(z).toBeGreaterThan(10);
  expect(z).toBeLessThan(20);
});
