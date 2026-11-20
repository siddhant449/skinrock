"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { SiteImage } from "@/content/site";
import { useGLLive } from "./useGLActive";

const BacklightView = dynamic(() => import("./BacklightView"), { ssr: false });

type Props = {
  image: SiteImage;
  /** 0 = lamp off, 1 = lamp on; written by the section's scroll timeline */
  intensity: React.RefObject<{ value: number }>;
  className?: string;
};

/** Translucent stone with a pointer-driven light behind it. DOM image + CSS glow until WebGL is live. */
export function BacklightStone({ image, intensity, className = "relative" }: Props) {
  const live = useGLLive();
  const [ready, setReady] = useState(false);
  const drawn = live && ready;
  return (
    <div data-backlight="" data-gl={drawn ? "ready" : undefined} className={`overflow-hidden ${className}`}>
      {/* the photo and CSS glow stay until WebGL has drawn its first frame */}
      {!drawn ? (
        <>
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          <div aria-hidden className="backlight-fallback absolute inset-0" />
        </>
      ) : (
        <span className="sr-only">{image.alt}</span>
      )}
      {live && (
        <BacklightView
          src={image.src}
          imageRes={[image.width, image.height]}
          intensity={intensity}
          onReady={() => setReady(true)}
        />
      )}
    </div>
  );
}
