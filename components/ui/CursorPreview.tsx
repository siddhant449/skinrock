"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { SiteImage } from "@/content/site";
import { clamp, cubicBezier, mapRange } from "@/lib/math";
import { springFollow } from "./springFollow";

type Item = { key: string; image: SiteImage };

const SPRING = { stiffness: 180, damping: 22, mass: 0.5 };
const START = -400;
const EASE = cubicBezier(0.16, 1, 0.3, 1); // --ease-expo
const HIDDEN_BELOW = "inset(100% 0% 0% 0%)";
const SHOWN = "inset(0% 0% 0% 0%)";
const GONE_ABOVE = "inset(0% 0% 100% 0%)";

/** The element's current inset() clip as four explicit values, so GSAP tweens each edge. */
function clipOf(el: HTMLElement) {
  const n = el.style.clipPath.match(/-?[\d.]+%/g) ?? ["100%"];
  const [t, r = t, b = t, l = r] = n;
  return `inset(${t} ${r} ${b} ${l})`;
}

/** A stone sample that trails the cursor and leans with its speed. */
export function CursorPreview({ items, active }: { items: Item[]; active: string | null }) {
  const root = useRef<HTMLDivElement>(null);
  const shown = useRef<string | null>(null);
  const layer = useRef(1);
  // a preview's image is only fetched once it has been asked for, then stays for reuse
  const [mounted, setMounted] = useState<string[]>([]);
  if (active && !mounted.includes(active)) setMounted([...mounted, active]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const s = springFollow(
      SPRING,
      (x, y, vx) => {
        const rotate = clamp(mapRange(vx, -2000, 2000, -10, 10), -10, 10);
        el.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${rotate}deg)`;
      },
      { x: START, y: START },
    );
    const onMove = (e: PointerEvent) => s.set(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      s.kill();
    };
  }, []);

  // enter from below while the previous sample leaves upward (they overlap, newest on top)
  useEffect(() => {
    const prev = shown.current;
    if (prev === active) return;
    shown.current = active;
    const find = (key: string) => root.current?.querySelector<HTMLElement>(`[data-key="${key}"]`);
    const out = prev ? find(prev) : null;
    if (out) {
      gsap.fromTo(out, { clipPath: clipOf(out) }, {
        clipPath: GONE_ABOVE,
        scale: 1.05,
        duration: 0.6,
        ease: EASE,
        overwrite: true,
        onComplete: () => gsap.set(out, { visibility: "hidden" }),
      });
    }
    const next = active ? find(active) : null;
    if (next) {
      // a sample still on its way out turns around from where it is
      if (next.style.visibility !== "visible") gsap.set(next, { clipPath: HIDDEN_BELOW, scale: 1.15, visibility: "visible" });
      gsap.set(next, { zIndex: ++layer.current });
      gsap.fromTo(next, { clipPath: clipOf(next) }, { clipPath: SHOWN, scale: 1, duration: 0.6, ease: EASE, overwrite: true });
    }
  }, [active, mounted]);

  return (
    <div
      ref={root}
      data-cursor-preview=""
      aria-hidden
      style={{ transform: `translateX(${START}px) translateY(${START}px)` }}
      className="pointer-events-none fixed left-0 top-0 z-40 hidden h-[22vw] max-h-[340px] w-[17vw] max-w-[260px] -translate-x-1/2 -translate-y-1/2 md:block"
    >
      {items
        .filter((i) => mounted.includes(i.key))
        .map((i) => (
          <div
            key={i.key}
            data-key={i.key}
            className="absolute inset-0 overflow-hidden"
            style={{ visibility: "hidden", clipPath: HIDDEN_BELOW }}
          >
            <Image src={i.image.src} alt="" fill sizes="260px" className="object-cover" />
          </div>
        ))}
    </div>
  );
}
