"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useLenis } from "lenis/react";
import { clamp, damp } from "@/lib/math";

/** Lenis scroll velocity normalised to [-1, 1] and damped, for shader uniforms. */
export function useScrollVelocity() {
  const raw = useRef(0);
  const smooth = useRef(0);
  useLenis((lenis) => {
    raw.current = clamp(lenis.velocity / 40, -1, 1);
  });
  useFrame((_, dt) => {
    smooth.current = damp(smooth.current, raw.current, 6, Math.min(dt, 0.05));
    raw.current = damp(raw.current, 0, 4, Math.min(dt, 0.05));
  });
  return smooth;
}
