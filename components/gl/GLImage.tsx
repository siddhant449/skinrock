"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import type { SiteImage } from "@/content/site";
import { isLoaded, onLoaded } from "@/lib/loaded";
import { useGLLive } from "./useGLActive";
import { useNear } from "./useNear";

const GLImageView = dynamic(() => import("./GLImageView"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

type Props = {
  image: SiteImage;
  /** must include positioning (relative or absolute) and a size */
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** 0 to 1: how far shadows are pulled toward the palette's ink blue. */
  grade?: number;
  /** extra zoom used for in-frame parallax drift. */
  parallax?: number;
  /** "scroll" reveals when entering view, "load" after the intro, "none" shows immediately. */
  revealOn?: "scroll" | "load" | "none";
};

/**
 * A real <img> (SEO, fallback, LCP) mirrored by a WebGL plane on the shared canvas.
 * Once the plane has drawn, the DOM image fades out and the shader takes over.
 */
export function GLImage({
  image,
  className = "relative",
  sizes = "100vw",
  priority,
  grade = 0.38,
  parallax = 0.08,
  revealOn = "scroll",
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const live = useGLLive();
  // decode a texture only when the image is within half a screen of being seen
  const near = useNear(wrap, live);
  const active = live && near;
  const [ready, setReady] = useState(false);
  const reveal = useRef({ value: revealOn === "none" ? 1 : 0 });

  useEffect(() => {
    if (!active || !ready || !wrap.current || revealOn === "none") return;
    const el = wrap.current;
    const play = () =>
      gsap.to(reveal.current, { value: 1, duration: 1.8, ease: "expo.out" });
    const r = el.getBoundingClientRect();
    const onScreen = r.top < window.innerHeight && r.bottom > 0;
    // WebGL arrived after the visitor already saw this image: swap in place, no second reveal
    if (onScreen && (revealOn !== "load" || isLoaded())) {
      reveal.current.value = 1;
      return;
    }
    if (revealOn === "load") return onLoaded(play);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: play,
    });
    return () => st.kill();
  }, [active, ready, revealOn]);

  return (
    <div
      ref={wrap}
      data-gl-image=""
      data-gl={active && ready ? "ready" : undefined}
      className={`gl-image overflow-hidden ${className}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-opacity duration-300"
      />
      {active && (
        <GLImageView
          src={image.src}
          imageWidth={image.width}
          imageHeight={image.height}
          grade={grade}
          parallax={parallax}
          reveal={reveal}
          track={wrap}
          onReady={() => setReady(true)}
        />
      )}
    </div>
  );
}

