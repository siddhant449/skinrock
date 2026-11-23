import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HERO_WINDOW } from "@/lib/heroWindow";

describe("phone hero window", () => {
  it("the first-paint CSS frames the photo exactly where the loader and the scroll story expect", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain(`clip-path: ${HERO_WINDOW};`);
  });
});
