"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

/** Paragraph whose words brighten one by one as it scrolls through the viewport. */
export function ScrollFill({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      // aria "none": words stay real text for screen readers (aria-label is not allowed on <p>)
      const split = SplitText.create(ref.current, { type: "words", aria: "none" });
      gsap.fromTo(
        split.words,
        { opacity: 0.4 }, // still >= 3:1 for this large text before it fills
        {
          opacity: 1,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: "top 82%", end: "bottom 42%", scrub: 0.6 },
        },
      );
      return () => split.revert();
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <p ref={ref} className={className}>
      {text}
    </p>
  );
}
