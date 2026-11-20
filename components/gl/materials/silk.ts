/**
 * Quiet silk light (after Originkit's Reflect Background, recoloured to the palette):
 * a few thin folds of light drift slowly across the ground, glacier on one side and
 * backlight ivory on the other. Kept faint; it sits behind content, never competes with it.
 */
export const silkVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const silkFragment = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform float uStrength;
varying vec2 vUv;
void main() {
  vec2 p = vUv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.05;
  vec2 q = p * 1.8;
  q.x += 0.35 * sin(q.y * 1.7 + t * 3.0);
  q.y += 0.25 * sin(q.x * 1.3 - t * 2.0);
  float crest = pow(0.5 + 0.5 * sin(q.x * 2.2 + q.y * 1.4 + sin(q.y * 2.8 + t * 4.0) * 0.9), 16.0);
  float fold = pow(0.5 + 0.5 * sin(q.x * 1.1 - q.y * 2.3 + t * 2.5), 26.0);
  float a = crest * 0.7 + fold * 0.5;
  // fade out at the top and bottom of the chapter
  a *= smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
  vec3 col = mix(vec3(0.749, 0.890, 0.949), vec3(0.957, 0.914, 0.824), smoothstep(0.1, 0.9, vUv.x));
  gl_FragColor = vec4(col, a * uStrength);
}
`;
