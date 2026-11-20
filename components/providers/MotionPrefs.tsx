"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

type MotionPrefs = {
  reduced: boolean;
  webgl: boolean;
  /** no hover or a coarse pointer (phones, tablets): gets touch versions of hover effects */
  touch: boolean;
};

const MotionPrefsContext = createContext<MotionPrefs>({ reduced: true, webgl: false, touch: false });

const QUERY = "(prefers-reduced-motion: reduce)";
/** touch devices: no hover, or a coarse primary pointer (phones, iPads) */
export const TOUCH_QUERY = "(hover: none), (pointer: coarse)";

const subscribeTo = (query: string) => (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeReduced = subscribeTo(QUERY);
// reactive: an iPad that connects a trackpad, or a laptop with touch, switches live
const subscribeTouch = subscribeTo(TOUCH_QUERY);

let webglCache: boolean | null = null;
/**
 * WebGL is a desktop and tablet enhancement: screens 768px+ with a fine pointer.
 * Phones get the DOM version (same motion, no 900 KB scene) to protect battery and frame rate.
 */
function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  if (!window.matchMedia("(min-width: 768px) and (pointer: fine)").matches) {
    webglCache = false;
    return webglCache;
  }
  try {
    const canvas = document.createElement("canvas");
    // the shared stage draws with WebGL2 only
    const gl = canvas.getContext("webgl2");
    webglCache = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
  const touch = useSyncExternalStore(subscribeTouch, () => window.matchMedia(TOUCH_QUERY).matches, () => false);
  return <MotionPrefsContext.Provider value={{ reduced, webgl, touch }}>{children}</MotionPrefsContext.Provider>;
}

export const useMotionPrefs = () => useContext(MotionPrefsContext);
