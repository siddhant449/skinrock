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
 * Pinned (after Zirka): a sheet of real stone bends at the centre of a fine measuring dial
 * while its figures take the stage beneath it one at a time. Each figure hands over to the next with a soft focus
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
          // strictly one after the other: the old figure has gone before the new one arrives
          tl.to(out, { autoAlpha: 0, filter: "blur(12px)", scale: 1.06, ease: "power2.in", duration: MORPH_LENGTH * 0.5 }, at);
          tl.to(inn, { autoAlpha: 1, filter: "blur(0px)", scale: 1, ease: "power2.out", duration: MORPH_LENGTH * 0.5 }, at + MORPH_LENGTH * 0.5);
          tl.to(counters[k + 1], { ...count(k + 1), duration: MORPH_LENGTH * 0.6 }, at + MORPH_LENGTH * 0.5);
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
    <section ref={root} id="flex" className="flex-studio-light relative overflow-hidden bg-deep md:h-svh">
      {/* the stage (after Zirka): the sheet is the object, centred inside a fine measuring dial;
          title top left, body top right, one large figure centred beneath the sheet */}
      <div className="relative z-20 flex flex-col gap-6 px-5 pt-24 md:absolute md:inset-x-8 md:top-[11vh] md:flex-row md:items-start md:justify-between md:gap-10 md:px-0 md:pt-0">
        <div className="flex flex-col gap-5">
          <span className="text-label text-glacier">{flex.kicker}</span>
          <SplitReveal as="h2" className="text-headline max-w-[11ch] text-[clamp(2.6rem,4vw,4.25rem)]">
            {flex.title}
          </SplitReveal>
        </div>
        <p className="max-w-[34ch] text-[17px] leading-relaxed text-stone/90 md:mt-9 md:text-right md:text-lg">{flex.body}</p>
      </div>

      <div data-flex-stage="" className="relative mx-5 mt-10 h-[46vh] md:absolute md:inset-0 md:m-0 md:h-auto">
        {/* the dial sits under the WebGL canvas (z-[5]) */}
        <svg
          aria-hidden
          data-dial=""
          viewBox="0 0 100 100"
          className="pointer-events-none absolute left-1/2 top-[47%] z-[5] hidden aspect-square w-[min(76vh,58vw)] -translate-x-1/2 -translate-y-1/2 md:block"
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
        <BendSheet
          image={flex.image}
          progress={progress}
          className="absolute inset-0 md:inset-auto md:left-1/2 md:top-[47%] md:h-[72vh] md:w-[60vw] md:-translate-x-1/2 md:-translate-y-1/2"
        />
      </div>

      <dl
        data-figures=""
        className={`relative z-20 px-5 pb-24 pt-10 md:absolute md:inset-x-0 md:bottom-[6vh] md:p-0 ${
          stacked ? "grid justify-items-center text-center" : "grid grid-cols-3 gap-4"
        }`}
      >
        {flex.stats.map((s, i) => (
          <div
            key={s.label}
            data-figure=""
            className={
              stacked
                ? // only the first figure shows until the scroll timeline takes over (its inline
                  // styles win); if that timeline is ever torn down, figures still never pile up
                  `col-start-1 row-start-1 flex flex-col items-center gap-2 ${i > 0 ? "invisible opacity-0" : ""}`
                : "flex flex-col gap-2"
            }
          >
            <dt className={stacked ? "text-label text-mute" : "text-[14px] leading-snug text-mute"}>{s.label}</dt>
            <dd
              className={`tabular-nums ${
                stacked ? "text-display text-[clamp(4rem,7vw,7.5rem)]" : "text-headline text-[clamp(1.75rem,3vw,3rem)]"
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
    </section>
  );
}
