"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { ScrollFill } from "@/components/ui/ScrollFill";
import { CursorPreview } from "@/components/ui/CursorPreview";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Cream chapter: an oversized index of the four families with a cursor-led preview.
 * Touch has no cursor: every row shows its stone, and the row in the middle of the screen
 * becomes active (name shifts, stone grows, the other rows step back), after ESR Bespoke's
 * marques list; the same centre-band spy as the nav. Tablets keep that list.
 * Phones show the stone itself (after Monolith's catalogue): a two-column grid of sample sheets
 * with the name and count beneath, each opening once like a sheet peeled off the block.
 */
export function Collection() {
  const [active, setActive] = useState<string | null>(null);
  const [centred, setCentred] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const { touch, reduced } = useMotionPrefs();
  const items = site.collection.map((c) => ({ key: c.slug, image: c.image }));

  useEffect(() => {
    // phones show every stone at once in a grid: nothing takes turns there
    if (!touch || !list.current || window.matchMedia("(max-width: 767px)").matches) return;
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set((e.target as HTMLElement).dataset.slug!, e.isIntersecting));
        setCentred(site.collection.find((c) => seen.get(c.slug))?.slug ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    list.current.querySelectorAll<HTMLElement>("[data-row]").forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, [touch]);

  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(max-width: 767px)", () => {
        gsap.utils.toArray<HTMLElement>("[data-swatch]", list.current).forEach((tile, i) => {
          const st = { trigger: tile, start: "top 88%", once: true };
          const delay = (i % 2) * 0.12; // the right-hand sheet follows its neighbour
          gsap.fromTo(tile, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.inOut", delay, scrollTrigger: st });
          gsap.fromTo(tile.querySelector("img"), { scale: 1.15, xPercent: 8 }, { scale: 1, xPercent: 0, duration: 1.3, ease: "expo.out", delay, scrollTrigger: st });
        });
      });
      return () => mm.revert();
    },
    { scope: list, dependencies: [reduced] },
  );

  return (
    <section id="collection" data-theme="cream" data-sheet-over="light" className="relative bg-cream px-5 py-24 text-ink md:px-8 md:py-[16vh]">
      <div className="relative z-20 grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-4">
          <span className="text-label text-glacier-ink">Collection</span>
          <SplitReveal as="h2" className="text-headline text-[clamp(2.5rem,4.6vw,4.75rem)]">
            {site.collectionTitle}
          </SplitReveal>
          <ScrollFill touchOnly start="top 88%" end="bottom 60%" text={site.collectionIntro} className="max-w-[32ch] text-[17px] leading-relaxed md:text-lg text-ink/85" />
        </div>

        <ul
          ref={list}
          className="md:col-span-8 max-md:grid max-md:grid-cols-2 max-md:gap-x-3 max-md:gap-y-9"
          onPointerLeave={() => setActive(null)}
        >
          {site.collection.map((c) => (
            <li key={c.slug} className="border-t border-ink/15 last:border-b max-md:border-0 max-md:last:border-b-0">
              <a
                data-row=""
                data-slug={c.slug}
                data-active={touch && centred ? String(centred === c.slug) : undefined}
                href={c.href}
                target="_blank"
                rel="noopener"
                onPointerEnter={() => setActive(c.slug)}
                onFocus={() => setActive(c.slug)}
                onBlur={() => setActive(null)}
                className="collection-row group grid grid-cols-[1fr_auto] items-center gap-4 py-5 transition-opacity duration-500 data-[active=false]:opacity-50 max-md:flex max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:py-0 md:py-7"
              >
                <span className="flex items-center gap-4 max-md:w-full max-md:flex-col max-md:items-start max-md:gap-3">
                  <span
                    data-swatch=""
                    className={`relative shrink-0 overflow-hidden max-md:aspect-[3/4] max-md:h-auto max-md:w-full max-md:scale-100 max-md:ring-1 max-md:ring-ink/10 ${
                      touch
                        ? // every row reserves the full size; the stone grows by transform, so nothing below jumps
                          "h-24 w-20 origin-left scale-[0.6] transition-transform duration-700 ease-expo group-data-[active=true]:scale-100"
                        : "h-12 w-10 md:hidden"
                    }`}
                  >
                    <Image src={c.image.src} alt="" fill sizes="(max-width: 767px) 45vw, 80px" className="object-cover" />
                  </span>
                  <span
                    data-name=""
                    className="text-headline text-[clamp(2.4rem,7vw,7.5rem)] leading-[0.95] max-md:text-[1.65rem] transition-transform duration-700 ease-expo group-hover:translate-x-4 group-data-[active=true]:translate-x-3 md:group-hover:translate-x-8">
                    {c.name}
                  </span>
                </span>
                <span className="text-right text-[15px] font-medium text-ink/85 max-md:text-left max-md:text-[13px] max-md:text-ink/70">
                  {c.count}
                  {/* a no-break space keeps the arrow with the last word when the label wraps */}
                  {"\u00a0"}
                  <span aria-hidden className="ml-1 inline-block transition-transform duration-500 ease-expo group-hover:translate-x-1">
                    ↗
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {/* the preview follows a cursor, so touch never shows it */}
      <CursorPreview items={items} active={touch ? null : active} />
    </section>
  );
}
