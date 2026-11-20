"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { glReady } from "@/lib/glReady";
import { onLoaded } from "@/lib/loaded";
import { useGLActive, useGLLive } from "./useGLActive";

const GLCanvas = dynamic(() => import("./GLCanvas"), { ssr: false });

/**
 * One persistent, fixed canvas for the whole site. Sits above section backgrounds (z-10)
 * and below content layers (z-20). The WebGL code loads after the intro, on the visitor's
 * first interaction or 3 seconds later, so it never competes with first paint.
 */
export function GLStage() {
  const active = useGLActive();
  const live = useGLLive();

  useEffect(() => {
    if (!active) return;
    const events = ["wheel", "pointermove", "pointerdown", "touchstart", "keydown", "scroll"] as const;
    let timer = 0;
    const go = () => {
      glReady.set(true);
      cleanup();
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, go));
    };
    const offLoaded = onLoaded(() => {
      events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
      timer = window.setTimeout(go, 3000);
    });
    return () => {
      offLoaded();
      cleanup();
    };
  }, [active]);

  return live ? <GLCanvas /> : null;
}
