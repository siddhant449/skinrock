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
import { HERO_SIZES } from "@/lib/heroWindow";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Desktop: the photo on the right, copy on the left, WebGL takes over the photo.
 * Phones (after Fluid Glass): the stone fills the screen and the headline rests at its foot.
 * As you start scrolling the hero holds while the headline lifts, ink rises over the photo and
 * the label and paragraph arrive beneath it. Plain text throughout, laid out by the browser,
 * so it holds together on any phone height (Safari's bars leave as little as about 550px).
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
        const title = q<HTMLElement>("[data-hero-title]")[0];
        const lede = q<HTMLElement>("[data-hero-lede]")[0];
        const shade = q<HTMLElement>("[data-hero-shade]")[0];
        const later = q<HTMLElement>("[data-hero-eyebrow], [data-hero-lede]");
        // the headline rests where the paragraph will end, and lifts to make room for it
        // (layout offsets, so the measure ignores any transform in flight)
        const lift = () => (title && lede ? lede.offsetTop + lede.offsetHeight - (title.offsetTop + title.offsetHeight) : 0);
        gsap.set(title, { y: lift() });
        gsap.set(later, { autoAlpha: 0, y: 20 });
        root.current?.setAttribute("data-hero-ready", "");
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 0.8}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
        tl.fromTo(title, { y: () => lift() }, { y: 0, duration: 0.5, ease: "power2.inOut" }, 0.05);
        tl.fromTo(later, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" }, 0.4);
        tl.to({}, { duration: 0.2 });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="hero" className="relative h-svh min-h-[540px] overflow-hidden md:min-h-[640px]">
      <div data-hero-window="" className="absolute inset-0">
        <GLImage
          image={hero.image}
          priority
          revealOn="load"
          parallax={0.1}
          grade={0.42}
          sizes={HERO_SIZES}
          className="hero-photo absolute inset-y-0 right-0 w-full md:w-[60%]"
        />
        {/* touch: once the intro hands over, a soft band of light sweeps across the stone */}
        <div aria-hidden data-hero-sheen="" className="hero-sheen pointer-events-none absolute inset-0 z-20" />
      </div>
      {/* phones: ink pools at the foot under the headline, and a little at the top under the bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 md:hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(13,21,32,0.5) 0%, rgba(13,21,32,0) 22%, rgba(13,21,32,0) 48%, rgba(13,21,32,0.78) 82%, rgba(13,21,32,0.9) 100%)",
        }}
      />
      {/* phones: as the headline lifts, ink rises over the photo for the paragraph */}
      <div
        aria-hidden
        data-hero-shade=""
        className="pointer-events-none absolute inset-0 z-20 md:hidden"
        style={{ backgroundImage: "linear-gradient(0deg, #0D1520 0%, rgba(13,21,32,0.85) 45%, rgba(13,21,32,0.35) 75%, rgba(13,21,32,0.5) 100%)" }}
      />
      {/* ink falls off the left edge of the photo into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[60%] md:block"
        style={{ backgroundImage: "linear-gradient(90deg, #0D1520 0%, rgba(13,21,32,0.55) 14%, rgba(13,21,32,0) 38%), linear-gradient(0deg, rgba(13,21,32,0.75) 0%, rgba(13,21,32,0) 35%), linear-gradient(180deg, rgba(13,21,32,0.7) 0%, rgba(13,21,32,0) 22%)" }}
      />

      {/* phones: headline, then label and paragraph, stacked at the foot (display: contents
          lets the phone order differ from the desktop columns) */}
      <div
        data-hero-copy
        className="relative z-20 flex h-full flex-col px-5 pb-[max(36px,env(safe-area-inset-bottom))] pt-24 max-md:justify-end md:justify-between md:px-8 md:pb-10 md:pt-[18vh]"
      >
        <div className="flex flex-col gap-8 max-md:contents md:max-w-[34vw]">
          <p data-hero-eyebrow="" className="text-label text-mute max-md:order-2 max-md:mt-7">
            {hero.eyebrow}
          </p>
          <p data-hero-fade data-hero-lede="" className="max-w-[34ch] text-[17px] leading-relaxed text-stone/90 max-md:order-3 max-md:mt-3 max-md:text-[16px] md:text-lg">
            {hero.lede}
          </p>
        </div>
        <div data-hero-title="" className="flex flex-col gap-10 max-md:order-1 md:flex-row md:items-end md:justify-between">
          <SplitReveal
            as="h1"
            trigger="load"
            stagger={0.055}
            className="text-display max-w-[13ch] text-[clamp(2.3rem,10.5vw,2.75rem)] max-md:max-w-none md:text-[clamp(3.25rem,8.6vw,10rem)]"
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
