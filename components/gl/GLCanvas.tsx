"use client";

import { useEffect, useRef } from "react";
import { onPageScroll } from "@/lib/pageScroll";
import { Stage, publishStage } from "./stage";

/** The one shared canvas. Loaded lazily; see GLStage. */
export default function GLCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);

  // scroll speed feeds the shaders and keeps frames coming while the page moves
  useEffect(() => onPageScroll(({ velocity }) => stage.current?.scrolled(velocity)), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const s = Stage.create(canvas);
    if (!s) return; // no WebGL2: the DOM photos simply stay
    stage.current = s;
    publishStage(s);
    return () => {
      publishStage(null);
      stage.current = null;
      s.destroy();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100lvh", pointerEvents: "none", zIndex: 10, display: "block" }}
    />
  );
}
