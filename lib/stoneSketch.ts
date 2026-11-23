/**
 * Geometry for the footer's live drawing (after the Truvolt footer, where a blueprint of the
 * product draws itself in and then keeps working): a block of stone whose top skin has come
 * away and curls up, with light passing through it. That is the product in one picture: real
 * stone, thin enough to bend, thin enough to let light through.
 *
 * Drawn in a cabinet oblique projection: the front face is true to size and the depth runs up
 * and to the right. Every path is a plain polyline (M and L only), so a pose is cheap to rebuild
 * on every frame of the live loop and easy to measure in tests.
 */

export type Pt = readonly [number, number];

/** the drawing's paper, in SVG user units */
export const SKETCH = { w: 500, h: 272 } as const;

const DEPTH: Pt = [60, -35];
const BLOCK = { left: 40, right: 316, top: 168, bottom: 234 } as const;
/** where the skin leaves the rock */
const PEEL = 178;
/** how much of the skin has come away; it is stone, so this length never changes */
const PEELED = BLOCK.right - PEEL;
/** radius of the bend where the skin lifts: wide, so it reads as a flexible sheet, not a lid */
const BEND = 50;
/** the skin's thickness on paper (1.5 mm, drawn thick enough to see) */
const SKIN = 2.4;
const FLAT = PEEL - BLOCK.left;

const rad = (d: number) => (d * Math.PI) / 180;
/** how far the skin has curled up from the rock, at rest and at the ends of its flex */
export const CURL = { min: rad(92), rest: rad(108), max: rad(124) } as const;

/** heights of the light that passes through the skin, all clear of the block */
const RAYS = [72, 90, 108];
const RAY_FROM = 474;
/** how far the warm light carries on past the stone */
const RAY_OUT = 66;

export const LABEL = { x: 474, y: 262, text: "1.5 mm · 2.8 kg/m²" } as const;

const f = (n: number) => String(Math.round(n * 100) / 100);
const line = (pts: readonly Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join(" ");
const plus = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];
const range = (from: number, to: number, steps: number) => Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps);

/**
 * A point on the skin's front edge (its underside), `s` units along the skin from the peel line
 * (negative: the part still lying on the rock), and the normal pointing out of its top face.
 * The skin leaves the rock in a circular bend and carries on straight, so it stays one length.
 */
function skinAt(s: number, curl: number): { p: Pt; n: Pt } {
  if (s <= 0) return { p: [PEEL + s, BLOCK.top], n: [0, -1] };
  const arc = BEND * curl;
  const a = Math.min(s, arc) / BEND;
  const bend: Pt = [PEEL + BEND * Math.sin(a), BLOCK.top - BEND + BEND * Math.cos(a)];
  const n: Pt = [-Math.sin(a), -Math.cos(a)];
  if (s <= arc) return { p: bend, n };
  return { p: plus(bend, [Math.cos(curl), -Math.sin(curl)], s - arc), n };
}

/** a point on the skin's top face, `v` of the way back through the block's depth */
const onSkin = (s: number, v: number, curl: number): Pt => {
  const { p, n } = skinAt(s, curl);
  return plus(plus(p, n, SKIN), DEPTH, v);
};

const along = (curl: number, from: number, to: number, steps: number, v: number) =>
  range(from, to, steps).map((s) => onSkin(s, v, curl));

/** the block and everything on paper that does not move */
export const BLOCK_PATHS = (() => {
  const { left: l, right: r, top: t, bottom: b } = BLOCK;
  const [dx, dy] = DEPTH;
  const wave = (y: number, k: number) =>
    range(l, r, 34).map((x): Pt => [x, y + 1.3 * Math.sin(x / 21 + k) + 0.7 * Math.sin(x / 8.5 + 2 * k)]);
  const strata = [14, 27, 41, 54].map((h, i) => {
    const front = wave(t + h, i * 1.7);
    const side: Pt[] = range(0, 1, 6).map((v) => [r + dx * v, t + h + dy * v + 0.8 * Math.sin(v * 5 + i)]);
    return `${line(front)} ${line(side)}`;
  });
  return {
    outline: line([
      [l, t],
      [r, t],
      [r, b],
      [l, b],
      [l, t],
    ]),
    faces: `${line([[l, t], [l + dx, t + dy], [r + dx, t + dy], [r, t]])} ${line([[r + dx, t + dy], [r + dx, b + dy], [r, b]])}`,
    peel: line([
      [PEEL, t],
      [PEEL + dx, t + dy],
    ]),
    strata,
    dims: [
      line([
        [l, b + 6],
        [l, b + 24],
      ]),
      line([
        [r, b + 6],
        [r, b + 24],
      ]),
      line([
        [l, b + 18],
        [r, b + 18],
      ]),
      line([
        [l - 4, b + 22],
        [l + 4, b + 14],
      ]),
      line([
        [r - 4, b + 22],
        [r + 4, b + 14],
      ]),
    ].join(" "),
  };
})();

export type SketchPose = {
  skinTop: string;
  skinBottom: string;
  skinBack: string;
  skinEnds: string;
  generators: string;
  veins: string;
  raysIn: string[];
  raysOut: string[];
  /** how far each ray of light travels before it meets the stone */
  lightIn: number[];
};

/** where light at height `y`, coming from the right, first meets the skin (half way back) */
function hit(y: number, curl: number): Pt {
  const mid = along(curl, 0, PEELED, 90, 0.5);
  for (let i = mid.length - 1; i > 0; i--) {
    const [a, b] = [mid[i - 1], mid[i]];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) {
      const k = (y - a[1]) / (b[1] - a[1]);
      return [a[0] + (b[0] - a[0]) * k, y];
    }
  }
  return [mid[mid.length - 1][0], y];
}

/** every line that moves as the skin flexes, for a curl between CURL.min and CURL.max */
export function posePaths(curl: number): SketchPose {
  const arc = BEND * curl;
  const tip = skinAt(PEELED, curl);
  const tipTop = plus(tip.p, tip.n, SKIN);
  const veinA = range(-FLAT + 8, PEELED - 6, 70).map((s) =>
    onSkin(s, 0.8 - (0.55 * (s + FLAT)) / (FLAT + PEELED) + 0.05 * Math.sin(s / 17), curl),
  );
  const veinB = range(-52, PEELED - 10, 50).map((s) => onSkin(s, 0.14 + (0.68 * (s + 52)) / (PEELED + 42) + 0.04 * Math.sin(s / 11 + 1), curl));
  const hits = RAYS.map((y) => hit(y, curl));
  return {
    skinTop: line(along(curl, -FLAT, PEELED, 80, 0)),
    skinBottom: line(range(0, PEELED, 60).map((s) => skinAt(s, curl).p)),
    skinBack: line(along(curl, -FLAT, PEELED, 80, 1)),
    skinEnds: [
      line([tip.p, tipTop, plus(tipTop, DEPTH)]),
      line([[BLOCK.left, BLOCK.top], onSkin(-FLAT, 0, curl), onSkin(-FLAT, 1, curl)]),
    ].join(" "),
    generators: [arc / 3, (2 * arc) / 3, arc, (arc + PEELED) / 2]
      .map((s) => line([onSkin(s, 0, curl), onSkin(s, 1, curl)]))
      .join(" "),
    veins: `${line(veinA)} ${line(veinB)}`,
    raysIn: hits.map((h) => line([[RAY_FROM, h[1]], h])),
    raysOut: hits.map((h) => line([h, [h[0] - RAY_OUT, h[1]]])),
    lightIn: hits.map((h) => RAY_FROM - h[0]),
  };
}
