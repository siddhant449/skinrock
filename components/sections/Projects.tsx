"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { GLImage } from "@/components/gl/GLImage";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** where each card of the touch gallery comes to rest: centred, or at the gallery's start or
    end for cards that cannot be centred */
const restsOf = (t: HTMLElement) => {
  const max = t.scrollWidth - t.clientWidth;
  return [...t.children].map((c) => {
    const el = c as HTMLElement;
    return Math.max(0, Math.min(max, el.offsetLeft + el.offsetWidth / 2 - t.clientWidth / 2));
  });
};

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
  // touch gallery: whether the arrows have anywhere left to go
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const t = track.current;
    if (!touch || !t) return;
    let frame = 0;
    // at an end once the gallery is nearer its first (or last) resting place than the next one
    const read = () => {
      frame = 0;
      const rests = restsOf(t);
      const first = rests[0];
      const last = rests[rests.length - 1];
      const second = rests.find((r) => r > first + 2) ?? last;
      const penultimate = [...rests].reverse().find((r) => r < last - 2) ?? first;
      setEdge({ start: t.scrollLeft < (first + second) / 2, end: t.scrollLeft > (penultimate + last) / 2 });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    t.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      t.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [touch]);

  /** glide to the neighbour of the project in view */
  const step = (dir: 1 | -1) => {
    const t = track.current;
    if (!t) return;
    const rests = restsOf(t);
    const gaps = rests.map((r) => Math.abs(r - t.scrollLeft));
    let i = gaps.indexOf(Math.min(...gaps));
    // skip neighbours that rest in the same place (several cards can share the start or end)
    do i += dir;
    while (i > 0 && i < rests.length - 1 && Math.abs(rests[i] - t.scrollLeft) < 2);
    t.scrollTo({ left: rests[Math.max(0, Math.min(rests.length - 1, i))], behavior: reduced ? "auto" : "smooth" });
  };

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
            anticipatePin: 1,
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
              <GLImage image={p.image} sizes="(min-width: 768px) 22vw, 60vw" grade={0.45} parallax={0.06} className={`relative w-full ${c.ratio}`} />
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
        {/* touch: the gallery owns its own touches. Smooth scrolling (Lenis) cancels any finger
            movement with a vertical part, and a thumb always drifts a little, so sideways swipes
            stuck; here the browser tells a sideways swipe from a scroll by itself. */}
        <div className={touch ? "rail-edges relative" : "contents"}>
        <div
          ref={track}
          id="project-rail"
          data-rail-track=""
          data-lenis-prevent-touch={touch ? "" : undefined}
          className={
            touch
              ? "rail-swipe relative flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:gap-6 md:px-8"
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
                sizes={touch ? "(min-width: 768px) 85vw, 150vw" : "(min-width: 768px) 30vw, 100vw"}
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
        {touch && (
          <div className="mt-6 flex justify-end gap-3 px-5 md:px-8">
            <button
              type="button"
              aria-label="Previous project"
              aria-controls="project-rail"
              disabled={edge.start}
              onClick={() => step(-1)}
              className="rail-arrow"
            >
              <span aria-hidden>&larr;</span>
            </button>
            <button
              type="button"
              aria-label="Next project"
              aria-controls="project-rail"
              disabled={edge.end}
              onClick={() => step(1)}
              className="rail-arrow"
            >
              <span aria-hidden>&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
