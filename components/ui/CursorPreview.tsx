"use client";

import Image from "next/image";
import { useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useVelocity, useTransform } from "motion/react";
import type { SiteImage } from "@/content/site";

type Item = { key: string; image: SiteImage };

/** A stone sample that trails the cursor and leans with its speed. */
export function CursorPreview({ items, active }: { items: Item[]; active: string | null }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const x = useSpring(mx, { stiffness: 180, damping: 22, mass: 0.5 });
  const y = useSpring(my, { stiffness: 180, damping: 22, mass: 0.5 });
  const vx = useVelocity(x);
  const rotate = useTransform(vx, [-2000, 2000], [-10, 10], { clamp: true });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  const current = items.find((i) => i.key === active);

  return (
    <motion.div
      data-cursor-preview=""
      aria-hidden
      style={{ x, y, rotate }}
      className="pointer-events-none fixed left-0 top-0 z-40 hidden h-[22vw] max-h-[340px] w-[17vw] max-w-[260px] -translate-x-1/2 -translate-y-1/2 md:block"
    >
      <AnimatePresence mode="popLayout">
        {current && (
          <motion.div
            key={current.key}
            initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.15 }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)", scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 overflow-hidden"
          >
            <Image src={current.image.src} alt="" fill sizes="260px" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
