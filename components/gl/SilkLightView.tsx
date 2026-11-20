"use client";

import { useEffect, useRef } from "react";
import { onStage, type GLView } from "./stage";
import { silkFragment, silkVertex } from "./materials/silk";

/** Lazily loaded WebGL half of SilkLight: one full-rect quad on the shared stage. */
export default function SilkLightView({ strength }: { strength: number }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let remove = () => {};
    const cancel = onStage((stage) => {
      const gl = stage.gl;
      const prog = stage.program(silkVertex, silkFragment);
      const quad = stage.plane(2, 2);
      const view: GLView = {
        el,
        draw: ({ time, rect }) => {
          prog.use();
          stage.material({ transparent: true, depthTest: false });
          gl.uniform1f(prog.uniform("uTime"), time);
          gl.uniform2f(prog.uniform("uRes"), rect.width, rect.height);
          gl.uniform1f(prog.uniform("uStrength"), strength);
          quad.draw();
          return true; // drifts while it is on screen
        },
      };
      stage.add(view);
      remove = () => stage.remove(view);
    });
    return () => {
      cancel();
      remove();
    };
  }, [strength]);
  return <div ref={box} className="absolute inset-0" />;
}
