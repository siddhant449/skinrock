"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

type Props = {
  text: string;
  className?: string;
  /** only on touch devices (phones, tablets): desktop keeps a plain paragraph */
  touchOnly?: boolean;
  /** where the fill starts and ends (ScrollTrigger positions) */
  start?: string;
  end?: string;
};

/** Paragraph whose words brighten one by one as it scrolls through the viewport (after Riotters). */
export function ScrollFill({ text, className, touchOnly = false, start = "top 82%", end = "bottom 42%" }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { reduced, touch } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced || !ref.current || (touchOnly && !touch)) return;
      // aria "none": words stay real text for screen readers (aria-label is not allowed on <p>)
      const split = SplitText.create(ref.current, { type: "words", aria: "none" });
      gsap.fromTo(
        split.words,
        { opacity: 0.4 }, // still >= 3:1 for this large text before it fills
        {
          opacity: 1,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start, end, scrub: 0.6 },
        },
      );
      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced, touch, touchOnly, start, end] },
  );

  return (
    <p ref={ref} data-scroll-fill="" className={className}>
      {text}
    </p>
  );
}
