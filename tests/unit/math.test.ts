import { describe, it, expect } from "vitest";
import { clamp, lerp, mapRange, damp } from "@/lib/math";

describe("math", () => {
  it("mapRange maps linearly", () => expect(mapRange(5, 0, 10, 0, 100)).toBe(50));
  it("mapRange clamps at bounds by default", () => {
    expect(mapRange(-5, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(15, 0, 10, 0, 100)).toBe(100);
  });
  it("mapRange can extrapolate when clamp is false", () => expect(mapRange(15, 0, 10, 0, 100, false)).toBe(150));
  it("clamp and lerp", () => {
    expect(clamp(2, 0, 1)).toBe(1);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
  it("damp converges toward the target without overshooting", () => {
    let v = 0;
    for (let i = 0; i < 120; i++) v = damp(v, 1, 8, 1 / 60);
    expect(v).toBeGreaterThan(0.999);
    expect(v).toBeLessThanOrEqual(1);
  });
});
