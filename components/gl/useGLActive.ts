"use client";

import { useSyncExternalStore } from "react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { glReady } from "@/lib/glReady";

/** WebGL is wanted on this device (supported and motion allowed). No three.js imported here. */
export const useGLActive = () => {
  const { webgl, reduced } = useMotionPrefs();
  return webgl && !reduced;
};

/** WebGL is wanted AND the page has gone idle, so the heavy GL chunks may load now. */
export const useGLLive = () => {
  const active = useGLActive();
  const ready = useSyncExternalStore(glReady.subscribe, glReady.get, () => false);
  return active && ready;
};
