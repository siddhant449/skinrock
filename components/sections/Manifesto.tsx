"use client";

import { Fragment, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Morph timing on the pinned timeline: switch i starts at LEAD + (i - 1) * STEP and lasts MORPH. */
const LEAD = 0.4;
const STEP = 1;
const MORPH = 0.55;

/**
 * One enormous word at a time while the section is pinned (after SANTAL). Each word melts into
 * the next (Originkit's Text Morph, driven by scroll): both words blur and cross over, and an
 * alpha threshold fuses them into one liquid shape. The threshold only runs during a switch,
 * so the words are crisp at rest; the notes are hidden while it runs.
 * Phones get it too (it is what makes the chapter move there). Without JS or with reduced
 * motion it is a plain stacked list.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const morph = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  const [stacked, setStacked] = useState(false);
  const words = site.manifesto;
  const notes = site.manifestoNotes;
  const filterId = `manifesto-morph-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useGSAP(
    () => {
      if (reduced) {
        setStacked(false);
        return;
      }
      const mm = gsap.matchMedia();
      // every screen gets the pinned one-word sequence; reduced motion and no-JS keep the plain list
      mm.add({ phone: "(max-width: 767px)", wide: "(min-width: 768px)" }, (ctx) => {
        setStacked(true);
        const q = gsap.utils.selector(root);
        const items = q<HTMLElement>("[data-word]");
        const captions = q<HTMLElement>("[data-note]");
        const box = morph.current;
        // Originkit blurs 20px on 120px type; keep that ratio for these much larger words,
        // or the shapes never soften enough to melt and just print over each other
        const blur = `blur(${Math.round(parseFloat(getComputedStyle(items[0]).fontSize) * 0.18)}px)`;
        const melt = (on: boolean) => {
          if (box) box.style.filter = on ? `url(#${filterId})` : "none";
        };
        const cleanup = () => {
          setStacked(false);
          if (box) box.style.filter = "";
        };

        gsap.set(items.slice(1), { autoAlpha: 0, filter: blur, scale: 0.8 });
        gsap.set(captions.slice(1), { autoAlpha: 0, y: 16 });

        if (ctx.conditions?.phone) {
          // phones: the scroll picks the word and each change plays the whole melt in time, so
          // a reader who stops mid-scroll never looks at two words fused half way
          let current = 0;
          let playing: gsap.core.Timeline | undefined;
          // a named context method: the morphs it starts later are still cleaned up on revert
          const show = ctx.add("show", (next: number) => {
            if (next === current) return;
            const from = current;
            const dir = next > from ? 1 : -1;
            current = next;
            playing?.progress(1).kill();
            melt(true);
            playing = gsap
              .timeline({ onComplete: () => melt(false) })
              .to(captions[from], { autoAlpha: 0, y: -12 * dir, duration: 0.18, ease: "power2.in" }, 0)
              .to(items[from], { autoAlpha: 0, filter: blur, scale: dir > 0 ? 1.2 : 0.8, duration: 0.6, ease: "power1.in" }, 0.05)
              .fromTo(
                items[next],
                { autoAlpha: 0, filter: blur, scale: dir > 0 ? 0.8 : 1.2 },
                { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: 0.6, ease: "power1.out" },
                0.05,
              )
              .fromTo(captions[next], { autoAlpha: 0, y: 16 * dir }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.62);
          }) as (next: number) => void;
          // where each word takes over, as a share of the pinned run: the first word holds a
          // little, the last stays a while before the page moves on
          const takeover = words.slice(1).map((_, k) => 0.2 + k * 0.25);
          ScrollTrigger.create({
            trigger: root.current,
            start: "top top",
            // phones scroll in shorter screens: a tighter run keeps the four words from dragging
            end: () => `+=${window.innerHeight * (words.length - 1.2)}`,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => show(takeover.filter((t) => self.progress >= t).length),
          });
          return () => {
            playing?.kill();
            cleanup();
          };
        }

        const switches = words.slice(1).map((_, k) => LEAD + k * STEP);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * (words.length - 0.5)}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.8,
          },
          onUpdate() {
            const t = this.time();
            melt(switches.some((s) => t > s + 0.01 && t < s + MORPH - 0.01));
          },
        });
        switches.forEach((s, k) => {
          const i = k + 1;
          // the note leaves before the words melt and the next one arrives after
          tl.to(captions[i - 1], { autoAlpha: 0, y: -12, duration: 0.2, ease: "power2.in" }, s - 0.22);
          tl.to(items[i - 1], { autoAlpha: 0, filter: blur, scale: 1.2, duration: MORPH, ease: "power1.in" }, s);
          tl.to(items[i], { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: MORPH, ease: "power1.out" }, s);
          tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, s + MORPH + 0.02);
        });
        tl.to({}, { duration: 0.5 });
        return cleanup;
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced, filterId] },
  );

  return (
    <section
      ref={root}
      id="manifesto"
      aria-label="What Skinrock is"
      data-theme="cream"
      className="relative flex min-h-svh flex-col overflow-hidden bg-cream px-5 py-24 text-ink md:px-8 md:py-10"
    >
      {/* the morph: blurred words overlap, and an alpha threshold fuses them into one shape */}
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
        <filter id={filterId}>
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8" result="fused" />
          <feComposite in="SourceGraphic" in2="fused" operator="atop" />
        </filter>
      </svg>

      <p className="text-label relative z-20 text-glacier-ink md:pt-16">Real stone, reimagined</p>
      {/* the morph shows one word at a time; screen readers get the whole statement */}
      <p className="sr-only">{words.map((w, i) => `${w} ${notes[i]}`).join(" ")}</p>

      {/* One container, words and notes interleaved: on phones a plain list where each note
          sits under its word; on desktop a grid stacking all words in one cell and all notes
          in another, so the pinned timeline can swap them in place (same DOM either way). */}
      <div
        ref={morph}
        data-morph=""
        aria-hidden
        className={`relative z-20 ${
          stacked ? "grid flex-1 grid-cols-1 grid-rows-[1fr_auto] pb-6" : "flex flex-col gap-12 py-14"
        }`}
      >
        {words.map((w, i) => (
          <Fragment key={w}>
            <div className={stacked ? "col-start-1 row-start-1 self-center" : ""}>
              <p
                data-word
                className={`text-display w-fit whitespace-nowrap text-[28vw] md:text-[clamp(4.5rem,19vw,24rem)] ${
                  i === words.length - 1 ? "text-glacier-ink" : ""
                }`}
              >
                {w}
              </p>
            </div>
            <p
              data-note
              className={`max-w-[32ch] text-[17px] text-ink/90 md:text-lg ${
                stacked ? "col-start-1 row-start-2 md:ml-[50%]" : "-mt-9"
              }`}
            >
              {notes[i]}
            </p>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
