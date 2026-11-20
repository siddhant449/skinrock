/**
 * The one shared WebGL2 canvas, without three.js or react-three-fiber.
 *
 * Every photo plane is a "view": a DOM element whose box is the viewport and scissor
 * rectangle of one draw call (what drei's <View> did). The stage draws on GSAP's ticker,
 * after Lenis and ScrollTrigger have moved the page, and only while something changes:
 * scrolling (plus a tail for scrubbed tweens to settle), resizes, pointer moves over
 * pointer-driven views, or a view that reports it is still animating.
 *
 * Output matches the previous three.js setup: raw texture values (NoColorSpace, `linear`,
 * `flat`), three's ShaderMaterial GLSL 3 prelude, NormalBlending for transparent planes,
 * an alpha canvas with premultipliedAlpha and no preserved drawing buffer.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, damp } from "@/lib/math";

export type FrameInfo = {
  gl: WebGL2RenderingContext;
  /** seconds since the stage started */
  time: number;
  /** seconds since the previous drawn frame, capped at 0.05 */
  dt: number;
  /** the view element's box (CSS px) */
  rect: DOMRect;
  /** damped Lenis velocity in [-1, 1] */
  velocity: number;
};

export type GLView = {
  el: HTMLElement;
  /** draws into the view's viewport; returns true while it needs more frames */
  draw: (f: FrameInfo) => boolean;
  /** pointer moves should redraw this view while it is on screen */
  pointer?: boolean;
  /** called instead of draw while the view is off screen */
  offscreen?: () => void;
};

export type Program = {
  use: () => void;
  uniform: (name: string) => WebGLUniformLocation | null;
};

export type Mesh = { draw: () => void };

const MAX_DPR = 1.75;
/** keep drawing this long after the last scroll event: scrubbed timelines ease in behind it */
const SCROLL_TAIL_MS = 2000;
const POINTER_TAIL_MS = 1500;

// three's ShaderMaterial prelude for WebGL2 (the parts these shaders rely on)
const VERTEX_PRELUDE = `#version 300 es
precision highp float;
precision highp int;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
in vec3 position;
in vec2 uv;
#define attribute in
#define varying out
#define texture2D texture
`;
const FRAGMENT_PRELUDE = `#version 300 es
precision highp float;
precision highp int;
#define varying in
layout(location = 0) out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define texture2D texture
`;

const IMG_ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";

/**
 * createImageBitmap with options decodes on a worker thread. Same guard as three's GLTFLoader:
 * Safari before 17 and Firefox before 98 lack the options used here, so they take the <img> path.
 */
function bitmapsSupported() {
  if (typeof createImageBitmap === "undefined") return false;
  const ua = navigator.userAgent;
  if (/^((?!chrome|android).)*safari/i.test(ua)) {
    const v = ua.match(/version\/(\d+)/i);
    return !!v && Number(v[1]) >= 17;
  }
  const ff = ua.match(/firefox\/(\d+)/i);
  return !ff || Number(ff[1]) >= 98;
}

/** Decoded photo, flipped for WebGL (bitmaps are flipped while decoding, images on upload). */
async function decode(url: string): Promise<{ source: TexImageSource; flip: boolean }> {
  const viaImage = () =>
    new Promise<{ source: TexImageSource; flip: boolean }>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve({ source: img, flip: true });
      img.onerror = reject;
      img.src = url;
    });
  if (!bitmapsSupported()) return viaImage();
  try {
    // Chrome's own <img> Accept header: the optimizer answers with AVIF or WebP, and when the
    // DOM image already fetched this exact URL the response comes from the HTTP cache
    const r = await fetch(url, { credentials: "same-origin", headers: { Accept: IMG_ACCEPT } });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const bitmap = await createImageBitmap(await r.blob(), {
      imageOrientation: "flipY",
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
    });
    return { source: bitmap, flip: false };
  } catch {
    return viaImage();
  }
}

export class Stage {
  readonly gl: WebGL2RenderingContext;
  private views = new Set<GLView>();
  private programs = new Map<string, Program>();
  private textures = new Map<string, Promise<WebGLTexture>>();
  private running = false;
  private awakeUntil = 0;
  private pointerViewsOnScreen = false;
  private start = performance.now();
  private last = 0;
  private rawVelocity = 0;
  private velocity = 0;
  private cssW = 0;
  private cssH = 0;
  private dpr = 1;
  private disposers: (() => void)[] = [];

  private constructor(
    readonly canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
  ) {
    this.gl = gl;
    this.attach();
  }

  private attached = false;

  private attach() {
    if (this.attached) return;
    this.attached = true;
    const wake = () => this.wake(SCROLL_TAIL_MS);
    const onPointer = () => {
      if (this.pointerViewsOnScreen) this.wake(POINTER_TAIL_MS);
    };
    window.addEventListener("resize", wake);
    window.addEventListener("pointermove", onPointer, { passive: true });
    ScrollTrigger.addEventListener("refresh", wake);
    this.disposers = [
      () => window.removeEventListener("resize", wake),
      () => window.removeEventListener("pointermove", onPointer),
      () => ScrollTrigger.removeEventListener("refresh", wake),
    ];
  }

  /**
   * One stage per canvas. React may mount, clean up and mount the same canvas again
   * (Strict Mode); the second mount revives the first stage, so views that already
   * hold it keep drawing on the live one.
   */
  static create(canvas: HTMLCanvasElement): Stage | null {
    const existing = stages.get(canvas);
    if (existing) {
      existing.attach();
      existing.wake(SCROLL_TAIL_MS);
      return existing;
    }
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: true,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;
    const stage = new Stage(canvas, gl);
    stages.set(canvas, stage);
    return stage;
  }

  /** Lenis scroll: feeds the velocity uniform and keeps frames coming. */
  scrolled(lenisVelocity: number) {
    this.rawVelocity = clamp(lenisVelocity / 40, -1, 1);
    this.wake(SCROLL_TAIL_MS);
  }

  add(view: GLView) {
    this.views.add(view);
    this.wake(SCROLL_TAIL_MS);
  }

  remove(view: GLView) {
    this.views.delete(view);
    this.wake(100); // clear the area it drew
  }

  wake(ms: number) {
    this.awakeUntil = Math.max(this.awakeUntil, performance.now() + ms);
    if (this.running || !this.attached) return;
    this.running = true;
    this.last = performance.now();
    gsap.ticker.add(this.tick);
  }

  private sleep() {
    this.running = false;
    gsap.ticker.remove(this.tick);
  }

  private resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const dpr = clamp(window.devicePixelRatio || 1, 1, MAX_DPR);
    if (w === this.cssW && h === this.cssH && dpr === this.dpr) return;
    this.cssW = w;
    this.cssH = h;
    this.dpr = dpr;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
  }

  private tick = () => {
    const gl = this.gl;
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.velocity = damp(this.velocity, this.rawVelocity, 6, dt);
    this.rawVelocity = damp(this.rawVelocity, 0, 4, dt);
    this.resize();

    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);

    const time = (now - this.start) / 1000;
    const canvasBox = this.canvas.getBoundingClientRect();
    let busy = false;
    let pointerViews = false;
    for (const v of this.views) {
      const rect = v.el.getBoundingClientRect();
      const offscreen = rect.bottom < 0 || rect.top > canvasBox.height || rect.right < 0 || rect.left > canvasBox.width;
      if (offscreen || rect.width === 0 || rect.height === 0) {
        v.offscreen?.();
        continue;
      }
      // three's setViewport/setScissor: CSS px times pixel ratio, rounded
      const left = Math.round((rect.left - canvasBox.left) * this.dpr);
      const bottom = Math.round((canvasBox.top + canvasBox.height - rect.bottom) * this.dpr);
      const width = Math.round(rect.width * this.dpr);
      const height = Math.round(rect.height * this.dpr);
      gl.viewport(left, bottom, width, height);
      gl.scissor(left, bottom, width, height);
      if (v.draw({ gl, time, dt, rect, velocity: this.velocity })) busy = true;
      if (v.pointer) pointerViews = true;
    }
    this.pointerViewsOnScreen = pointerViews;

    if (!busy && now > this.awakeUntil && Math.abs(this.velocity) < 1e-4) this.sleep();
  };

  /** Compiles (once) a three-style ShaderMaterial pair. */
  program(vertex: string, fragment: string): Program {
    const key = vertex + "\0" + fragment;
    const hit = this.programs.get(key);
    if (hit) return hit;
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const p = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERTEX_PRELUDE + vertex);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_PRELUDE + fragment);
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, "position");
    gl.bindAttribLocation(p, 1, "uv");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = `${gl.getShaderInfoLog(vs)}\n${gl.getShaderInfoLog(fs)}\n${gl.getProgramInfoLog(p)}`;
      throw new Error(`stage: shader failed to compile\n${log}`);
    }
    const locations = new Map<string, WebGLUniformLocation | null>();
    const program: Program = {
      use: () => gl.useProgram(p),
      uniform: (name) => {
        if (!locations.has(name)) locations.set(name, gl.getUniformLocation(p, name));
        return locations.get(name)!;
      },
    };
    this.programs.set(key, program);
    return program;
  }

  /** three's PlaneGeometry(width, height, widthSegments, heightSegments): same vertices, uvs and winding. */
  plane(width: number, height: number, segX = 1, segY = 1): Mesh {
    const gl = this.gl;
    const pos: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    for (let iy = 0; iy <= segY; iy++) {
      const y = iy * (height / segY) - height / 2;
      for (let ix = 0; ix <= segX; ix++) {
        const x = ix * (width / segX) - width / 2;
        pos.push(x, -y, 0);
        uvs.push(ix / segX, 1 - iy / segY);
      }
    }
    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = ix + (segX + 1) * iy;
        const b = ix + (segX + 1) * (iy + 1);
        const c = ix + 1 + (segX + 1) * (iy + 1);
        const d = ix + 1 + (segX + 1) * iy;
        idx.push(a, b, d, b, c, d);
      }
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = (data: Float32Array, loc: number, size: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    buffer(new Float32Array(pos), 0, 3);
    buffer(new Float32Array(uvs), 1, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const count = idx.length;
    return {
      draw: () => {
        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
      },
    };
  }

  /**
   * A photo as a texture, decoded off the main thread and uploaded straight away.
   * Cached per URL. `mipmaps: false` suits planes drawn at about their texture size.
   */
  texture(url: string, { mipmaps = true } = {}): Promise<WebGLTexture> {
    const key = `${url}|${mipmaps}`;
    let p = this.textures.get(key);
    if (!p) {
      p = decode(url).then(({ source, flip }) => {
        const gl = this.gl;
        const t = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (source instanceof ImageBitmap) source.close();
        return t;
      });
      this.textures.set(key, p);
    }
    return p;
  }

  /** Blend, depth and culling state of a three material (no culling: planes face the camera). */
  material({ transparent = false, depthTest = true }: { transparent?: boolean; depthTest?: boolean }) {
    const gl = this.gl;
    gl.disable(gl.CULL_FACE);
    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }
    if (depthTest) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
    } else {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
    }
  }

  bindTexture(tex: WebGLTexture, location: WebGLUniformLocation | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(location, 0);
  }

  /** Stops drawing and listening. Views stay registered in case the canvas mounts again. */
  destroy() {
    this.sleep();
    this.disposers.forEach((d) => d());
    this.disposers = [];
    this.attached = false;
  }
}

// --- the live stage, for views that mount before or after the canvas -----------------------

const stages = new WeakMap<HTMLCanvasElement, Stage>();

let current: Stage | null = null;
const waiting = new Set<(s: Stage) => void>();

export function publishStage(s: Stage | null) {
  current = s;
  if (s) {
    waiting.forEach((cb) => cb(s));
    waiting.clear();
  }
}

/** Calls back with the stage once the canvas exists; returns a cancel function. */
export function onStage(cb: (s: Stage) => void): () => void {
  if (current) {
    cb(current);
    return () => {};
  }
  waiting.add(cb);
  return () => waiting.delete(cb);
}
