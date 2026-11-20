"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One enormous word at a time while the section is pinned (after SANTAL).
 * Without JS or with reduced motion it is a plain stacked list.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();
  const [stacked, setStacked] = useState(false);
  const words = site.manifesto;
  const notes = site.manifestoNotes;

  useGSAP(
    () => {
      if (reduced) {
        setStacked(false);
        return;
      }
      const mm = gsap.matchMedia();
      // phones: the plain stacked list; the pinned one-word sequence needs a tall, wide screen
      mm.add("(min-width: 768px)", () => {
        setStacked(true);
        const q = gsap.utils.selector(root);
        const items = q<HTMLElement>("[data-word]");
        const captions = q<HTMLElement>("[data-note]");

        gsap.set(items.slice(1), { yPercent: 105 });
        gsap.set(captions.slice(1), { autoAlpha: 0, y: 16 });

        const tl = gsap.timeline({
          defaults: { ease: "power3.inOut", duration: 1 },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * (words.length - 0.5)}`,
            pin: true,
            scrub: 0.8,
          },
        });
        for (let i = 1; i < words.length; i++) {
          tl.to(items[i - 1], { yPercent: -105, filter: "blur(6px)" }, `w${i}`)
            .to(
              captions[i - 1],
              { autoAlpha: 0, y: -16, duration: 0.5 },
              `w${i}`,
            )
            .to(items[i], { yPercent: 0 }, `w${i}`)
            .to(
              captions[i],
              { autoAlpha: 1, y: 0, duration: 0.6 },
              `w${i}+=0.4`,
            );
        }
        tl.to({}, { duration: 0.5 });
        return () => setStacked(false);
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section
      ref={root}
      id="manifesto"
      aria-label="What Skinrock is"
      className="relative flex min-h-svh flex-col justify-between overflow-hidden px-5 py-24 md:px-8 md:py-10"
    >
      <p className="text-label relative z-20 text-mute md:pt-16">Real stone, reimagined</p>

      <div
        className={`relative z-20 ${stacked ? "grid" : "flex flex-col gap-6 py-16"}`}
      >
        {words.map((w, i) => (
          <div
            key={w}
            className={stacked ? "col-start-1 row-start-1 overflow-hidden" : ""}
          >
            <p
              data-word
              className={`text-display whitespace-nowrap text-[clamp(4.5rem,19vw,24rem)] ${
                i === words.length - 1 ? "text-glacier" : ""
              }`}
            >
              {w}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`relative z-20 ${stacked ? "grid" : "flex flex-col gap-2"} md:ml-[50%]`}
      >
        {notes.map((n) => (
          <p
            key={n}
            data-note
            className={`max-w-[32ch] text-[17px] text-stone/90 md:text-lg ${stacked ? "col-start-1 row-start-1" : ""}`}
          >
            {n}
          </p>
        ))}
      </div>
    </section>
  );
}
