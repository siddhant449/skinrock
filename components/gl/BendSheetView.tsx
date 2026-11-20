"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/math";
import { TEXTURE_WIDTHS, textureUrl } from "@/lib/textureSize";
import { onStage, type GLView } from "./stage";
import { bendEdgeFragment, bendFragment, bendVertex } from "./materials/bend";

const SHEET_W = 2.5;
const SHEET_H = 1.2;
// the camera the sheet was designed with: perspective, fov 34, at z 3.4
const FOV = 34;
const CAMERA_Z = 3.4;
const NEAR = 0.1;
const FAR = 2000;

type Props = { src: string; imageRes: [number, number]; progress: React.RefObject<{ value: number }>; onReady: () => void };

/** Column-major perspective projection, as three's PerspectiveCamera builds it. */
function perspective(out: Float32Array, aspect: number) {
  const top = NEAR * Math.tan((Math.PI / 180) * 0.5 * FOV);
  const height = 2 * top;
  const width = aspect * height;
  out.fill(0);
  out[0] = (2 * NEAR) / width;
  out[5] = (2 * NEAR) / height;
  out[10] = -(FAR + NEAR) / (FAR - NEAR);
  out[11] = -1;
  out[14] = (-2 * FAR * NEAR) / (FAR - NEAR);
}

/** Camera view times the mesh's XYZ Euler rotation (three's makeRotationFromEuler). */
function modelView(out: Float32Array, x: number, y: number, z: number) {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  out[0] = c * e;
  out[4] = -c * f;
  out[8] = d;
  out[1] = af + be * d;
  out[5] = ae - bf * d;
  out[9] = -b * c;
  out[2] = bf - ae * d;
  out[6] = be + af * d;
  out[10] = a * c;
  out[3] = out[7] = out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = -CAMERA_Z;
  out[15] = 1;
}

/** Lazily loaded WebGL half of BendSheet. */
export default function BendSheetView({ src, imageRes, progress, onReady }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });
  const [iw, ih] = imageRes;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let dead = false;
    let remove = () => {};
    const cancel = onStage(async (stage) => {
      // the close-up is smaller than the sheet is drawn, so it comes at full size (re-encoded)
      const tex = await stage.texture(textureUrl(src, TEXTURE_WIDTHS.find((w) => w >= iw) ?? 2048));
      if (dead) return;
      const gl = stage.gl;
      const prog = stage.program(bendVertex, bendFragment);
      const edgeProg = stage.program(bendVertex, bendEdgeFragment);
      const mesh = stage.plane(SHEET_W, SHEET_H, 96, 24);
      const u = (n: string) => prog.uniform(n);
      const proj = new Float32Array(16);
      const mv = new Float32Array(16);
      // like the old useFrame hooks, a view counts as ready once the stage runs it, on screen
      // or not, so an off-screen DOM twin is dropped before it would ever be fetched
      let first = true;
      const markReady = () => {
        if (!first) return;
        first = false;
        requestAnimationFrame(() => ready.current());
      };
      const view: GLView = {
        el,
        offscreen: markReady,
        pointer: true,
        draw: ({ time, dt, rect }) => {
          pointer.x = damp(pointer.x, pointer.tx, 4, dt);
          pointer.y = damp(pointer.y, pointer.ty, 4, dt);
          const bend = progress.current?.value ?? 0;
          perspective(proj, rect.width / rect.height);
          modelView(mv, -0.12 + pointer.y * 0.12, -0.35 + bend * 0.9 + pointer.x * 0.18, 0.06 - bend * 0.1);
          // the edge layer first, a hair behind the sheet: it shows only at the rim, as thickness
          edgeProg.use();
          stage.material({ depthTest: true });
          gl.uniformMatrix4fv(edgeProg.uniform("projectionMatrix"), false, proj);
          gl.uniformMatrix4fv(edgeProg.uniform("modelViewMatrix"), false, mv);
          gl.uniform1f(edgeProg.uniform("uBend"), bend);
          gl.uniform1f(edgeProg.uniform("uTime"), time);
          gl.uniform2f(edgeProg.uniform("uPointer"), pointer.x, pointer.y);
          gl.uniform1f(edgeProg.uniform("uOffset"), 0.016);
          mesh.draw();
          prog.use();
          stage.material({ depthTest: true });
          stage.bindTexture(tex, u("uTex"));
          gl.uniformMatrix4fv(u("projectionMatrix"), false, proj);
          gl.uniformMatrix4fv(u("modelViewMatrix"), false, mv);
          gl.uniform2f(u("uImageRes"), iw, ih);
          gl.uniform2f(u("uSheetRes"), SHEET_W, SHEET_H);
          gl.uniform3f(u("uBacking"), 0xec / 255, 0xe6 / 255, 0xda / 255);
          gl.uniform1f(u("uBend"), bend);
          gl.uniform1f(u("uTime"), time);
          gl.uniform2f(u("uPointer"), pointer.x, pointer.y);
          gl.uniform1f(u("uOffset"), 0);
          mesh.draw();
          markReady();
          return true; // the sheet breathes while it is on screen
        },
      };
      stage.add(view);
      remove = () => stage.remove(view);
    });
    return () => {
      dead = true;
      window.removeEventListener("pointermove", onMove);
      cancel();
      remove();
    };
  }, [src, iw, ih, progress]);

  return <div ref={box} className="absolute inset-0" />;
}
