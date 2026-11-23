"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { markLoaded } from "@/lib/loaded";
import { loadImagesEarly } from "@/lib/preload";
import { detectWebGL } from "@/components/providers/MotionPrefs";
import { PRELOADER_TIMING as T } from "@/lib/timing";
import { site } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { HERO_PHOTO_SCALE, HERO_SIZES } from "@/lib/heroWindow";

const SEEN_KEY = "sr-loaded";
/** the small sample tile the window opens to first (clip-path inset, %): wider share on phones */
const TILE_WIDE = "inset(38% 44% 38% 44%)";
// phones: the tile has softly rounded corners, so every phone shape carries "round"
const TILE_NARROW = "inset(38% 31% 38% 31% round 6px)";
const SHUT_NARROW = "inset(50% 50% 50% 50% round 6px)";
const SHUT = "inset(50% 50% 50% 50%)";

/**
 * First visit intro (after ESR Bespoke's rising wordmark and Zirka's opening window):
 * the Skinrock mark rises out of a mask, a small window of stone opens like a sample tile,
 * and once the hero photo has really loaded the window grows to fill the screen and hands
 * over to the page. No fake counter. Rendered in SSR HTML (so the hero never flashes), but
 * CSS only shows it when JS runs, motion is allowed and it hasn't played this session.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const { hero } = site;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    // read the media query directly: the context reports "reduced" until hydration settles
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // photos the WebGL scene draws (desktop) fetch their own files; every other photo loads now.
    // A beat's delay lets the touch layout settle first, so each image asks for its final size.
    const glDrawn = !reduced && detectWebGL();
    const loadPhotos = (nearPx: number) =>
      new Promise<void>((resolve) => setTimeout(() => loadImagesEarly(nearPx, glDrawn).then(resolve), 60));
    if (reduced || seen || getComputedStyle(el).display === "none") {
      markLoaded();
      setDone(true);
      // no intro to cover it: still get every photo in early, once the first screen is up
      const later = () => void loadPhotos(0);
      if (document.readyState === "complete") later();
      else window.addEventListener("load", later, { once: true });
      return;
    }

    const wide = window.matchMedia("(min-width: 768px)").matches;
    const TILE = wide ? TILE_WIDE : TILE_NARROW;
    // phones open to the full screen too, at the hero photo's resting scale, so nothing jumps
    // when the loader fades; the narrow shapes carry a radius, so the open shape spells one out
    const OPEN = wide ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 0% round 0px)";
    const OPEN_SCALE = wide ? 1 : HERO_PHOTO_SCALE;
    const q = gsap.utils.selector(el);
    const win = q<HTMLElement>("[data-loader-window]")[0];
    const photo = win?.querySelector("img");
    // ready = fonts in, the hero photo decoded (the same file the hero shows) and the photos of
    // the first screens in, while the rest keep loading behind the intro; capped, so a slow
    // connection never stalls it
    const firstScreens = loadPhotos(window.innerHeight * 2.5);
    const photoReady = photo
      ? photo.decode().catch(() => new Promise((r) => (photo.complete ? r(0) : photo.addEventListener("load", r, { once: true }))))
      : Promise.resolve();
    const ready = Promise.race([
      Promise.all([document.fonts?.ready, photoReady, firstScreens]),
      new Promise((r) => setTimeout(r, (T.tileAt + T.tile + T.holdMax) * 1000)),
    ]);

    // the mark and the labels have already risen in CSS from the first paint (globals.css)
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(win, { clipPath: wide ? SHUT : SHUT_NARROW }, { clipPath: TILE, duration: T.tile, ease: "expo.out" }, T.tileAt);
    tl.fromTo(photo ?? {}, { scale: 1.35 }, { scale: 1.2, duration: T.tile, ease: "expo.out" }, T.tileAt);
    // hold on the tile until the photo is really there (capped by holdMax)
    tl.add(() => {
      tl.pause();
      ready.then(() => tl.resume());
    });
    tl.add(() => el.setAttribute("data-phase", "open"));
    // fromTo with explicit four-value insets: the browser reports the tile as "inset(38% 44%)",
    // and tweening from that two-value form pairs the wrong edges (the window grew lopsided)
    tl.fromTo(win, { clipPath: TILE }, { clipPath: OPEN, duration: T.expand, ease: "expo.inOut", immediateRender: false });
    tl.to(photo ?? {}, { scale: OPEN_SCALE, duration: T.expand, ease: "expo.inOut" }, "<");
    tl.to(q("[data-loader-mark], [data-loader-meta]"), { autoAlpha: 0, duration: T.expand * 0.5, ease: "power2.in" }, "<");
    tl.add(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
      markLoaded();
    });
    tl.to(el, { autoAlpha: 0, duration: T.fade, ease: "power2.out" });
    tl.add(() => setDone(true));
    tl.play();

    return () => {
      tl.kill();
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} data-preloader="" aria-hidden className="preloader fixed inset-0 z-[70] overflow-hidden bg-ink text-stone">
      {/* the window: the hero photo itself, so it downloads once and the hand-over is seamless */}
      <div data-loader-window="" className="absolute inset-0 z-[2]" style={{ clipPath: SHUT }}>
        <Image
          src={hero.image.src}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes={HERO_SIZES}
          className="object-cover"
        />
      </div>

      <div data-loader-meta="" className="text-label absolute inset-x-5 top-5 z-[1] flex justify-between text-mute md:inset-x-8 md:top-8">
        <span>{hero.eyebrow}</span>
        <span>
          {site.contact.city}, {site.contact.countryName}
        </span>
      </div>

      <div className="absolute inset-x-5 bottom-5 z-[1] overflow-hidden md:inset-x-8 md:bottom-8">
        <div data-loader-mark="">
          <Logo className="block h-auto w-full text-stone" />
        </div>
      </div>
    </div>
  );
}
