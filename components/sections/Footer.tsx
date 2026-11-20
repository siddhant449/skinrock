"use client";

import { useRef, type MouseEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { site } from "@/content/site";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Wordmark geometry in SVG units. Inter's cap height is 0.727 em. The letters sit on the
 * page edge with only a sliver of their bottom trimmed (about 12%), the way current
 * editorial footers bleed a wordmark without chopping it.
 */
const WM = (() => {
  const width = 1000;
  const size = 206;
  const cap = size * 0.727;
  const top = 2; // a hair of air above the letters
  const visible = 0.88; // share of the letter height shown above the page edge
  return { width, size, baseline: top + cap, boxHeight: Math.round(top + cap * visible) };
})();

/** Section links shown as rows (Studio is this footer itself). */
const ROWS = site.nav.links.filter((l) => l.href !== "#footer");

/**
 * Invitation with link rows (after Trionn, Mesh Optical, Make Believe on footer.design):
 * a large "Let's talk stone.", big link rows that slide and light up on hover,
 * and a faint wordmark rising behind as the page ends.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const lenis = useLenis();
  const c = site.contact;

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      // the word rises into its resting place on the page edge as the page ends
      gsap.fromTo(
        q("[data-wordmark]"),
        { yPercent: 60 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true },
        },
      );
      // opacity, not visibility: rows stay in the accessibility tree while they animate in
      gsap.from(q("[data-row]"), {
        y: 28,
        opacity: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: q("[data-rows]")[0], start: "top 85%", once: true },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: "smooth" });
  };
  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: "smooth" }));

  return (
    <footer ref={root} id="footer" className="relative overflow-hidden bg-deep px-5 pt-20 md:px-8 md:pt-28">
      <div className="relative z-20 grid grid-cols-1 gap-14 md:grid-cols-[1.25fr_1fr] md:gap-16">
        <div>
          <p className="text-display text-[clamp(3.25rem,6.6vw,7rem)] leading-[0.92]">
            Let&apos;s talk <span className="text-glacier">stone.</span>
          </p>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-[17px]">
            <a href={site.cta.href} target="_blank" rel="noopener" className="nav-link">
              Request samples ↗
            </a>
            <button type="button" onClick={toTop} className="nav-link cursor-pointer">
              Back to top ↑
            </button>
          </div>
        </div>

        <nav aria-label="Footer" data-rows>
          {ROWS.map((l) => (
            <a
              key={l.href}
              data-row
              href={l.href}
              onClick={(e) => go(e, l.href)}
              className="footer-row group grid grid-cols-[1fr_auto] items-center border-t border-stone/12 py-4 text-[clamp(1.5rem,2.2vw,2rem)] font-medium tracking-[-0.03em] last:border-b md:py-5"
            >
              <span>{l.label}</span>
              <span aria-hidden className="footer-arrow text-[18px] text-mute">
                ↗
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div className="relative z-20 mt-20 grid grid-cols-1 gap-10 text-[16px] leading-relaxed text-stone/90 sm:grid-cols-3 md:mt-24">
        <div>
          <span className="text-label mb-4 block text-mute">Studio</span>
          <address className="not-italic">
            {c.company}
            <br />
            {c.street}, {c.postal} {c.city}
            <br />
            {c.countryName}
          </address>
        </div>
        <div>
          <span className="text-label mb-4 block text-mute">Legal</span>
          <ul className="flex flex-col gap-1.5">
            {site.legal.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener" className="nav-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-label mb-4 block text-mute">Material</span>
          <p>{site.tagline}</p>
        </div>
      </div>

      <div className="relative z-20 mt-16 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-stone/10 py-5 text-[14px] text-mute md:mt-20">
        <span>
          © {site.copyrightYear} {c.company}
        </span>
        <span>Created in Switzerland</span>
      </div>

      {/* Edge to edge, resting on the end of the page. An SVG so the word fills the exact
          width at any screen size (letter spacing adjusts, glyphs keep their shape). */}
      <div className="-mx-5 mt-8 overflow-hidden md:-mx-8 md:mt-14">
        <svg
          data-wordmark=""
          aria-hidden
          viewBox={`0 0 ${WM.width} ${WM.boxHeight}`}
          className="pointer-events-none block w-full select-none"
        >
          <text
            x="0"
            y={WM.baseline}
            textLength={WM.width}
            lengthAdjust="spacing"
            fill="rgba(238, 233, 224, 0.09)"
            style={{ font: `500 ${WM.size}px var(--font-sans)` }}
          >
            SKINROCK
          </text>
        </svg>
      </div>
    </footer>
  );
}
