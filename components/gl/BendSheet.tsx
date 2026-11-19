"use client";

import { useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { SiteImage } from "@/content/site";
import { useGLLive } from "./useGLActive";

const BendSheetView = dynamic(() => import("./BendSheetView"), { ssr: false });

type Props = {
  image: SiteImage;
  /** 0 → 1, written by the section's scroll timeline */
  progress: React.RefObject<{ value: number }>;
  className?: string;
};

/** DOM image until WebGL is live, then a sheet of stone that curls with scroll. */
export function BendSheet({ image, progress, className = "relative" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const live = useGLLive();
  return (
    <div ref={wrap} data-bend="" data-gl={live ? "on" : undefined} className={className}>
      {!live ? (
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="rounded-sm object-cover" />
      ) : (
        <>
          {/* keep the alt text for assistive tech when the photo is drawn in WebGL */}
          <span className="sr-only">{image.alt}</span>
          <BendSheetView src={image.src} imageRes={[image.width, image.height]} progress={progress} />
        </>
      )}
    </div>
  );
}
