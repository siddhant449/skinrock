"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent } from "react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { springFollow } from "./springFollow";

type Props = { href: string; children: ReactNode; className?: string; strength?: number };

const SPRING = { stiffness: 220, damping: 18, mass: 0.6 };
const move = (x: number, y: number) => (x === 0 && y === 0 ? "" : `translateX(${x}px) translateY(${y}px)`);

/** Pill link that leans toward the pointer; the label travels a little further than the shell. */
export function MagneticButton({ href, children, className = "", strength = 0.35 }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const spring = useRef<ReturnType<typeof springFollow> | null>(null);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    const s = springFollow(SPRING, (x, y) => {
      if (ref.current) ref.current.style.transform = move(x, y);
      if (label.current) label.current.style.transform = move(x * 0.45, y * 0.45);
    });
    spring.current = s;
    return () => {
      s.kill();
      spring.current = null;
    };
  }, []);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    spring.current?.set((e.clientX - (r.left + r.width / 2)) * strength, (e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => spring.current?.set(0, 0);

  const external = href.startsWith("http");

  return (
    <a
      ref={ref}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-stone/25 text-stone transition-colors duration-500 hover:text-ink ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full rounded-full bg-stone transition-transform duration-700 ease-expo group-hover:translate-y-0"
      />
      <span ref={label} className="relative">
        {children}
      </span>
    </a>
  );
}
