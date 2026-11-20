"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { GLImage } from "@/components/gl/GLImage";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Floating collage positions (after Marvell): left/top in %, width in vw, parallax speed. */
const COLLAGE = [
  { left: 4, top: 6, w: 17, speed: 0.35, ratio: "aspect-[4/5]" },
  { left: 72, top: 2, w: 21, speed: 0.15, ratio: "aspect-[4/3]" },
  { left: 30, top: 58, w: 14, speed: 0.55, ratio: "aspect-[3/4]" },
  { left: 80, top: 55, w: 15, speed: 0.4, ratio: "aspect-[4/5]" },
  { left: 8, top: 72, w: 19, speed: 0.22, ratio: "aspect-[4/3]" },
  { left: 56, top: 78, w: 13, speed: 0.6, ratio: "aspect-square" },
];

export function Projects() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const { reduced, touch } = useMotionPrefs();
  const collage = site.projects.slice(0, COLLAGE.length);

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      // collage: each photo drifts at its own speed past the statement
      q<HTMLElement>("[data-float]").forEach((el) => {
        const speed = Number(el.dataset.speed);
        gsap.fromTo(
          el,
          { yPercent: speed * 120 },
          {
            yPercent: -speed * 120,
            ease: "none",
            scrollTrigger: { trigger: q("[data-collage]")[0], start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // pinned horizontal gallery: desktop with a mouse only (touch gets a native swipe gallery)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (hover: hover) and (pointer: fine)", () => {
        const t = track.current;
        const r = rail.current;
        if (!t || !r) return;
        const distance = () => t.scrollWidth - window.innerWidth;
        gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: r,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="projects" aria-label="Projects" className="relative bg-ink">
      {/* A. floating collage behind a large statement */}
      <div data-collage className={`relative overflow-clip ${touch ? "h-[140svh]" : "h-[170svh]"}`}>
        {/* soft ink pool behind the statement: photos still drift through, the words stay readable.
            z-[15] sits above the WebGL canvas (z-10) and below the text (z-20). */}
        <div aria-hidden data-statement-backdrop className="pointer-events-none sticky top-0 z-[15] -mb-[100svh] h-svh" style={{
            background: touch
              ? // touch: photos are larger on smaller screens, so the pool behind the words is deeper
                "radial-gradient(ellipse 64% 40% at 50% 50%, rgba(13,21,32,0.93) 0%, rgba(13,21,32,0.72) 50%, rgba(13,21,32,0) 100%)"
              : "radial-gradient(ellipse 46% 34% at 50% 50%, rgba(13,21,32,0.82) 0%, rgba(13,21,32,0.55) 45%, rgba(13,21,32,0) 100%)",
          }} />
        <div className="sticky top-0 z-20 flex h-svh flex-col items-center justify-center gap-6 px-5 text-center">
          <span className="text-label text-glacier">Projects</span>
          <SplitReveal as="h2" className="text-display max-w-[16ch] text-[clamp(2.75rem,7vw,8rem)]">
            {site.projectsTitle}
          </SplitReveal>
        </div>
        {collage.map((p, i) => {
          const c = COLLAGE[i];
          return (
            <div
              key={p.image.src}
              data-float=""
              data-speed={c.speed}
              className={`absolute w-[calc(var(--w)*2.3vw)] ${touch ? "md:w-[calc(var(--w)*1.7vw)]" : "md:w-[calc(var(--w)*1vw)]"}`}
              style={{ left: `${c.left}%`, top: `${c.top}%`, ["--w" as string]: c.w }}
            >
              <GLImage image={p.image} sizes="22vw" grade={0.45} parallax={0.06} className={`relative w-full ${c.ratio}`} />
            </div>
          );
        })}
      </div>

      {/* B. captioned gallery: pinned horizontal on desktop; on touch a native swipe gallery
          whose cards snap to the centre and settle into focus (after the touch galleries in
          the reference research) instead of ten photos stacked down the page */}
      <div ref={rail} className={touch ? "relative pb-12" : "relative overflow-hidden md:h-svh"}>
        <div
          className={
            touch
              ? "relative z-20 flex items-baseline justify-between px-5 pb-6 pt-16 md:px-8"
              : "relative z-20 flex items-baseline justify-between px-5 pb-6 pt-16 md:absolute md:inset-x-0 md:top-0 md:px-8 md:pt-24"
          }
        >
          <span className="text-label text-mute">Selected work</span>
          <span className="text-label text-mute">{site.projects.length} projects</span>
        </div>
        <div
          ref={track}
          data-rail-track=""
          className={
            touch
              ? "rail-swipe flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:gap-6 md:px-8"
              : "flex flex-col gap-10 px-5 pb-24 md:h-full md:w-max md:flex-row md:items-center md:gap-[4vw] md:px-[8vw] md:pb-0 md:pt-16"
          }
        >
          {site.projects.map((p, i) => (
            <figure
              key={p.image.src}
              className={
                touch
                  ? "rail-card flex w-[80vw] shrink-0 snap-center flex-col gap-4 md:w-[44vw]"
                  : "flex shrink-0 flex-col gap-4 md:w-[30vw] md:even:mt-[12vh]"
              }
            >
              <GLImage
                image={p.image}
                sizes={touch ? "(min-width: 768px) 44vw, 80vw" : "(min-width: 768px) 30vw, 100vw"}
                grade={0.4}
                parallax={0.05}
                className={`relative w-full ${touch ? "aspect-[4/5]" : i % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"}`}
              />
              <figcaption className="relative z-20 flex items-baseline justify-between gap-4 text-[15px] font-medium">
                <span>
                  {p.use}
                </span>
                <span className="text-mute">{p.setting}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
