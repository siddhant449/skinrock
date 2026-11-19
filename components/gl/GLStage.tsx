"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

export const useGLActive = () => {
  const { webgl, reduced } = useMotionPrefs();
  return webgl && !reduced;
};

/**
 * One persistent, fixed canvas for the whole site. Sits above section backgrounds (z-10)
 * and below content layers (z-20), so DOM text always stays on top of WebGL imagery.
 */
export function GLStage() {
  const active = useGLActive();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return;
    // mount after first paint so WebGL never competes with LCP
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const id = ric(() => setMounted(true));
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.cancelIdleCallback?.(id as number);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active]);

  if (!active || !mounted) return null;

  return (
    <Canvas
      aria-hidden
      flat
      linear
      dpr={[1, 1.75]}
      frameloop={visible ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100lvh", pointerEvents: "none", zIndex: 10 }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
    >
      <View.Port />
    </Canvas>
  );
}
