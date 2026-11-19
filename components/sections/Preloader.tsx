"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { markLoaded } from "@/lib/loaded";
import { PRELOADER_TIMING } from "@/lib/timing";
import { site } from "@/content/site";

const SEEN_KEY = "sr-loaded";

/**
 * Counter 0 to 100, then a wipe upward. Rendered in SSR HTML (so the hero never flashes),
 * but CSS only shows it when JS runs, motion is allowed and it hasn't played this session.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    // read the media query directly: the context reports "reduced" until hydration settles
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || seen || getComputedStyle(el).display === "none") {
      markLoaded();
      setDone(true);
      return;
    }

    const state = { v: 0 };
    const ready = Promise.race([
      Promise.all([document.fonts?.ready, new Promise((r) => (document.readyState === "complete" ? r(0) : window.addEventListener("load", r, { once: true })))]),
      new Promise((r) => setTimeout(r, (PRELOADER_TIMING.count + PRELOADER_TIMING.holdMax) * 1000)),
    ]);

    const tl = gsap.timeline({ paused: true });
    tl.to(state, {
      v: 100,
      duration: PRELOADER_TIMING.count,
      ease: "power2.inOut",
      onUpdate: () => {
        const n = Math.round(state.v);
        if (count.current) count.current.textContent = String(n).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${state.v / 100})`;
      },
    });
    // hold at 100 until fonts and images are in (capped by PRELOADER_TIMING.holdMax)
    tl.add(() => {
      tl.pause();
      ready.then(() => tl.resume());
    });
    tl.add(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
      markLoaded();
    });
    tl.to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: PRELOADER_TIMING.wipe, ease: "expo.inOut" }, "<");
    tl.add(() => setDone(true));
    tl.play();

    return () => {
      tl.kill();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      data-preloader=""
      aria-hidden
      className="preloader fixed inset-0 z-[70] flex-col justify-between bg-ink p-5 text-stone md:p-8"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div className="text-label flex justify-between text-mute">
        <span className="tracking-[0.16em] text-stone">SKINROCK</span>
        <span>
          {site.contact.city}, {site.contact.countryName}
        </span>
      </div>
      <div className="flex items-end justify-between gap-6">
        <span ref={count} className="text-display text-[clamp(5rem,16vw,15rem)] tabular-nums">
          000
        </span>
        <span className="text-label mb-[1.4vw] hidden text-mute md:block">Natural stone veneer</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-stone/10">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-glacier" />
      </div>
    </div>
  );
}
