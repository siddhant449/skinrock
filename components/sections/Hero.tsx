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
      // intro: hairline draws, side copy fades up after the headline starts rising
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
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="hero" className="relative h-svh min-h-[640px] overflow-hidden">
      <GLImage
        image={hero.image}
        priority
        revealOn="load"
        parallax={0.1}
        grade={0.42}
        sizes="(min-width: 768px) 60vw, 100vw"
        className="absolute inset-y-0 right-0 w-full md:w-[60%]"
      />
      {/* phones: the photo is full width, so ink rises from the bottom under the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 md:hidden"
        style={{ backgroundImage: "linear-gradient(0deg, #0D1520 0%, rgba(13,21,32,0.82) 38%, rgba(13,21,32,0.2) 70%, rgba(13,21,32,0.55) 100%)" }}
      />
      {/* ink falls off the left edge of the photo into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[60%] md:block"
        style={{ backgroundImage: "linear-gradient(90deg, #0D1520 0%, rgba(13,21,32,0.55) 14%, rgba(13,21,32,0) 38%), linear-gradient(0deg, rgba(13,21,32,0.75) 0%, rgba(13,21,32,0) 35%), linear-gradient(180deg, rgba(13,21,32,0.7) 0%, rgba(13,21,32,0) 22%)" }}
      />

      <div data-hero-copy className="relative z-20 flex h-full flex-col justify-between px-5 pb-8 pt-28 md:px-8 md:pb-10 md:pt-[18vh]">
        <div className="flex flex-col gap-8 md:max-w-[34vw]">
          <p className="text-label text-mute">{hero.eyebrow}</p>
          <p data-hero-fade className="max-w-[34ch] text-[17px] leading-relaxed text-stone/90 md:text-lg">
            {hero.lede}
          </p>
        </div>

        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <SplitReveal
            as="h1"
            trigger="load"
            stagger={0.055}
            className="text-display max-w-[13ch] text-[clamp(3.25rem,8.6vw,10rem)]"
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
