"use client";

import { useRef, useState } from "react";
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
  const [ready, setReady] = useState(false);
  const drawn = live && ready;
  return (
    <div ref={wrap} data-bend="" data-gl={drawn ? "ready" : undefined} className={className}>
      {/* the photo stays until WebGL has drawn its first frame, so the chapter never goes blank */}
      {!drawn ? (
        // without WebGL (touch) the photo turns like a sheet in 3D, posed by --bend from the scroll
        <div data-bend-dom="" className="bend-dom absolute">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="rounded-sm object-cover" />
        </div>
      ) : (
        <span className="sr-only">{image.alt}</span>
      )}
      {live && (
        <BendSheetView src={image.src} imageRes={[image.width, image.height]} progress={progress} onReady={() => setReady(true)} />
      )}
    </div>
  );
}
