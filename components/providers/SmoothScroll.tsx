"use client";

import { useEffect, type ReactNode } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionPrefs } from "./MotionPrefs";

gsap.registerPlugin(ScrollTrigger);
// phones show and hide their address bar while scrolling; re-measuring every pin on each of
// those resizes makes pinned chapters jump, so ScrollTrigger ignores them
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Drives whichever Lenis instance is live from GSAP's ticker. Lenis may be recreated
 * (its options change when motion prefs settle after hydration), so this follows the
 * reactive instance from useLenis rather than a ref captured once.
 */
function LenisGsapBridge() {
  const lenis = useLenis(ScrollTrigger.update);
  useEffect(() => {
    if (!lenis) return;
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(tick);
  }, [lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        lerp: reduced ? 1 : 0.09,
        smoothWheel: !reduced,
        // touch scrolls natively: the phone's own scrolling runs on the graphics thread with
        // its own momentum, so it stays smooth even while the page animates, and nested
        // scrollers (the project gallery) keep their swipes; desktop keeps the smoothed wheel
        syncTouch: false,
        anchors: true,
      }}
    >
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
