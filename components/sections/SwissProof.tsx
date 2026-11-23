"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { ScrollFill } from "@/components/ui/ScrollFill";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Cream chapter: the lab results competitors keep off their home pages. */
export function SwissProof() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      // phones (after White Desert's ink): each result prints as it reaches the reading line,
      // its hairline drawing beneath it; firing the whole list at once played most of it
      // before the rows were even on screen
      mm.add("(max-width: 767px)", () => {
        q<HTMLElement>("[data-cell]").forEach((cell) => {
          const st = { trigger: cell, start: "top 88%", end: "top 62%", scrub: true };
          gsap.fromTo(cell.querySelectorAll("dt, dd"), { opacity: 0.2 }, { opacity: 1, ease: "none", stagger: 0.15, scrollTrigger: st });
          gsap.fromTo(cell, { backgroundSize: "0% 1px" }, { backgroundSize: "100% 1px", ease: "none", scrollTrigger: st });
        });
      });
      mm.add("(min-width: 768px)", () => {
      gsap.from(q("[data-cell]"), {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: q("[data-grid]")[0], start: "top 80%", once: true },
      });
      // the hairline is a background image on each group, drawn left to right
      gsap.from(q("[data-cell]"), {
        backgroundSize: "0% 1px",
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: q("[data-grid]")[0], start: "top 80%", once: true },
      });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  const specs = [site.specs.thickness.value, site.specs.weight.value, site.specs.format.value];

  return (
    <section ref={root} id="proof" data-theme="cream" data-sheet-over="why" className="relative bg-cream px-5 py-24 text-ink md:px-8 md:py-[16vh]">
      <div className="relative z-20 grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-4">
          <span className="text-label text-glacier-ink">Swiss proof</span>
          <SplitReveal as="h2" className="text-headline text-[clamp(2.5rem,4.6vw,4.75rem)]">
            {site.proofTitle}
          </SplitReveal>
          <ScrollFill touchOnly start="top 88%" end="bottom 60%" text={site.proofIntro} className="max-w-[36ch] text-[17px] leading-relaxed md:text-lg text-ink/85" />
          <a href={site.cta.href} target="_blank" rel="noopener" className="nav-link tap self-start text-[15px] font-medium">
            Ask for the reports ↗
          </a>
        </div>

        <div className="md:col-span-8">
          <dl data-grid className="grid grid-cols-1 sm:grid-cols-2">
            {site.proof.map((p) => (
              <div key={p.standard} data-cell className="proof-cell flex flex-col gap-3 py-6 sm:pr-8">
                <dt className="text-label text-glacier-ink">{p.standard}</dt>
                <dd className="text-headline text-[clamp(1.35rem,2vw,1.9rem)] leading-[1.1]">{p.result}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-ink/15 pt-6 text-[15px] font-medium text-ink/85">
            {specs.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
