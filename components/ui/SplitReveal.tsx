"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { onLoaded } from "@/lib/loaded";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "load" waits for the intro (hero); "scroll" plays when the element enters the viewport. */
  trigger?: "load" | "scroll";
  delay?: number;
  stagger?: number;
  id?: string;
};

/**
 * Word-rise reveal. Server HTML is plain, readable text; splitting happens after hydration.
 * `data-reveal` hides the text only while JS is about to animate it (see globals.css fallback).
 */
export function SplitReveal({
  as: Tag = "div",
  children,
  className,
  trigger = "scroll",
  delay = 0,
  stagger = 0.045,
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (reduced) {
        el.dataset.revealed = "true";
        return;
      }
      let cleanup: (() => void) | undefined;
      const split = SplitText.create(el, {
        type: "words",
        mask: "words",
        aria: "auto",
        autoSplit: true,
        onSplit(self) {
          const tween = gsap.fromTo(
            self.words,
            { yPercent: 112 },
            { yPercent: 0, duration: 1.15, ease: "expo.out", stagger, delay, paused: true },
          );
          el.dataset.revealed = "true";
          if (trigger === "load") {
            cleanup = onLoaded(() => tween.play());
          } else {
            const st = ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tween.play() });
            cleanup = () => st.kill();
          }
          return tween;
        },
      });
      return () => {
        cleanup?.();
        split.revert();
      };
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <Tag ref={ref} id={id} className={className} data-reveal="">
      {children}
    </Tag>
  );
}
