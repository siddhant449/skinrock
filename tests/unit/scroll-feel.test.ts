import { describe, it, expect } from "vitest";
import { scrollFeel } from "@/lib/scrollFeel";

describe("scroll feel (only a little slower than the browser's own scrolling)", () => {
  it("touch: a flick glides about three quarters as far as the phone's own fling, and settles briskly", () => {
    const o = scrollFeel(false);
    expect(o.syncTouch).toBe(true);
    // the inertia after a flick grows with speed to this power (Lenis's default is 1.7; at 1.5 the
    // page felt heavy and slow, the phone's own fling felt too fast)
    expect(o.touchInertiaExponent).toBeGreaterThanOrEqual(1.75);
    expect(o.touchInertiaExponent).toBeLessThanOrEqual(1.85);
    // how quickly the glide eases out: higher settles sooner, lower drags on
    expect(o.syncTouchLerp).toBeGreaterThanOrEqual(0.09);
    expect(o.syncTouchLerp).toBeLessThanOrEqual(0.12);
  });

  it("desktop: each wheel notch carries the page just a touch less far than the browser's step", () => {
    const o = scrollFeel(false);
    expect(o.smoothWheel).toBe(true);
    expect(o.wheelMultiplier).toBeGreaterThanOrEqual(0.9);
    expect(o.wheelMultiplier).toBeLessThanOrEqual(0.97);
  });

  it("reduced motion: no smoothing and no glide at all", () => {
    const o = scrollFeel(true);
    expect(o.lerp).toBe(1);
    expect(o.smoothWheel).toBe(false);
    expect(o.syncTouch).toBe(false);
  });
});
