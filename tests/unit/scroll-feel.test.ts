import { describe, it, expect } from "vitest";
import { scrollFeel } from "@/lib/scrollFeel";

describe("scroll feel", () => {
  it("touch: the page glides calmly on a flick (shorter and softer than Lenis's defaults and our earlier glide)", () => {
    const o = scrollFeel(false);
    expect(o.syncTouch).toBe(true);
    // the inertia after a flick grows with speed to this power: Lenis defaults to 1.7
    expect(o.touchInertiaExponent).toBeLessThan(1.7);
    expect(o.touchInertiaExponent).toBeGreaterThanOrEqual(1.4); // still a glide, not a dead stop
    expect(o.syncTouchLerp).toBeLessThanOrEqual(0.075);
  });

  it("desktop: each wheel notch carries the page a little less far than the browser's step", () => {
    const o = scrollFeel(false);
    expect(o.smoothWheel).toBe(true);
    expect(o.wheelMultiplier).toBeLessThan(1);
    expect(o.wheelMultiplier).toBeGreaterThanOrEqual(0.8);
  });

  it("reduced motion: no smoothing and no glide at all", () => {
    const o = scrollFeel(true);
    expect(o.lerp).toBe(1);
    expect(o.smoothWheel).toBe(false);
    expect(o.syncTouch).toBe(false);
  });
});
