"use client";

import { useEffect, useRef } from "react";
import { glImageTexture } from "@/lib/textureSize";
import { onStage, type GLView } from "./stage";
import { GRADE_INK, stoneFragment, stoneVertex } from "./materials/stone";

type Props = {
  src: string;
  imageWidth: number;
  imageHeight: number;
  grade: number;
  parallax: number;
  reveal: React.RefObject<{ value: number }>;
  onReady: () => void;
};

/** Lazily loaded WebGL half of GLImage: a view on the shared stage tracking the shell's box. */
export default function GLImageView({ src, imageWidth, imageHeight, grade, parallax, reveal, onReady }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let dead = false;
    let view: GLView | null = null;
    let remove = () => {};
    const cancel = onStage(async (stage) => {
      // fetched at the size it is drawn; raw pass-through: the shader works on the stored values
      const tex = await stage.texture(glImageTexture(src, el.getBoundingClientRect(), imageWidth, imageHeight, parallax), { mipmaps: false });
      if (dead) return;
      const gl = stage.gl;
      const prog = stage.program(stoneVertex, stoneFragment);
      const mesh = stage.plane(1, 1, 24, 24);
      const u = (n: string) => prog.uniform(n);
      // like the old useFrame hooks, a view counts as ready once the stage runs it, on screen
      // or not, so an off-screen DOM twin is dropped before it would ever be fetched
      let first = true;
      const markReady = () => {
        if (!first) return;
        first = false;
        requestAnimationFrame(() => ready.current());
      };
      let lastReveal = -1;
      view = {
        el,
        offscreen: markReady,
        draw: ({ time, rect, velocity }) => {
          prog.use();
          stage.material({ transparent: true, depthTest: false });
          stage.bindTexture(tex, u("uTex"));
          const rv = reveal.current?.value ?? 1;
          gl.uniform2f(u("uRes"), rect.width, rect.height);
          gl.uniform2f(u("uImageRes"), imageWidth, imageHeight);
          gl.uniform3f(u("uGrade"), ...GRADE_INK);
          gl.uniform1f(u("uGradeAmt"), grade);
          gl.uniform1f(u("uParallax"), parallax);
          gl.uniform1f(u("uOffset"), (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight);
          gl.uniform1f(u("uVelocity"), velocity);
          gl.uniform1f(u("uReveal"), rv);
          gl.uniform1f(u("uTime"), time);
          mesh.draw();
          markReady();
          // until the reveal completes the edge moves with time, and the shell may set or
          // tween the value at any moment (GSAP writes the ref; nothing else wakes the stage)
          const animating = rv < 1 || rv !== lastReveal;
          lastReveal = rv;
          return animating;
        },
      };
      stage.add(view);
      remove = () => stage.remove(view!);
    });
    return () => {
      dead = true;
      cancel();
      remove();
    };
  }, [src, imageWidth, imageHeight, grade, parallax, reveal]);

  return <div ref={box} className="absolute inset-0" data-gl-view="" />;
}
