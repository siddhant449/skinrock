import { describe, it, expect } from "vitest";
import { BEND, faceTowardCamera, sheetBend } from "@/lib/bend";

describe("the bending sheet never folds over", () => {
  it("keeps the stone face toward the viewer over the whole scroll, wherever the pointer is", () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      for (const pointer of [-1, 0, 1]) {
        // cosine between the front normal and the view direction; > 0.2 means clearly facing us
        expect(faceTowardCamera(sheetBend(p), pointer), `scroll ${p.toFixed(2)} pointer ${pointer}`).toBeGreaterThan(0.2);
      }
    }
  });

  it("the unlimited motion would fold over, so the limit is doing real work", () => {
    expect(faceTowardCamera(1, 0)).toBeLessThan(0);
  });

  it("still bends visibly: the arc at the end of the scroll covers more than 80 degrees", () => {
    const t = BEND.maxBend * BEND.maxBend * (3 - 2 * BEND.maxBend);
    const radius = BEND.flatRadius + (BEND.minRadius - BEND.flatRadius) * t;
    expect((BEND.width / radius) * (180 / Math.PI)).toBeGreaterThan(80);
  });
});
