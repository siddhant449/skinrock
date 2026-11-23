"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { SiteImage } from "@/content/site";
import { useGLLive } from "./useGLActive";
import { warm } from "@/lib/preload";
import { backlightTexture } from "@/lib/textureSize";

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
  const box = useRef<HTMLDivElement>(null);
  // the scene draws this stone: fetch its texture file now, so it is in before it is needed
  useEffect(() => {
    if (!live || !box.current) return;
    warm(backlightTexture(image.src, box.current.getBoundingClientRect(), image.width, image.height));
  }, [live, image]);
  return (
    <div ref={box} data-backlight="" data-gl={drawn ? "ready" : undefined} className={`overflow-hidden ${className}`}>
      {/* the photo and CSS glow stay until WebGL has drawn its first frame */}
      {!drawn ? (
        <>
          {/* phones: the top fifth of the shot shows site clutter (a plastic sheet, a track light),
              and the photo is nearly the frame's shape, so it is enlarged from its foot to push
              that strip out of the frame */}
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 768px) 50vw, 150vw"
            className="object-cover max-md:origin-[60%_100%] max-md:scale-[1.3] max-md:object-[50%_100%]"
          />
          <div aria-hidden className="backlight-veil absolute inset-0" />
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
