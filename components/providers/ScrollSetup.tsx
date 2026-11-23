"use client";

import { useEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// phones show and hide their address bar while scrolling; re-measuring every pin on each of
// those resizes makes pinned chapters jump, so ScrollTrigger ignores them
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * The page scrolls natively (wheel, trackpad and touch), like any other website: no smoothing
 * library sits in the scroll path. Scroll-linked animations re-measure once the fonts have
 * settled the text (ScrollTrigger already re-measures on the page's load by itself; every photo
 * sits in a box of fixed shape, so photos arriving never move anything).
 */
export function ScrollSetup({ children }: { children: ReactNode }) {
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && ScrollTrigger.refresh());
    return () => {
      live = false;
    };
  }, []);
  return <>{children}</>;
}
