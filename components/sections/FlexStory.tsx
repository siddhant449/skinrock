"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { BendSheet } from "@/components/gl/BendSheet";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const fmt = (v: number, decimals: number) => v.toFixed(decimals);

/** Pinned: a sheet of real stone curls as you scroll while the numbers count up. */
export function FlexStory() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef({ value: 0 });
  const { reduced } = useMotionPrefs();
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
      nums.forEach((n) => (n.textContent = fmt(0, Number(n.dataset.decimals))));

      const mm = gsap.matchMedia();
      const build = (pinned: boolean) => {
        const tl = gsap.timeline({
          scrollTrigger: pinned
            ? {
                trigger: root.current,
                start: "top top",
                end: () => `+=${window.innerHeight * 1.6}`,
                pin: true,
                scrub: 1,
              }
            : // phones: no pin, the numbers count as the section scrolls through
              {
                trigger: root.current,
                start: "top 75%",
                end: "center 40%",
                scrub: 1,
              },
        });
        tl.to(
          progress.current,
          { value: 1, ease: "power1.inOut", duration: 1 },
          0,
        );
        counters.forEach((c, i) => {
          tl.to(
            c,
            {
              v: flex.stats[i].value,
              ease: "power2.out",
              duration: 0.5,
              onUpdate: () => {
                nums[i].textContent = fmt(c.v, flex.stats[i].decimals);
              },
            },
            0.15 + i * 0.18,
          );
        });
        tl.fromTo(
          q("[data-flex-rule]"),
          { scaleX: 0 },
          { scaleX: 1, ease: "none", duration: 1 },
          0,
        );
      };
      mm.add("(min-width: 768px)", () => build(true));
      mm.add("(max-width: 767px)", () => build(false));
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section
      ref={root}
      id="flex"
      className="relative min-h-svh overflow-hidden bg-deep"
    >
      <div className="grid min-h-svh grid-cols-1 gap-10 px-5 py-24 md:grid-cols-12 md:gap-6 md:px-8 md:py-[14vh]">
        <div className="relative z-20 flex flex-col justify-between gap-10 md:col-span-5">
          <div className="flex flex-col gap-6">
            <span className="text-label text-glacier">{flex.kicker}</span>
            <SplitReveal
              as="h2"
              className="text-headline text-[clamp(2.6rem,5vw,5.25rem)]"
            >
              {flex.title}
            </SplitReveal>
            <p className="max-w-[40ch] text-[17px] leading-relaxed md:text-lg text-stone/90">
              {flex.body}
            </p>
          </div>
          <div>
            <div className="relative mb-5 h-px bg-stone/15">
              <span
                data-flex-rule
                className="absolute inset-0 origin-left bg-glacier"
              />
            </div>
            <dl className="grid grid-cols-3 gap-4">
              {flex.stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <dt className="text-[14px] leading-snug text-mute">
                    {s.label}
                  </dt>
                  <dd className="text-headline text-[clamp(1.75rem,3vw,3rem)] tabular-nums">
                    <span data-stat data-decimals={s.decimals}>
                      {fmt(s.value, s.decimals)}
                    </span>
                    {s.unit && (
                      <span className="ml-1 text-[0.45em] tracking-normal text-mute">
                        {s.unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <BendSheet
          image={flex.image}
          progress={progress}
          className="relative min-h-[46vh] md:col-span-7 md:col-start-6 md:min-h-0"
        />
      </div>
    </section>
  );
}
