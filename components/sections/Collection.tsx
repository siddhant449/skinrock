"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { CursorPreview } from "@/components/ui/CursorPreview";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

/**
 * Cream chapter: an oversized index of the four families with a cursor-led preview.
 * Touch has no cursor: every row shows its stone, and the row in the middle of the screen
 * becomes active (name shifts, stone grows, the other rows step back), after ESR Bespoke's
 * marques list on phones; the same centre-band spy as the nav.
 */
export function Collection() {
  const [active, setActive] = useState<string | null>(null);
  const [centred, setCentred] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const { touch } = useMotionPrefs();
  const items = site.collection.map((c) => ({ key: c.slug, image: c.image }));

  useEffect(() => {
    if (!touch || !list.current) return;
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

  return (
    <section id="collection" data-theme="cream" className="relative bg-cream px-5 py-24 text-ink md:px-8 md:py-[16vh]">
      <div className="relative z-20 grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-4">
          <span className="text-label text-glacier-ink">Collection</span>
          <SplitReveal as="h2" className="text-headline text-[clamp(2.5rem,4.6vw,4.75rem)]">
            {site.collectionTitle}
          </SplitReveal>
          <p className="max-w-[32ch] text-[17px] leading-relaxed md:text-lg text-ink/85">{site.collectionIntro}</p>
        </div>

        <ul ref={list} className="md:col-span-8" onPointerLeave={() => setActive(null)}>
          {site.collection.map((c) => (
            <li key={c.slug} className="border-t border-ink/15 last:border-b">
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
                className="collection-row group grid grid-cols-[1fr_auto] items-center gap-4 py-5 transition-opacity duration-500 data-[active=false]:opacity-50 md:py-7"
              >
                <span className="flex items-center gap-4">
                  <span
                    className={`relative shrink-0 overflow-hidden ${
                      touch
                        ? // every row reserves the full size; the stone grows by transform, so nothing below jumps
                          "h-24 w-20 origin-left scale-[0.6] transition-transform duration-700 ease-expo group-data-[active=true]:scale-100"
                        : "h-12 w-10 md:hidden"
                    }`}
                  >
                    <Image src={c.image.src} alt="" fill sizes="80px" className="object-cover" />
                  </span>
                  <span className="text-headline text-[clamp(2.4rem,7vw,7.5rem)] leading-[0.95] transition-transform duration-700 ease-expo group-hover:translate-x-4 group-data-[active=true]:translate-x-3 md:group-hover:translate-x-8">
                    {c.name}
                  </span>
                </span>
                <span className="text-right text-[15px] font-medium text-ink/85">
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
