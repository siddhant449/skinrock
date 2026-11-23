"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { GLImage } from "@/components/gl/GLImage";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { onLoaded } from "@/lib/loaded";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The two halves of the name for the phone poster, set at font size 100: each viewBox is as
 * wide as its word, so both run edge to edge on any phone (textLength takes up the last few
 * units in the letter spacing; the letters keep their shapes).
 */
const HALVES = {
  skin: { text: "Skin", width: 186 },
  rock: { text: "rock", width: 190 },
} as const;
/** the tallest letters (S, k) at font size 100; neither word has a descender */
const TALL = 76;

function NameHalf({ half, className }: { half: keyof typeof HALVES; className: string }) {
  const { text, width } = HALVES[half];
  return (
    <svg
      data-hero-word={half}
      aria-hidden
      viewBox={`0 0 ${width} ${TALL}`}
      className={`hero-word pointer-events-none absolute inset-x-4 z-20 md:hidden ${className}`}
    >
      <text x="0" y={TALL} textLength={width} lengthAdjust="spacing">
        {text}
      </text>
    </svg>
  );
}

/**
 * Desktop: the photo on the right, copy on the left, WebGL takes over the photo.
 * Phones: a full-bleed poster (after Eladio Dieste and Casa Momo): the name splits around the
 * stone, "Skin" across the top and "rock" across the foot, with the headline between them. As
 * you start scrolling the hero holds while the two words part, ink rises over the photo and
 * the eyebrow and paragraph arrive.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const { hero } = site;
  const [before, after] = hero.headline.split(hero.accentWord);

  useGSAP(
    () => {
      if (reduced) {
        root.current?.setAttribute("data-hero-ready", "");
        return;
      }
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // intro: side copy fades up after the headline starts rising
        gsap.set(q("[data-hero-fade]"), { autoAlpha: 0, y: 18 });
        root.current?.setAttribute("data-hero-ready", ""); // GSAP owns the fade from here
        const off = onLoaded(() => {
          gsap.to(q("[data-hero-fade]"), { autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.55 });
        });
        // exit: copy drifts up and dims as the page leaves the hero (parallax layer)
        gsap.to(q("[data-hero-copy]"), {
          yPercent: -18,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        return off;
      });

      mm.add("(max-width: 767px)", () => {
        const letters = q<SVGTextElement>("[data-hero-word] text");
        const skin = q<SVGSVGElement>('[data-hero-word="skin"]')[0];
        const rock = q<SVGSVGElement>('[data-hero-word="rock"]')[0];
        const shade = q<HTMLElement>("[data-hero-shade]")[0];
        const later = q<HTMLElement>("[data-hero-eyebrow], [data-hero-lede]");
        // the letters wait below their own edge until the loader has handed over
        gsap.set(letters, { y: TALL + 8 });
        gsap.set(later, { autoAlpha: 0, y: 24 });
        root.current?.setAttribute("data-hero-ready", "");
        const off = onLoaded(() => {
          gsap.to(letters, { y: 0, duration: 1.3, ease: "expo.out", stagger: 0.12, delay: 0.1 });
        });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 0.9}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        // the name parts: Skin rises away, rock sinks away, and the copy comes through
        tl.to(skin, { yPercent: -120, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, 0);
        tl.to(rock, { yPercent: 120, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, 0);
        tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.1);
        tl.fromTo(later, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" }, 0.45);
        tl.to({}, { duration: 0.25 });
        return off;
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="hero" className="relative h-svh min-h-[640px] overflow-hidden">
      <div data-hero-window="" className="absolute inset-0">
        <GLImage
          image={hero.image}
          priority
          revealOn="load"
          parallax={0.1}
          grade={0.42}
          // phones crop the landscape photo to a tall screen, so it is drawn about three
          // screen widths wide: fetch it at that size or it turns soft
          sizes="(min-width: 768px) 60vw, 330vw"
          className="hero-photo absolute inset-y-0 right-0 w-full md:w-[60%]"
        />
        {/* touch: once the intro hands over, a soft band of light sweeps across the stone */}
        <div aria-hidden data-hero-sheen="" className="hero-sheen pointer-events-none absolute inset-0 z-20" />
      </div>
      {/* phones: a quiet ink veil keeps the name and the headline legible over the stone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 md:hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(13,21,32,0.55) 0%, rgba(13,21,32,0.12) 32%, rgba(13,21,32,0.34) 50%, rgba(13,21,32,0.12) 68%, rgba(13,21,32,0.62) 100%)",
        }}
      />
      {/* phones: as the name parts, ink rises from the bottom under the copy */}
      <div
        aria-hidden
        data-hero-shade=""
        className="pointer-events-none absolute inset-0 z-20 md:hidden"
        style={{ backgroundImage: "linear-gradient(0deg, #0D1520 0%, rgba(13,21,32,0.82) 38%, rgba(13,21,32,0.2) 70%, rgba(13,21,32,0.55) 100%)" }}
      />
      {/* ink falls off the left edge of the photo into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[60%] md:block"
        style={{ backgroundImage: "linear-gradient(90deg, #0D1520 0%, rgba(13,21,32,0.55) 14%, rgba(13,21,32,0) 38%), linear-gradient(0deg, rgba(13,21,32,0.75) 0%, rgba(13,21,32,0) 35%), linear-gradient(180deg, rgba(13,21,32,0.7) 0%, rgba(13,21,32,0) 22%)" }}
      />

      <NameHalf half="skin" className="top-[76px]" />
      <NameHalf half="rock" className="bottom-4" />

      {/* phones: eyebrow, headline and paragraph centred between the two halves of the name
          (display: contents lets the phone order differ from the desktop columns) */}
      <div
        data-hero-copy
        className="relative z-20 flex h-full flex-col px-5 pb-12 pt-24 max-md:justify-center md:justify-between md:px-8 md:pb-10 md:pt-[18vh]"
      >
        <div className="flex flex-col gap-8 max-md:contents md:max-w-[34vw]">
          <p data-hero-eyebrow="" className="text-label text-mute max-md:order-1">
            {hero.eyebrow}
          </p>
          <p data-hero-fade data-hero-lede="" className="max-w-[34ch] text-[17px] leading-relaxed text-stone/90 max-md:order-3 max-md:mt-6 md:text-lg">
            {hero.lede}
          </p>
        </div>
        <div data-hero-title="" className="flex flex-col gap-10 max-md:order-2 max-md:mt-5 md:flex-row md:items-end md:justify-between">
          <SplitReveal
            as="h1"
            trigger="load"
            stagger={0.055}
            className="text-display max-w-[13ch] text-[2.4rem] max-md:max-w-none md:text-[clamp(3.25rem,8.6vw,10rem)]"
          >
            {before}
            <span className="text-glacier">{hero.accentWord}</span>
            {after}
          </SplitReveal>
        </div>
      </div>

      <div data-hero-fade className="text-label absolute bottom-10 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 text-mute xl:flex">
        <span>Scroll</span>
        <span className="scroll-cue block h-10 w-px bg-stone/30" />
      </div>
    </section>
  );
}
