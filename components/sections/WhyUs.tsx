"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Why choose us: a Swiss hairline grid (after Palaraiffeisen, Montfort, Inversa). Each cell
 * leads with a one word fact; hovering (or, on touch screens, scrolling it to the middle)
 * wipes a real project photo up inside the cell.
 */
export function WhyUs() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced) return;
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
    { scope: root, dependencies: [reduced] },
  );

  // touch screens have no hover: the cell nearest the middle of the screen shows its photo
  useEffect(() => {
    if (window.matchMedia("(hover: hover)").matches) return;
    const cells = root.current?.querySelectorAll<HTMLElement>("[data-why-cell]");
    if (!cells) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.target as HTMLElement).setAttribute("data-active", String(e.isIntersecting))),
      { rootMargin: "-40% 0px -40% 0px" },
    );
    cells.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} id="why" className="relative bg-deep px-5 py-24 md:px-8 md:py-[16vh]">
      <div className="relative z-20 mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-6">
          <span className="text-label text-glacier">{site.whyKicker}</span>
          <SplitReveal as="h2" className="text-headline max-w-[15ch] text-[clamp(2.6rem,5vw,5.25rem)]">
            {site.whyTitle}
          </SplitReveal>
        </div>
        <p className="hidden max-w-[30ch] text-[17px] leading-relaxed text-stone/90 md:block">{site.whyIntro}</p>
      </div>

      <div data-why-grid className="why-grid relative z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {site.why.map((w, i) => (
          <article
            key={w.title}
            data-why-cell=""
            data-active="false"
            className={`why-cell group relative flex min-h-[260px] flex-col justify-between gap-10 overflow-hidden p-6 md:min-h-[300px] md:p-7 ${
              i === 0 ? "lg:col-span-2" : ""
            }`}
          >
            <div data-why-photo="" aria-hidden className="why-photo absolute inset-0">
              <Image src={w.image.src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-b from-ink/30 to-ink/90" />
            </div>
            <p data-why-copy className="text-display relative text-[clamp(2.4rem,3.6vw,3.6rem)]">
              {w.key}
            </p>
            <div data-why-copy className="relative">
              <h3 className="text-[20px] font-medium leading-tight tracking-[-0.02em]">{w.title}</h3>
              <p className="mt-2 max-w-[34ch] text-[16px] leading-relaxed text-stone/90">{w.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
