import { describe, it, expect } from "vitest";
import { MAX_GL_DPR, TEXTURE_WIDTHS, textureUrl, textureWidth } from "@/lib/textureSize";

const base = { imageWidth: 2000, imageHeight: 1500, devicePixelRatio: 1 };

describe("textureWidth", () => {
  it("picks the smallest optimizer width that covers the drawn pixels", () => {
    expect(textureWidth({ ...base, boxWidth: 300, boxHeight: 225 })).toBe(640);
    expect(textureWidth({ ...base, boxWidth: 700, boxHeight: 525 })).toBe(750);
  });

  it("accounts for cover cropping: a tall box needs a wider texture", () => {
    // 400 x 600 box, 4:3 image: height binds, so the image is drawn 800 wide
    expect(textureWidth({ ...base, boxWidth: 400, boxHeight: 600 })).toBe(828);
  });

  it("scales with pixel ratio up to the canvas cap and with shader zoom", () => {
    expect(textureWidth({ ...base, boxWidth: 500, boxHeight: 375, devicePixelRatio: 1.5 })).toBe(750);
    expect(textureWidth({ ...base, boxWidth: 500, boxHeight: 375, devicePixelRatio: 3 })).toBe(
      TEXTURE_WIDTHS.find((w) => w >= 500 * MAX_GL_DPR),
    );
    expect(textureWidth({ ...base, boxWidth: 600, boxHeight: 450, zoom: 1.2 })).toBe(750);
  });

  it("never asks for more than the source has", () => {
    expect(textureWidth({ ...base, boxWidth: 1900, boxHeight: 1425, devicePixelRatio: 2 })).toBe(2048);
    expect(textureWidth({ ...base, imageWidth: 780, imageHeight: 840, boxWidth: 900, boxHeight: 900 })).toBe(828);
  });

  it("only returns widths the image optimizer allows", () => {
    for (const w of [100, 640, 641, 1300, 5000]) {
      expect(TEXTURE_WIDTHS).toContain(textureWidth({ ...base, imageWidth: 6000, imageHeight: 4500, boxWidth: w, boxHeight: w * 0.75 }));
    }
  });
});

describe("textureUrl", () => {
  it("uses the default next/image loader format", () => {
    expect(textureUrl("/images/a b.jpg", 640)).toBe("/_next/image?url=%2Fimages%2Fa%20b.jpg&w=640&q=75");
  });
});
