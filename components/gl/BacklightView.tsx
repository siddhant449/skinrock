"use client";

import { useEffect, useRef } from "react";
import { damp } from "@/lib/math";
import { backlightTexture } from "@/lib/textureSize";
import { onStage, type GLView } from "./stage";
import { backlightFragment, backlightVertex } from "./materials/backlight";

const WARM: [number, number, number] = [0xf4 / 255, 0xe9 / 255, 0xd2 / 255];
const COOL: [number, number, number] = [0xbf / 255, 0xe3 / 255, 0xf2 / 255];

type Props = {
  src: string;
  imageRes: [number, number];
  intensity: React.RefObject<{ value: number }>;
  onReady: () => void;
};

/** Lazily loaded WebGL half of BacklightStone. */
export default function BacklightView({ src, imageRes, intensity, onReady }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });
  const [iw, ih] = imageRes;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const light = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6, inside: false };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      light.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (light.inside) {
        light.tx = x;
        light.ty = y;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let dead = false;
    let remove = () => {};
    const cancel = onStage(async (stage) => {
      // fetched at drawn size; the shader frames the photo 1.22x tighter
      const tex = await stage.texture(backlightTexture(src, el.getBoundingClientRect(), iw, ih));
      if (dead) return;
      const gl = stage.gl;
      const prog = stage.program(backlightVertex, backlightFragment);
      const mesh = stage.plane(1, 1);
      const u = (n: string) => prog.uniform(n);
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
        draw: ({ time: t, dt, rect }) => {
          if (!light.inside) {
            // drift slowly when the pointer is elsewhere
            light.tx = 0.5 + Math.sin(t * 0.35) * 0.22;
            light.ty = 0.55 + Math.sin(t * 0.23 + 1.3) * 0.25;
          }
          light.x = damp(light.x, light.tx, 3, dt);
          light.y = damp(light.y, light.ty, 3, dt);
          prog.use();
          stage.material({ depthTest: false });
          stage.bindTexture(tex, u("uTex"));
          gl.uniform2f(u("uRes"), rect.width, rect.height);
          gl.uniform2f(u("uImageRes"), iw, ih);
          gl.uniform2f(u("uLight"), light.x, light.y);
          gl.uniform1f(u("uIntensity"), intensity.current?.value ?? 1);
          gl.uniform1f(u("uTime"), t);
          gl.uniform1f(u("uOffset"), (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight);
          gl.uniform3f(u("uWarm"), ...WARM);
          gl.uniform3f(u("uCool"), ...COOL);
          mesh.draw();
          markReady();
          return true; // the lamp breathes and drifts while it is on screen
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
  }, [src, iw, ih, intensity]);

  return <div ref={box} className="absolute inset-0" />;
}
