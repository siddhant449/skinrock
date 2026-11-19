"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

type MotionPrefs = { reduced: boolean; webgl: boolean };

const MotionPrefsContext = createContext<MotionPrefs>({ reduced: true, webgl: false });

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

let webglCache: boolean | null = null;
function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglCache = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

const noop = () => () => {};

export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  // Server snapshot is "reduced, no webgl" so SSR HTML is the static, fully visible version.
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(QUERY).matches, () => true);
  const webgl = useSyncExternalStore(noop, detectWebGL, () => false);
  return <MotionPrefsContext.Provider value={{ reduced, webgl }}>{children}</MotionPrefsContext.Provider>;
}

export const useMotionPrefs = () => useContext(MotionPrefsContext);
