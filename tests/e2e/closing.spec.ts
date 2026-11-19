import { test, expect } from "@playwright/test";

test("proof lists the independent test results", async ({ page }) => {
  await page.goto("/");
  const proof = page.locator("#proof");
  await expect(proof.getByRole("heading", { name: "Independently tested." })).toBeAttached();
  await expect(proof).toContainText("DIN 4102-1");
  await expect(proof).toContainText("Fire class B2");
  await expect(proof).toContainText("SIA 262/1:2013");
});

test("cta offers samples and is the target of the nav cta", async ({ page }) => {
  await page.goto("/");
  const cta = page.locator("#samples");
  await expect(cta.getByRole("heading", { name: "Hold it in your hand." })).toBeAttached();
  await expect(cta.getByRole("link", { name: "Request samples" })).toHaveAttribute("href", /contact/);
});

test("footer carries the address, legal links and wordmark", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer#footer");
  await expect(footer).toContainText("Hartbertstrasse 9");
  await expect(footer).toContainText("7000 Chur");
  await expect(footer.getByRole("link", { name: "Privacy Policy" })).toBeAttached();
  await expect(footer.locator("[data-wordmark]")).toContainText("SKINROCK");
});
