"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

/** The one shared canvas. Loaded lazily; see GLStage. */
export default function GLCanvas() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return (
    <Canvas
      aria-hidden
      flat
      linear
      dpr={[1, 1.75]}
      frameloop={visible ? "always" : "never"}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100lvh", pointerEvents: "none", zIndex: 10 }}
      eventSource={document.body}
    >
      <View.Port />
    </Canvas>
  );
}
