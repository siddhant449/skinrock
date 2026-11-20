"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Resting (stacked) and open (fanned) poses for the four sample tiles. Fanned x is a share of the column width. */
const STACKED = [
  { x: -6, y: 0, r: -4 },
  { x: -2, y: 0, r: -1 },
  { x: 2, y: 0, r: 2 },
  { x: 6, y: 0, r: 5 },
];
const FANNED = [
  { x: -0.95, y: 30, r: -12 },
  { x: -0.32, y: -10, r: -4 },
  { x: 0.32, y: -10, r: 4 },
  { x: 0.95, y: 30, r: 12 },
];

/**
 * The sample box (after Mutina's sample basket): four real stone samples stacked like a hand
 * of cards that fan open as the section scrolls in. Hovering lifts and tilts a sample toward
 * the cursor; each sample asks for that stone.
 */
export function Cta() {
  const { cta } = site;
  const root = useRef<HTMLElement>(null);
  const fan = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      const tiles = gsap.utils.toArray<HTMLElement>("[data-sample-tile]", root.current);
      const spread = () => (fan.current?.clientWidth ?? 600) * 0.32; // fan width follows the column
      if (reduced) {
        tiles.forEach((t, i) => gsap.set(t, { x: FANNED[i].x * spread(), y: FANNED[i].y, rotate: FANNED[i].r }));
        return;
      }
      tiles.forEach((t, i) => gsap.set(t, { x: STACKED[i].x, y: STACKED[i].y + 40, rotate: STACKED[i].r, opacity: 0 }));
      const tl = gsap.timeline({
        scrollTrigger: { trigger: fan.current, start: "top 85%", end: "center 55%", scrub: 0.8, invalidateOnRefresh: true },
      });
      tiles.forEach((t, i) => {
        tl.to(t, { opacity: 1, y: STACKED[i].y, duration: 0.25, ease: "power2.out" }, i * 0.05);
        tl.to(t, { x: () => FANNED[i].x * spread(), y: FANNED[i].y, rotate: FANNED[i].r, duration: 0.75, ease: "power3.inOut" }, 0.3);
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  // hover: lift the sample and tilt it toward the cursor
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduced) return;
    const el = e.currentTarget.querySelector<HTMLElement>("[data-tilt]");
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: px * 16, rotateX: -py * 16, y: -34, scale: 1.04, duration: 0.6, ease: "power3.out" });
  };
  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget.querySelector<HTMLElement>("[data-tilt]");
    if (el) gsap.to(el, { rotateY: 0, rotateX: 0, y: 0, scale: 1, duration: 0.9, ease: "expo.out" });
  };

  return (
    <section ref={root} id="samples" className="relative overflow-hidden bg-ink px-5 py-24 md:px-8 md:py-[16vh]">
      <div className="relative z-20 grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_1.15fr]">
        <div className="flex flex-col items-start gap-7">
          <span className="text-label text-glacier">Samples</span>
          <SplitReveal as="h2" className="text-display max-w-[11ch] text-[clamp(3.4rem,7.4vw,8.5rem)]">
            {cta.title}
          </SplitReveal>
          <p className="max-w-[36ch] text-[17px] leading-relaxed text-stone/90 md:text-lg">{cta.body}</p>
          <MagneticButton
            href={cta.href}
            strength={0.25}
            className="sample-pill mt-2 h-[60px] border-stone/40 px-8 text-[17px] font-medium"
          >
            Request samples <span aria-hidden className="sample-arrow ml-2 inline-block">↗</span>
          </MagneticButton>
        </div>

        <div ref={fan} className="relative h-[380px] [perspective:1400px] sm:h-[460px] lg:h-[540px]">
          {site.collection.map((c) => (
            <a
              key={c.slug}
              href={cta.href}
              target="_blank"
              rel="noopener"
              data-sample-tile=""
              aria-label={`Request a ${c.name} sample`}
              onPointerMove={onMove}
              onPointerLeave={onLeave}
              className="sample-tile absolute left-1/2 top-1/2 -ml-[78px] -mt-[110px] h-[220px] w-[156px] sm:-ml-[98px] sm:-mt-[138px] sm:h-[276px] sm:w-[196px] lg:-ml-[115px] lg:-mt-[160px] lg:h-[320px] lg:w-[230px]"
            >
              <span data-tilt="" className="relative block h-full w-full overflow-hidden rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.45)] [transform-style:preserve-3d]">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="230px" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="absolute bottom-3 left-4 text-[16px] font-medium text-white">{c.name}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
