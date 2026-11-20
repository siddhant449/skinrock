import { test, expect } from "@playwright/test";

test("reading text is large and solid enough", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  const issues = await page.evaluate(() => {
    const out: string[] = [];
    const sel = "main p, main li, main figcaption, main dd, main dt, main address, footer p, footer li, footer address, footer span, header a";
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (!el.innerText.trim() || el.closest("[aria-hidden]") || el.closest("[data-wordmark]")) return;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const isLabel = cs.textTransform === "uppercase";
      const min = isLabel ? 12 : el.tagName === "P" ? 16 : 14;
      if (size < min) out.push(`${el.tagName} ${size}px "${el.innerText.slice(0, 30)}"`);
      // body paragraphs should not be dimmed below 85% (labels may use the mute colour)
      if (el.tagName === "P" && !isLabel) {
        // computed colours come as rgba(r, g, b, a) or oklab(l a b / alpha)
        const alpha = cs.color.match(/\/\s*([\d.]+)\s*\)$/)?.[1] ?? cs.color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1];
        if (alpha !== undefined && parseFloat(alpha) < 0.85) out.push(`dim ${alpha} "${el.innerText.slice(0, 30)}"`);
      }
    });
    return [...new Set(out)];
  });
  expect(issues).toEqual([]);
});
