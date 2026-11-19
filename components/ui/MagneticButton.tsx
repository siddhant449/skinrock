"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";

type Props = { href: string; children: ReactNode; className?: string; strength?: number };

/** Pill link that leans toward the pointer; the label travels a little further than the shell. */
export function MagneticButton({ href, children, className = "", strength = 0.35 }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { reduced } = useMotionPrefs();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.6 });
  const lx = useTransform(x, (v) => v * 0.45);
  const ly = useTransform(y, (v) => v * 0.45);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const external = href.startsWith("http");

  return (
    <motion.a
      ref={ref}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x, y }}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-stone/25 text-stone transition-colors duration-500 hover:text-ink ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full rounded-full bg-stone transition-transform duration-700 ease-expo group-hover:translate-y-0"
      />
      <motion.span style={{ x: lx, y: ly }} className="relative">
        {children}
      </motion.span>
    </motion.a>
  );
}
