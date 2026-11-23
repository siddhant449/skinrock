"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { StudioStage } from "@/components/ui/StudioStage";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** scroll per reason in the phone stepper, in screen heights */
const STEP_VH = 0.55;

/**
 * Why choose us: a Swiss hairline grid (after Palaraiffeisen, Montfort, Inversa). Each cell
 * leads with a one word fact; hovering (or, on touch screens, scrolling it to the middle)
 * wipes a real project photo up inside the cell.
 *
 * Phones get a pinned stepper instead of seven tall cells (after Riotters' "Capabilities"):
 * the reasons stack as cards in one frame, each new card wipes up over the last as you scroll,
 * and a compact list of the seven keys lights the one on screen.
 */
export function WhyUs() {
  const root = useRef<HTMLElement>(null);
  const { reduced, touch } = useMotionPrefs();
  const [stepper, setStepper] = useState(false);

  // phones switch to the stepper layout; the pinned timeline is built once that layout has
  // rendered (below), so the pin measures the right height
  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(max-width: 767px)", () => {
        setStepper(true);
        return () => setStepper(false);
      });
      return () => mm.revert();
    },
    { dependencies: [reduced] },
  );

  useGSAP(
    () => {
      if (!stepper) return;
      const q = gsap.utils.selector(root);
      const cards = q<HTMLElement>("[data-why-cell]");
      const switches = cards.slice(1).map((_, k) => k + 0.2);
      gsap.set(cards.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * STEP_VH * (cards.length - 1)}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
        },
      });
      cards.slice(1).forEach((card, k) => {
        const at = switches[k];
        tl.fromTo(card, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power2.inOut" }, at);
        tl.fromTo(card.querySelector("img"), { scale: 1.14 }, { scale: 1, duration: 0.8, ease: "power2.out" }, at);
        // the words arrive with the wipe, so no moment shows a card without its text
        tl.fromTo(card.querySelectorAll("[data-why-step-copy]"), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.06, ease: "power2.out" }, at + 0.15);
      });
      tl.to({}, { duration: 0.35 });
      // this pin is created after the sections below measured themselves: re-measure in order
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [stepper] },
  );

  useGSAP(
    () => {
      // the stepper reveals its own cards; this one-time grid reveal would fight it
      if (reduced || stepper) return;
      const q = gsap.utils.selector(root);
      // hairlines draw in, then each cell's words rise, one after another
      gsap.from(q("[data-why-cell]"), {
        "--line": 0,
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.06,
        scrollTrigger: { trigger: q("[data-why-grid]")[0], start: "top 85%", once: true },
      });
      gsap.from(q("[data-why-copy]"), {
        y: 26,
        opacity: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.06,
        delay: 0.15,
        scrollTrigger: { trigger: q("[data-why-grid]")[0], start: "top 85%", once: true },
      });
    },
    { scope: root, dependencies: [reduced, stepper] },
  );

  // touch screens have no hover: the one cell nearest the middle of the screen shows its photo
  // (a band observer lit a whole row at once in the two-column tablet grid)
  useEffect(() => {
    if (!touch || stepper) return;
    const cells = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-why-cell]") ?? []);
    if (!cells.length) return;
    let frame = 0;
    const pick = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const c of cells) {
        const r = c.getBoundingClientRect();
        // only cells that cover the middle third of the screen take part
        if (r.bottom < window.innerHeight / 3 || r.top > (window.innerHeight * 2) / 3) continue;
        const d = Math.abs((r.top + r.bottom) / 2 - mid) + Math.abs((r.left + r.right) / 2 - window.innerWidth / 2) * 0.25;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      cells.forEach((c) => c.setAttribute("data-active", String(c === best)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };
    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [touch, stepper]);

  return (
    <section
      ref={root}
      id="why"
      // phones: the foot stays clear, because the cream chapter after this one rises over the
      // last tenth of the screen
      className={`relative bg-deep ${stepper ? "flex h-svh flex-col overflow-hidden px-5 pb-[calc(10vh+16px)] pt-20" : "px-5 py-24 md:px-8 md:py-[16vh]"}`}
    >
      <StudioStage floor strength={0.6} />
      <div className={`relative z-20 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between ${stepper ? "mb-5" : "mb-12"}`}>
        <div className="flex flex-col gap-6">
          <span className="text-label text-glacier">{site.whyKicker}</span>
          <SplitReveal as="h2" className="text-headline max-w-[15ch] text-[clamp(2.6rem,5vw,5.25rem)]">
            {site.whyTitle}
          </SplitReveal>
        </div>
        <p className="hidden max-w-[30ch] text-[17px] leading-relaxed text-stone/90 md:block">{touch ? site.whyIntroTouch : site.whyIntro}</p>
      </div>

      <div
        data-why-grid
        className={stepper ? "relative z-20 grid min-h-0 flex-1" : "why-grid relative z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}
      >
        {site.why.map((w, i) => (
          <article
            key={w.title}
            data-why-cell=""
            data-active="false"
            className={
              stepper
                ? "col-start-1 row-start-1 relative flex flex-col justify-between overflow-hidden rounded-sm p-5"
                : `why-cell group relative flex min-h-[260px] flex-col justify-between gap-10 overflow-hidden p-6 md:min-h-[300px] md:p-7 ${
                    i === 0 ? "lg:col-span-2" : i === site.why.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
                  }`
            }
          >
            <div data-why-photo="" aria-hidden className={stepper ? "absolute inset-0 overflow-hidden" : "why-photo absolute inset-0"}>
              <Image src={w.image.src} alt="" fill sizes="(min-width: 1024px) 50vw, (min-width: 768px) 100vw, 150vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-b from-ink/30 to-ink/90" />
            </div>
            <p data-why-copy data-why-step-copy="" className="text-display relative text-[clamp(2.4rem,3.6vw,3.6rem)]">
              {w.key}
            </p>
            <div data-why-copy data-why-step-copy="" className="relative">
              <h3 className="text-[20px] font-medium leading-tight tracking-[-0.02em]">{w.title}</h3>
              <p className="mt-2 max-w-[34ch] text-[16px] leading-relaxed text-stone/90">{w.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
