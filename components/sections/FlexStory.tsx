"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { BendSheet } from "@/components/gl/BendSheet";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const fmt = (v: number, decimals: number) => v.toFixed(decimals);

/** Where each figure morphs in, on the pinned timeline (0 → 1). */
const MORPHS = [0.36, 0.68];
const MORPH_LENGTH = 0.12;
const TICKS = 120;

/**
 * Pinned (after Zirka): a sheet of real stone curls inside a fine measuring dial while its
 * figures take the stage one at a time. Each figure hands over to the next with a soft focus
 * pull (the blur half of Originkit's Text Morph; its alpha threshold made numerals look broken).
 */
export function FlexStory() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef({ value: 0 });
  const { reduced } = useMotionPrefs();
  const [stacked, setStacked] = useState(false);
  const { flex } = site;

  useGSAP(
    () => {
      if (reduced) {
        progress.current.value = 0.55;
        return;
      }
      const q = gsap.utils.selector(root);
      const nums = q<HTMLElement>("[data-stat]");
      const counters = flex.stats.map(() => ({ v: 0 }));
      const count = (i: number) => ({
        v: flex.stats[i].value,
        ease: "power2.out",
        onUpdate: () => {
          nums[i].textContent = fmt(counters[i].v, flex.stats[i].decimals);
        },
      });
      // the first figure is on stage when you arrive; the others count up as they come in
      nums.forEach((n, i) => i > 0 && (n.textContent = fmt(0, Number(n.dataset.decimals))));
      counters[0].v = flex.stats[0].value;

      const mm = gsap.matchMedia();

      // desktop: pinned, one figure at a time, morphing into the next
      mm.add("(min-width: 768px)", () => {
        setStacked(true);
        const figures = q<HTMLElement>("[data-figure]");
        gsap.set(figures.slice(1), { autoAlpha: 0, filter: "blur(12px)", scale: 0.94 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.6}`,
            pin: true,
            scrub: 1,
          },
        });
        tl.to(progress.current, { value: 1, ease: "power1.inOut", duration: 1 }, 0);
        tl.to("[data-dial-ticks]", { rotate: -48, svgOrigin: "50 50", duration: 1 }, 0);
        MORPHS.forEach((at, k) => {
          const out = figures[k];
          const inn = figures[k + 1];
          // out first, in second: they only overlap while both are soft
          tl.to(out, { autoAlpha: 0, filter: "blur(12px)", scale: 1.06, ease: "power2.in", duration: MORPH_LENGTH * 0.6 }, at);
          tl.to(inn, { autoAlpha: 1, filter: "blur(0px)", scale: 1, ease: "power2.out", duration: MORPH_LENGTH * 0.6 }, at + MORPH_LENGTH * 0.4);
          tl.to(counters[k + 1], { ...count(k + 1), duration: MORPH_LENGTH }, at + MORPH_LENGTH * 0.4);
        });
        tl.to({}, { duration: 0.0001 }, 1);
        return () => setStacked(false);
      });

      // phones: no pin, the three figures count up in a row as the section passes
      mm.add("(max-width: 767px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 75%", end: "center 40%", scrub: 1 },
        });
        tl.to(progress.current, { value: 1, ease: "power1.inOut", duration: 1 }, 0);
        counters.forEach((_, i) => tl.to(counters[i], { ...count(i), duration: 0.5 }, 0.15 + i * 0.18));
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="flex" className="relative min-h-svh overflow-hidden bg-deep">
      <div className="grid min-h-svh grid-cols-1 gap-10 px-5 py-24 md:grid-cols-12 md:gap-6 md:px-8 md:py-[14vh]">
        <div className="relative z-20 flex flex-col justify-between gap-12 md:col-span-5">
          <div className="flex flex-col gap-6">
            <span className="text-label text-glacier">{flex.kicker}</span>
            <SplitReveal as="h2" className="text-headline text-[clamp(2.6rem,5vw,5.25rem)]">
              {flex.title}
            </SplitReveal>
            <p className="max-w-[40ch] text-[17px] leading-relaxed text-stone/90 md:text-lg">{flex.body}</p>
          </div>

          <dl data-figures="" className={stacked ? "grid" : "grid grid-cols-3 gap-4"}>
            {flex.stats.map((s) => (
              <div
                key={s.label}
                data-figure=""
                className={stacked ? "col-start-1 row-start-1 flex origin-left flex-col gap-3" : "flex flex-col gap-2"}
              >
                <dt className={stacked ? "text-label text-mute" : "text-[14px] leading-snug text-mute"}>{s.label}</dt>
                <dd
                  className={`tabular-nums ${
                    stacked ? "text-display text-[clamp(4.5rem,8.5vw,9rem)]" : "text-headline text-[clamp(1.75rem,3vw,3rem)]"
                  }`}
                >
                  <span data-stat data-decimals={s.decimals}>
                    {fmt(s.value, s.decimals)}
                  </span>
                  {s.unit && <span className="ml-2 text-[0.3em] tracking-normal text-mute">{s.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[46vh] md:col-span-7 md:col-start-6 md:min-h-0">
          {/* studio light and a fine measuring dial behind the sheet (z-[5]: under the WebGL canvas) */}
          <div aria-hidden className="flex-studio pointer-events-none absolute inset-[-10%] z-[5]" />
          <svg
            aria-hidden
            data-dial=""
            viewBox="0 0 100 100"
            className="pointer-events-none absolute left-1/2 top-1/2 z-[5] hidden aspect-square w-[min(100%,78vh)] -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <g data-dial-ticks="">
              {Array.from({ length: TICKS }, (_, i) => {
                const major = i % 10 === 0;
                const a = (i / TICKS) * Math.PI * 2;
                const r1 = major ? 45.2 : 46.6;
                const r2 = 48;
                return (
                  <line
                    key={i}
                    data-tick=""
                    x1={(50 + Math.sin(a) * r1).toFixed(3)}
                    y1={(50 - Math.cos(a) * r1).toFixed(3)}
                    x2={(50 + Math.sin(a) * r2).toFixed(3)}
                    y2={(50 - Math.cos(a) * r2).toFixed(3)}
                    stroke="#EEE9E0"
                    strokeOpacity={major ? 0.42 : 0.18}
                    strokeWidth={major ? 0.16 : 0.1}
                  />
                );
              })}
            </g>
            {/* the fixed reading mark the ticks turn past */}
            <line x1="50" y1="0.6" x2="50" y2="4.4" stroke="#BFE3F2" strokeWidth="0.22" />
          </svg>
          <BendSheet image={flex.image} progress={progress} className="absolute inset-0" />
        </div>
      </div>
    </section>
  );
}
