import { test, expect } from "@playwright/test";

test("no photo waits on the on-demand image optimizer: all come pre-encoded", async ({ page }) => {
  test.setTimeout(90_000);
  const onDemand: string[] = [];
  const photos: string[] = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/_next/image")) onDemand.push(u);
    if (u.includes("/_img/")) photos.push(u);
  });
  await page.goto("/");
  await page.waitForTimeout(3500);
  await page.mouse.move(700, 450);
  // wheel through the whole page so every lazy image and webgl texture is requested
  for (let i = 0; i < 70; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(1500);
  expect(onDemand).toEqual([]);
  expect(photos.length).toBeGreaterThan(10);
});
