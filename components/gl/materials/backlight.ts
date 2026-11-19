import { coverGLSL, noiseGLSL } from "./stone";

/**
 * Light through stone. Brightness in the photo stands in for translucency: where the
 * stone is thin and clear, light passes; dark veins block it. uIntensity 0 is the
 * lamp off (a cool, dim, opaque slab), 1 is the lamp on, with a warm hotspot that
 * follows the pointer behind the sheet.
 */
export const backlightVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

export const backlightFragment = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImageRes;
uniform vec2 uLight;
uniform float uIntensity;
uniform float uTime;
uniform float uOffset;
uniform vec3 uWarm;
uniform vec3 uCool;
varying vec2 vUv;
${noiseGLSL}
${coverGLSL}
void main() {
  vec2 uv = vUv;
  // frame lower and tighter: the top of this photo shows site clutter
  uv = (uv - 0.5) / 1.22 + 0.5;
  uv.y += uOffset * 0.06 - 0.06;
  vec3 c = texture2D(uTex, cover(uv, uRes, uImageRes)).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  float t = pow(l, 1.35);

  // lamp off: dim, desaturated, faintly cool slab
  vec3 off = mix(vec3(l), c, 0.3) * 0.14 + uCool * 0.025;

  // lamp on: the hotspot sits behind the sheet and follows the pointer
  float aspect = uRes.x / uRes.y;
  vec2 d = (vUv - uLight) * vec2(aspect, 1.0);
  float fall = exp(-dot(d, d) * 2.2);
  float breathe = 0.94 + 0.06 * sin(uTime * 0.9) + 0.03 * noise(vUv * 3.0 + uTime * 0.15);
  float k = uIntensity * breathe;
  vec3 on = c * (0.3 + 0.95 * k * (0.55 + 0.6 * fall));
  on += uWarm * t * fall * k * 0.32;
  // the thinnest, clearest areas bloom a touch
  on += uWarm * smoothstep(0.62, 0.95, l) * fall * k * 0.18;

  vec3 col = mix(off, on, smoothstep(0.0, 1.0, uIntensity));
  gl_FragColor = vec4(col, 1.0);
}
`;
