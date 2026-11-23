"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/content/site";
import { BacklightStone } from "@/components/gl/BacklightStone";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { ScrollFill } from "@/components/ui/ScrollFill";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The signature chapter: the lamp behind the stone turns on as you scroll. */
export function Light() {
  const root = useRef<HTMLElement>(null);
  const intensity = useRef({ value: 0 });
  const { reduced } = useMotionPrefs();
  const { light } = site;

  useGSAP(
    () => {
      if (reduced) {
        intensity.current.value = 1;
        return;
      }
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      const build = (pinned: boolean) => {
        const tl = gsap.timeline({
          scrollTrigger: pinned
            ? {
                trigger: root.current,
                start: "top top",
                end: () => `+=${window.innerHeight}`,
                pin: true,
                scrub: 1,
              }
            : // phones: no pin; the chapter is taller than the screen
              {
                trigger: root.current,
                start: "top 70%",
                end: "center center",
                scrub: 1,
              },
        });
        // the shader reads intensity directly; without WebGL (touch) the photo's glow reads it
        // through --glow, so the lamp switches on with scroll on every device
        const lamp = q<HTMLElement>("[data-backlight]")[0];
        tl.fromTo(
          intensity.current,
          { value: 0.04 },
          {
            value: 1,
            ease: "power2.in",
            duration: 1,
            onUpdate: () => lamp?.style.setProperty("--glow", intensity.current.value.toFixed(3)),
          },
          0,
        );
        tl.fromTo(
          q("[data-use]"),
          { color: "#8FA0B3" },
          { color: "#EEE9E0", stagger: 0.12, duration: 0.3 },
          0.35,
        );
      };
      mm.add("(min-width: 768px)", () => build(true));
      // phones (after Sobha's portrait that grows to full bleed and brightens): the backlit stone
      // starts as an inset window and opens to the full width as it rises, switching the lamp on
      // as it goes, so you watch the stone become the light
      mm.add("(max-width: 767px)", () => {
        const lamp = q<HTMLElement>("[data-backlight]")[0];
        if (!lamp) return;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: lamp, start: "top 92%", end: "center 52%", scrub: 1 },
        });
        tl.fromTo(
          lamp,
          { clipPath: "inset(9% 11% 9% 11% round 6px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.out", duration: 1 },
          0,
        );
        tl.fromTo(
          intensity.current,
          { value: 0.04 },
          {
            value: 1,
            ease: "power2.in",
            duration: 1,
            onUpdate: () => lamp.style.setProperty("--glow", intensity.current.value.toFixed(3)),
          },
          0,
        );
        gsap.fromTo(
          q("[data-use]"),
          { color: "#8FA0B3" },
          {
            color: "#EEE9E0",
            stagger: 0.12,
            duration: 0.3,
            scrollTrigger: { trigger: q("ul")[0], start: "top 85%", end: "top 55%", scrub: 1 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section
      ref={root}
      id="light"
      data-recede=""
      className="relative min-h-svh overflow-hidden bg-ink"
    >
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-2">
        <div className="relative z-20 flex flex-col justify-between gap-12 px-5 py-24 md:px-8 md:py-[14vh]">
          <div className="flex items-start gap-6">
            <div className="flex flex-col gap-6">
              <span className="text-label text-glacier">
                {light.kicker}
              </span>
              <SplitReveal
                as="h2"
                className="text-headline text-[clamp(2.75rem,6vw,6.5rem)]"
              >
                {light.title}
              </SplitReveal>
            </div>
          </div>
          <ScrollFill
            text={light.paragraph}
            className="text-headline max-w-[22ch] text-[clamp(1.6rem,2.6vw,2.6rem)] leading-[1.08]"
          />
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium text-mute">
            {light.uses.map((u) => (
              <li key={u} data-use>
                {u}
              </li>
            ))}
          </ul>
        </div>
        <BacklightStone
          image={light.image}
          intensity={intensity}
          className="relative min-h-[70svh] md:min-h-svh"
        />
      </div>
    </section>
  );
}
