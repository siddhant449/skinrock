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
