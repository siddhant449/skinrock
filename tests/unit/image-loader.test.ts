import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import imageLoader from "@/lib/imageLoader";
import manifest from "@/lib/image-manifest.json";
import { textureUrl } from "@/lib/textureSize";

const entries = manifest as Record<string, { hash: string; widths: number[] }>;

describe("photos are served pre-encoded, never optimised on demand", () => {
  it("every photo in public/images has pre-encoded sizes in the manifest", () => {
    const photos = readdirSync(join(process.cwd(), "public/images")).filter((f) => /\.(jpe?g|png)$/i.test(f));
    for (const f of photos) {
      const name = f.replace(/\.[^.]+$/, "");
      expect(entries[name], f).toBeDefined();
      expect(entries[name].widths.length, f).toBeGreaterThan(0);
    }
  });

  it("maps a request to the smallest pre-encoded width that is at least as wide", () => {
    const { hash, widths } = entries["lobby"];
    const url = imageLoader({ src: "/images/lobby.jpg", width: 700 });
    const w = widths.find((x) => x >= 700) ?? widths[widths.length - 1];
    expect(url).toBe(`/_img/lobby-${hash}-${w}.webp`);
    expect(url).not.toContain("/_next/image");
  });

  it("never asks for more than the largest size it has", () => {
    const { hash, widths } = entries["lobby"];
    expect(imageLoader({ src: "/images/lobby.jpg", width: 99999 })).toBe(`/_img/lobby-${hash}-${widths[widths.length - 1]}.webp`);
  });

  it("webgl textures use the same static files", () => {
    expect(textureUrl("/images/lobby.jpg", 1080)).toBe(imageLoader({ src: "/images/lobby.jpg", width: 1080 }));
  });

  it("leaves other sources untouched", () => {
    expect(imageLoader({ src: "/brand/skinrock-lockup.svg", width: 300 })).toBe("/brand/skinrock-lockup.svg");
  });
});
