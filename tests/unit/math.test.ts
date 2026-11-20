import { describe, it, expect } from "vitest";
import { clamp, lerp, mapRange, damp, stepSpring, springAtRest, cubicBezier, type SpringState } from "@/lib/math";

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
  it("stepSpring settles on the target, overshooting a little when underdamped", () => {
    const s: SpringState = { x: 0, v: 0 };
    const p = { stiffness: 220, damping: 18, mass: 0.6 }; // MagneticButton
    let peak = 0;
    let t = 0;
    while (!springAtRest(s, 100) && t < 5) {
      stepSpring(s, 100, p, 1 / 60);
      peak = Math.max(peak, s.x);
      t += 1 / 60;
    }
    expect(springAtRest(s, 100)).toBe(true);
    expect(t).toBeLessThan(1.5);
    expect(peak).toBeGreaterThan(100);
    expect(peak).toBeLessThan(110);
  });
  it("stepSpring is frame-rate independent", () => {
    const p = { stiffness: 180, damping: 22, mass: 0.5 }; // CursorPreview
    const a: SpringState = { x: 0, v: 0 };
    const b: SpringState = { x: 0, v: 0 };
    for (let i = 0; i < 30; i++) stepSpring(a, 50, p, 1 / 60);
    for (let i = 0; i < 60; i++) stepSpring(b, 50, p, 1 / 120);
    expect(Math.abs(a.x - b.x)).toBeLessThan(0.05);
  });
  it("cubicBezier matches the CSS curve", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0.3)).toBeCloseTo(0.3, 4);
    const expo = cubicBezier(0.16, 1, 0.3, 1); // --ease-expo
    expect(expo(0)).toBe(0);
    expect(expo(1)).toBe(1);
    // reference value from the CSS curve: progress is ~0.81 a quarter of the way in
    expect(expo(0.25)).toBeGreaterThan(0.78);
    expect(expo(0.25)).toBeLessThan(0.84);
    for (let x = 0.05; x < 1; x += 0.05) expect(expo(x)).toBeGreaterThanOrEqual(expo(x - 0.05));
  });
});
