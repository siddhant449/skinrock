"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Phone chapter handovers (after ERA Residence and Lenval Properties): a section marked
 * data-sheet-over="<id>" rises as an arched sheet over the chapter before it, and the arch
 * flattens as it lands, like a veneer sheet laid flat. The chapter underneath steps back
 * (it dims and lags a little) through --recede. The arch and overlap are set in CSS from
 * first paint (app/globals.css), so nothing jumps when this takes over.
 */
export function SheetSeams() {
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(max-width: 767px)", () => {
        document.querySelectorAll<HTMLElement>("[data-sheet-over]").forEach((sheet) => {
          const under = document.getElementById(sheet.dataset.sheetOver ?? "");
          if (!under) return;
          gsap
            .timeline({ scrollTrigger: { trigger: sheet, start: "top bottom", end: "top top", scrub: true } })
            .fromTo(
              sheet,
              { borderTopLeftRadius: "50% 10vh", borderTopRightRadius: "50% 10vh" },
              { borderTopLeftRadius: "50% 0vh", borderTopRightRadius: "50% 0vh", ease: "power2.out" },
              0,
            )
            .fromTo(under, { "--recede": 0 }, { "--recede": 1, ease: "none" }, 0);
        });
      });
      return () => mm.revert();
    },
    { dependencies: [reduced] },
  );

  return null;
}
