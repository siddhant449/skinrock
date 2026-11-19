"use client";

import { useEffect, useState, type RefObject } from "react";

/** True once the element comes within `margin` of the viewport; stays true afterwards. */
export function useNear(ref: RefObject<HTMLElement | null>, enabled: boolean, margin = "50% 0px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || near || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled, near, margin]);
  return near;
}
