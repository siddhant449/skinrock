export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  shouldClamp = true,
) {
  const t = (v - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, shouldClamp ? clamp(t, 0, 1) : t);
}

/** Frame-rate independent exponential smoothing toward `b`. */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

export type SpringParams = { stiffness: number; damping: number; mass: number };
export type SpringState = { x: number; v: number };

/**
 * Advances a damped spring toward `target` by `dt` seconds (semi-implicit Euler, 1 ms steps).
 * Same physics as motion's useSpring: velocity carries over when the target moves.
 */
export function stepSpring(s: SpringState, target: number, p: SpringParams, dt: number) {
  const steps = Math.max(1, Math.ceil(dt / 0.001));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const a = (-p.stiffness * (s.x - target) - p.damping * s.v) / p.mass;
    s.v += a * h;
    s.x += s.v * h;
  }
}

/** motion's default rest thresholds for pixel values: under 0.5 px away and 2 px/s. */
export const springAtRest = (s: SpringState, target: number) =>
  Math.abs(s.x - target) < 0.5 && Math.abs(s.v) < 2;

/** CSS cubic-bezier() as an easing function (for GSAP), solved with Newton steps then bisection. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bez = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  const slope = (t: number, a: number, b: number) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (bez(t, x1, x2) - x) / d;
    }
    if (t < 0 || t > 1 || Math.abs(bez(t, x1, x2) - x) > 1e-5) {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 30; i++) {
        t = (lo + hi) / 2;
        if (bez(t, x1, x2) < x) lo = t;
        else hi = t;
      }
    }
    return bez(t, y1, y2);
  };
}
