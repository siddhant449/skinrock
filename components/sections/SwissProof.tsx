"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Cream chapter: the lab results competitors keep off their home pages. */
export function SwissProof() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      gsap.from(q("[data-cell]"), {
        clipPath: "inset(0% 0% 100% 0%)",
        y: 24,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: q("[data-grid]")[0], start: "top 80%", once: true },
      });
      gsap.from(q("[data-rule]"), {
        scaleX: 0,
        transformOrigin: "left",
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: q("[data-grid]")[0], start: "top 80%", once: true },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const specs = [site.specs.thickness.value, site.specs.weight.value, site.specs.format.value];

  return (
    <section ref={root} id="proof" data-theme="cream" className="relative bg-cream px-5 py-24 text-ink md:px-8 md:py-[16vh]">
      <div className="relative z-20 grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-4">
          <span className="text-label text-glacier-ink">06 / Swiss proof</span>
          <SplitReveal as="h2" className="text-headline text-[clamp(2.5rem,4.6vw,4.75rem)]">
            {site.proofTitle}
          </SplitReveal>
          <p className="max-w-[34ch] text-base leading-relaxed text-ink/70">{site.proofIntro}</p>
          <a href={site.cta.href} target="_blank" rel="noopener" className="nav-link self-start text-[13px] font-medium">
            Ask for the reports ↗
          </a>
        </div>

        <div className="md:col-span-8">
          <dl data-grid className="grid grid-cols-1 sm:grid-cols-2">
            {site.proof.map((p) => (
              <div key={p.standard} className="relative flex flex-col gap-3 py-6 sm:pr-8">
                <span data-rule className="absolute inset-x-0 top-0 h-px bg-ink/15" />
                <div data-cell className="flex flex-col gap-3">
                  <dt className="text-label text-glacier-ink">{p.standard}</dt>
                  <dd className="text-headline text-[clamp(1.35rem,2vw,1.9rem)] leading-[1.1]">{p.result}</dd>
                </div>
              </div>
            ))}
          </dl>
          <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-ink/15 pt-6 text-[13px] font-medium text-ink/60">
            {specs.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
