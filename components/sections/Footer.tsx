"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { site } from "@/content/site";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Editorial footer with a full-bleed wordmark that rises into place (after WRK, Storey). */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const lenis = useLenis();
  const c = site.contact;

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(
        q("[data-wordmark] span"),
        { yPercent: 70 },
        {
          yPercent: 0,
          ease: "none",
          stagger: 0.04,
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true },
        },
      );
    },
    { scope: root, dependencies: [reduced] },
  );

  const toTop = () => (lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0 }));

  return (
    <footer ref={root} id="footer" className="relative overflow-hidden border-t border-stone/10 bg-ink px-5 pt-16 md:px-8 md:pt-24">
      <div className="relative z-20 grid grid-cols-2 gap-10 text-[15px] leading-relaxed md:grid-cols-12">
        <div className="col-span-2 flex flex-col gap-3 md:col-span-4">
          <span className="text-label text-mute">Studio</span>
          <address className="not-italic text-stone/90">
            {c.company}
            <br />
            {c.street}
            <br />
            {c.postal} {c.city}
            <br />
            {c.countryName}
          </address>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3 md:col-span-3">
          <span className="text-label text-mute">Index</span>
          <ul className="flex flex-col gap-1.5">
            {site.nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="nav-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 md:col-span-3">
          <span className="text-label text-mute">Legal</span>
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
        <div className="col-span-2 flex flex-col items-start gap-3 md:col-span-2 md:items-end">
          <span className="text-label text-mute">{site.tagline}</span>
          <button type="button" onClick={toTop} className="nav-link mt-auto cursor-pointer">
            Back to top ↑
          </button>
        </div>
      </div>

      <div className="relative z-20 mt-16 flex items-end justify-between gap-6 border-t border-stone/10 py-5 text-[14px] text-mute md:mt-24">
        <span>© {site.copyrightYear} {c.company}</span>
        <span>Created in Switzerland</span>
      </div>

      <p
        data-wordmark=""
        aria-hidden
        className="text-display relative z-20 -mb-[0.1em] flex justify-between overflow-hidden whitespace-nowrap text-[19.6vw] leading-[0.8] text-stone"
      >
        {"SKINROCK".split("").map((ch, i) => (
          <span key={i} className="inline-block">
            {ch}
          </span>
        ))}
      </p>
    </footer>
  );
}
