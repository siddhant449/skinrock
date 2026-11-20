import { coverGLSL } from "./stone";

/**
 * A stone sheet that curls around a cylinder as uBend goes 0 → 1.
 * The back face shows the pale flexible backing, which is the product's secret.
 */
export const bendVertex = /* glsl */ `
uniform float uBend;
uniform float uTime;
uniform vec2 uPointer;
uniform float uOffset; // pushes the surface along its normal: the edge layer sits a hair behind
varying vec2 vUv;
varying float vShade;
void main() {
  vUv = uv;
  vec3 p = position;
  // radius shrinks from almost flat to a tight curl
  float t = smoothstep(0.0, 1.0, uBend);
  float R = mix(9.0, 0.62, t);
  float theta = p.x / R;
  vec3 bent = vec3(R * sin(theta), p.y, R * (1.0 - cos(theta)));
  // a gentle counter curve, so the sheet makes a soft S instead of a plain roll
  bent.z -= sin(p.x * 1.6) * 0.12 * t;
  // a gentle diagonal twist so it reads as a flexible sheet, not a tube
  float twist = uBend * 0.35 * p.y;
  bent.xz = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * bent.xz;
  // breathing
  bent.y += sin(uTime * 0.8 + p.x * 1.4) * 0.015;
  vec3 n = normalize(vec3(sin(theta), 0.0, cos(theta)));
  bent -= n * uOffset;
  vec3 L = normalize(vec3(-0.4 + uPointer.x * 0.6, 0.5 + uPointer.y * 0.4, 0.9));
  vShade = 0.45 + 0.65 * max(dot(n, L), 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(bent, 1.0);
}
`;

export const bendFragment = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uImageRes;
uniform vec2 uSheetRes;
uniform vec3 uBacking;
varying vec2 vUv;
varying float vShade;
${coverGLSL}
void main() {
  vec3 col;
  if (gl_FrontFacing) {
    col = texture2D(uTex, cover(vUv, uSheetRes, uImageRes)).rgb * vShade;
  } else {
    col = uBacking * (0.55 + 0.35 * vShade);
  }
  // hairline edge so the 1.5 mm sheet reads as a sheet
  float edge = smoothstep(0.0, 0.006, vUv.x) * smoothstep(0.0, 0.006, 1.0 - vUv.x)
             * smoothstep(0.0, 0.012, vUv.y) * smoothstep(0.0, 0.012, 1.0 - vUv.y);
  col = mix(vec3(0.93, 0.91, 0.88), col, edge);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** The stone's cut edge: a flat pale layer drawn just behind the sheet, visible only at its rim. */
export const bendEdgeFragment = /* glsl */ `
varying vec2 vUv;
varying float vShade;
void main() {
  if (!gl_FrontFacing) discard; // where the back shows, the sheet draws its own backing
  gl_FragColor = vec4(vec3(0.86, 0.83, 0.78) * (0.7 + 0.3 * vShade), 1.0);
}
`;
