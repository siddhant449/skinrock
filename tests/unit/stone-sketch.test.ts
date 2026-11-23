import { describe, it, expect } from "vitest";
import { CURL, SKETCH, BLOCK_PATHS, posePaths } from "@/lib/stoneSketch";

type Pt = readonly [number, number];
const points = (d: string): Pt[] => [...d.matchAll(/[ML]\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
const length = (pts: Pt[]) => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const curls = [CURL.min, CURL.rest, CURL.max];
const allPose = (c: number) => {
  const p = posePaths(c);
  return [p.skinTop, p.skinBottom, p.skinBack, p.skinEnds, p.generators, p.veins, ...p.raysIn, ...p.raysOut];
};

describe("footer stone sketch geometry", () => {
  it("the stone skin keeps its length as it flexes and stays attached at the peel line", () => {
    const poses = curls.map(posePaths);
    const lens = poses.map((p) => length(points(p.skinBottom)));
    for (const l of lens) expect(Math.abs(l - lens[1]) / lens[1]).toBeLessThan(0.01);
    const starts = poses.map((p) => points(p.skinBottom)[0]);
    for (const s of starts) expect(s).toEqual(starts[1]);
    // and it really moves
    expect(points(poses[0].skinBottom).at(-1)).not.toEqual(points(poses[2].skinBottom).at(-1));
  });

  it("every line stays on the paper in every pose", () => {
    const all = [...Object.values(BLOCK_PATHS).flat(), ...curls.flatMap(allPose)];
    for (const d of all)
      for (const [x, y] of points(d)) {
        expect(x).toBeGreaterThanOrEqual(1);
        expect(x).toBeLessThanOrEqual(SKETCH.w - 1);
        expect(y).toBeGreaterThanOrEqual(1);
        expect(y).toBeLessThanOrEqual(SKETCH.h - 1);
      }
  });

  it("light comes in from the right, passes through the skin and leaves from the point where it went through", () => {
    for (const c of curls) {
      const p = posePaths(c);
      const front = points(p.skinTop);
      const back = points(p.skinBack);
      const minX = Math.min(...front.map((q) => q[0]));
      const maxX = Math.max(...back.map((q) => q[0]));
      expect(p.raysIn.length).toBeGreaterThanOrEqual(2);
      p.raysIn.forEach((d, i) => {
        const a = points(d);
        const b = points(p.raysOut[i]);
        expect(a[0][0]).toBeGreaterThan(a.at(-1)![0]); // travelling left
        expect(b[0]).toEqual(a.at(-1)); // the warm light starts where the cool light met the stone
        expect(b.at(-1)![0]).toBeLessThan(b[0][0]);
        expect(a.at(-1)![0]).toBeGreaterThan(minX);
        expect(a.at(-1)![0]).toBeLessThan(maxX);
      });
    }
    // the light follows the sheet as it flexes
    expect(points(posePaths(CURL.min).raysIn[0]).at(-1)).not.toEqual(points(posePaths(CURL.max).raysIn[0]).at(-1));
  });
});
