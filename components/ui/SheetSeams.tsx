"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Phone chapter handovers (after ERA Residence and Lenval Properties): a section marked
 * data-sheet-over="<id>" rises as an arched sheet over the chapter before it, and the arch
 * flattens as it lands, like a veneer sheet laid flat. The chapter underneath steps back: it
 * sinks a little and dims.
 *
 * Built for the graphics card: the arch is a cream cap riding on the sheet's top edge that is
 * only ever squashed (transform), and the dimming is a veil that only fades (opacity), so
 * nothing on either chapter is restyled or repainted while the page scrolls.
 */
export function SheetSeams() {
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(max-width: 767px)", () => {
        const made: HTMLElement[] = [];
        const add = (parent: HTMLElement, attr: string) => {
          const el = document.createElement("div");
          el.setAttribute(attr, "");
          el.setAttribute("aria-hidden", "true");
          parent.appendChild(el);
          made.push(el);
          return el;
        };
        document.querySelectorAll<HTMLElement>("[data-sheet-over]").forEach((sheet) => {
          const under = document.getElementById(sheet.dataset.sheetOver ?? "");
          if (!under) return;
          const cap = add(sheet, "data-sheet-cap");
          const veil = add(under, "data-sheet-veil");
          gsap
            .timeline({ scrollTrigger: { trigger: sheet, start: "top bottom", end: "top top", scrub: true, invalidateOnRefresh: true } })
            .fromTo(cap, { scaleY: 1 }, { scaleY: 0, ease: "power2.out" }, 0)
            .fromTo(veil, { opacity: 0 }, { opacity: 0.55, ease: "none" }, 0)
            .fromTo(under, { translate: "0px 0px" }, { translate: () => `0px ${Math.round(window.innerHeight * 0.05)}px`, ease: "none" }, 0);
        });
        return () => made.forEach((el) => el.remove());
      });
      return () => mm.revert();
    },
    { dependencies: [reduced] },
  );

  return null;
}
