"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import type { SiteImage } from "@/content/site";
import { isLoaded, onLoaded } from "@/lib/loaded";
import { useGLLive } from "./useGLActive";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { useNear } from "./useNear";
import { warm } from "@/lib/preload";
import { glImageTexture } from "@/lib/textureSize";

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
  const { touch, reduced } = useMotionPrefs();

  // the scene draws this photo: fetch its texture file now, so it is in before it is needed
  // (the texture itself is still decoded only when the photo comes near)
  useEffect(() => {
    if (!live || !wrap.current) return;
    warm(glImageTexture(image.src, wrap.current.getBoundingClientRect(), image.width, image.height, parallax));
  }, [live, image, parallax]);

  // touch has no WebGL: the photo itself sweeps into view once as it enters (after ERA
  // Residence: a slanted edge from the right while the photo slides the other way), then drifts
  // gently inside its frame while the page scrolls. Neither runs in script on every frame: the
  // drift is a CSS animation on the page's own scroll timeline (GSAP only where the browser has
  // none), and the sweep is a CSS animation that an IntersectionObserver starts, so setting up
  // seventeen photos measures nothing (app/globals.css, "touch photos").
  useEffect(() => {
    const el = wrap.current;
    const img = el?.querySelector("img");
    if (!touch || reduced || !el || !img) return;
    let ctx: gsap.Context | undefined;
    if (CSS.supports("animation-timeline: view()")) el.setAttribute("data-drift", "");
    else
      ctx = gsap.context(() => {
        gsap.fromTo(
          img,
          { yPercent: -5, scale: 1.12 },
          { yPercent: 5, scale: 1.12, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      }, el);
    let io: IntersectionObserver | undefined;
    if (revealOn === "scroll") {
      let first = true;
      io = new IntersectionObserver(
        ([e]) => {
          if (first) {
            first = false;
            // already on screen, or above it: nothing to sweep in
            if (e.isIntersecting || e.boundingClientRect.top < 0) io?.disconnect();
            else el.setAttribute("data-wipe", "waiting");
            return;
          }
          if (e.isIntersecting) {
            el.setAttribute("data-wipe", "go");
            io?.disconnect();
          }
        },
        // sweeps in once its top passes 88% of the screen
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      ctx?.revert();
      el.removeAttribute("data-drift");
      el.removeAttribute("data-wipe");
    };
  }, [touch, reduced, revealOn]);

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
      className={`gl-image ${className}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
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
          onReady={() => setReady(true)}
        />
      )}
    </div>
  );
}

