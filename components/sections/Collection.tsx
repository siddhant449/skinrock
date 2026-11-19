"use client";

import Image from "next/image";
import { useState } from "react";
import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { CursorPreview } from "@/components/ui/CursorPreview";

/** Cream chapter: an oversized index of the four families with a cursor-led preview. */
export function Collection() {
  const [active, setActive] = useState<string | null>(null);
  const items = site.collection.map((c) => ({ key: c.slug, image: c.image }));

  return (
    <section id="collection" data-theme="cream" className="relative bg-cream px-5 py-24 text-ink md:px-8 md:py-[16vh]">
      <div className="relative z-20 grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-4">
          <span className="text-label text-glacier-ink">04 / Collection</span>
          <SplitReveal as="h2" className="text-headline text-[clamp(2.5rem,4.6vw,4.75rem)]">
            {site.collectionTitle}
          </SplitReveal>
          <p className="max-w-[30ch] text-base leading-relaxed text-ink/70">{site.collectionIntro}</p>
        </div>

        <ul className="md:col-span-8" onPointerLeave={() => setActive(null)}>
          {site.collection.map((c, i) => (
            <li key={c.slug} className="border-t border-ink/15 last:border-b">
              <a
                data-row=""
                href={c.href}
                target="_blank"
                rel="noopener"
                onPointerEnter={() => setActive(c.slug)}
                onFocus={() => setActive(c.slug)}
                onBlur={() => setActive(null)}
                className="collection-row group grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-5 md:grid-cols-[4rem_1fr_auto] md:py-7"
              >
                <span className="text-label text-glacier-ink">0{i + 1}</span>
                <span className="flex items-center gap-4">
                  <span className="relative h-12 w-10 shrink-0 overflow-hidden md:hidden">
                    <Image src={c.image.src} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="text-headline text-[clamp(2.4rem,7vw,7.5rem)] leading-[0.95] transition-transform duration-700 ease-expo group-hover:translate-x-4 md:group-hover:translate-x-8">
                    {c.name}
                  </span>
                </span>
                <span className="text-right text-[13px] font-medium text-ink/60">
                  {c.count}
                  <span aria-hidden className="ml-3 inline-block transition-transform duration-500 ease-expo group-hover:translate-x-1">
                    ↗
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <CursorPreview items={items} active={active} />
    </section>
  );
}
