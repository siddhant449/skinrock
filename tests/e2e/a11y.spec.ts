import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("no serious accessibility violations at rest", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(5000);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.html.slice(0, 80)})`);
  expect(serious).toEqual([]);
});
