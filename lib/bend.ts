/**
 * The bending stone sheet (components/gl/BendSheetView.tsx + materials/bend.ts).
 *
 * The motion is the original one (a sheet that curls and turns as you scroll). Taken all the
 * way it folds over and shows its backing, which reads as a broken image, so the scroll only
 * drives it up to `maxBend`: the furthest point where every part of the stone face still looks
 * at the viewer. `faceTowardCamera` mirrors the vertex shader and the view's camera exactly, and
 * tests/unit/bend.test.ts checks the whole scroll range against it.
 */
export const BEND = {
  width: 2.5,
  height: 1.2,
  flatRadius: 9,
  minRadius: 0.62,
  twist: 0.35,
  /** turn around the vertical axis: start, plus this much per unit of bend */
  turnFrom: -0.35,
  turnBy: 0.9,
  pointerTurn: 0.18,
  tilt: -0.12,
  pointerTilt: 0.12,
  rollFrom: 0.06,
  rollBy: -0.1,
  cameraZ: 3.4,
  /** the furthest the scroll bends the sheet (see the note above) */
  maxBend: 0.78,
} as const;

/** Scroll progress (0 → 1) to the shader's bend amount. */
export const sheetBend = (progress: number) => Math.min(1, Math.max(0, progress)) * BEND.maxBend;

/** Euler angles (x tilt, y turn, z roll) for a bend and a pointer position (-1 to 1). */
export function sheetRotation(bend: number, px: number, py: number): [number, number, number] {
  return [
    BEND.tilt + py * BEND.pointerTilt,
    BEND.turnFrom + bend * BEND.turnBy + px * BEND.pointerTurn,
    BEND.rollFrom + bend * BEND.rollBy,
  ];
}

const smoothstep = (x: number) => x * x * (3 - 2 * x);
type V = [number, number, number];

/** three's makeRotationFromEuler (order XYZ) applied to a vector. */
function rotate([x, y, z]: V, [rx, ry, rz]: [number, number, number]): V {
  const a = Math.cos(rx), b = Math.sin(rx), c = Math.cos(ry), d = Math.sin(ry), e = Math.cos(rz), f = Math.sin(rz);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  return [
    c * e * x - c * f * y + d * z,
    (af + be * d) * x + (ae - bf * d) * y - b * c * z,
    (bf - ae * d) * x + (be + af * d) * y + a * c * z,
  ];
}

/**
 * Worst case over the sheet of how squarely the stone face points at the camera: the cosine
 * between the surface's front normal and the direction to the camera (below 0 the back shows).
 */
export function faceTowardCamera(bend: number, px: number, py = px): number {
  const R = BEND.flatRadius + (BEND.minRadius - BEND.flatRadius) * smoothstep(bend);
  const rot = sheetRotation(bend, px, py);
  let worst = Infinity;
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40 - 0.5) * BEND.width;
    for (let j = 0; j <= 4; j++) {
      const y = (j / 4 - 0.5) * BEND.height;
      const th = x / R;
      // the vertex shader: arc, then the twist (GLSL mat2 is column-major)
      let p: V = [R * Math.sin(th), y, R * (1 - Math.cos(th))];
      let n: V = [-Math.sin(th), 0, Math.cos(th)];
      const tw = bend * BEND.twist * y;
      const ct = Math.cos(tw), st = Math.sin(tw);
      p = [ct * p[0] + st * p[2], p[1], -st * p[0] + ct * p[2]];
      n = [ct * n[0] + st * n[2], n[1], -st * n[0] + ct * n[2]];
      // the view: rotate, then the camera sits CAMERA_Z in front
      const q = rotate(p, rot);
      const m = rotate(n, rot);
      const toCam: V = [-q[0], -q[1], BEND.cameraZ - q[2]];
      const len = Math.hypot(...toCam);
      worst = Math.min(worst, (m[0] * toCam[0] + m[1] * toCam[1] + m[2] * toCam[2]) / len);
    }
  }
  return worst;
}
