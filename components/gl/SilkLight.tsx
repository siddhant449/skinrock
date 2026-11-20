"use client";

import dynamic from "next/dynamic";
import { useGLLive } from "./useGLActive";

const SilkLightView = dynamic(() => import("./SilkLightView"), { ssr: false });

/** Decorative silk light behind a chapter. Nothing on phones, without WebGL or with reduced motion. */
export function SilkLight({ strength = 0.16, className = "pointer-events-none absolute inset-0" }: { strength?: number; className?: string }) {
  const live = useGLLive();
  return (
    <div aria-hidden data-silk="" className={className}>
      {live && <SilkLightView strength={strength} />}
    </div>
  );
}
