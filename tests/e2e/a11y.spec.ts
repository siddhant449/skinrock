import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("no serious accessibility violations at rest", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(5000);
  // [data-wordmark] is the faint decorative SKINROCK behind the footer (aria-hidden).
  // Decorative text is exempt from contrast minimums (WCAG 1.4.3 "Incidental").
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("[data-wordmark]").analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.html.slice(0, 80)})`);
  expect(serious).toEqual([]);
});
