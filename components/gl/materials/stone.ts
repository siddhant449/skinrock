/** Shaders for DOM-tracked stone photographs. The quad fills its View's viewport directly. */

export const noiseGLSL = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
`;

export const coverGLSL = /* glsl */ `
vec2 cover(vec2 uv, vec2 res, vec2 imageRes) {
  float rs = res.x / res.y, ri = imageRes.x / imageRes.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}
`;

export const stoneVertex = /* glsl */ `
uniform float uVelocity;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // the sheet flexes slightly with scroll speed: a nod to flexible stone
  p.y += sin(uv.x * 3.14159) * uVelocity * 0.035;
  gl_Position = vec4(p.xy * 2.0, 0.0, 1.0);
}
`;

export const stoneFragment = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImageRes;
uniform vec3 uGrade;
uniform float uGradeAmt;
uniform float uVelocity;
uniform float uReveal;
uniform float uTime;
uniform float uParallax;
uniform float uOffset;
varying vec2 vUv;
${noiseGLSL}
${coverGLSL}
void main() {
  vec2 uv = vUv;
  // parallax: zoom in so the image can drift inside its frame
  float zoom = 1.0 + uParallax * 2.0;
  uv = (uv - 0.5) / zoom + 0.5;
  uv.y += uOffset * uParallax;
  // velocity ripple
  uv.x += sin(uv.y * 9.0 + uTime * 1.2) * uVelocity * 0.004;
  vec2 cuv = cover(uv, uRes, uImageRes);
  float shift = uVelocity * 0.0025;
  vec3 col = vec3(
    texture2D(uTex, cuv + vec2(0.0, shift)).r,
    texture2D(uTex, cuv).g,
    texture2D(uTex, cuv - vec2(0.0, shift)).b
  );
  // grade: pull shadows toward the palette's ink blue, keep highlights as stone
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 graded = mix(col, col * uGrade * 2.6, uGradeAmt * smoothstep(0.85, 0.05, luma));
  // reveal bottom-up with a mineral, noisy edge
  float n = noise(vUv * vec2(5.0, 2.5) + uTime * 0.05);
  float front = uReveal * 1.3 - 0.15;
  float a = 1.0 - smoothstep(front - 0.08, front, vUv.y + n * 0.15);
  a = uReveal >= 1.0 ? 1.0 : a;
  gl_FragColor = vec4(graded, a);
}
`;

/** Ink-blue shadow grade (#1E3A5C) as linear-ish RGB for the shader. */
export const GRADE_INK: [number, number, number] = [0x1e / 255, 0x3a / 255, 0x5c / 255];
