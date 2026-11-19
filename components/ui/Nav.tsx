"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { site } from "@/content/site";

/**
 * Fixed nav. Sections marked data-theme="cream" switch it to ink text while they sit
 * under the bar; it hides on scroll down and returns on scroll up.
 */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [onCream, setOnCream] = useState(false);
  const last = useRef(0);

  useLenis((lenis) => {
    const y = lenis.scroll;
    const goingDown = y > last.current + 2;
    const goingUp = y < last.current - 2;
    last.current = y;
    if (goingDown && y > 160) setHidden(true);
    else if (goingUp || y <= 160) setHidden(false);
  });

  useEffect(() => {
    const check = () => {
      const probe = 36;
      const hit = [...document.querySelectorAll<HTMLElement>('[data-theme="cream"]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      setOnCream(hit);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <header
      data-nav-theme={onCream ? "cream" : "ink"}
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,color] duration-700 ease-expo ${
        onCream ? "text-ink" : "text-stone"
      } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <nav aria-label="Main" className="flex items-center justify-between px-5 py-5 text-[13px] font-medium md:px-8 md:py-6">
        <a href="#hero" className="tracking-[0.16em]" aria-label="Skinrock, back to top">
          SKINROCK
        </a>
        <ul className="hidden gap-8 md:flex">
          {site.nav.links.map((l, i) => (
            <li key={l.href}>
              <a href={l.href} className="nav-link inline-flex items-start gap-1">
                <span>{l.label}</span>
                <sup className="text-[9px] opacity-50">0{i + 1}</sup>
              </a>
            </li>
          ))}
        </ul>
        <a href={site.nav.cta.href} className="nav-link">
          {site.nav.cta.label}
        </a>
      </nav>
    </header>
  );
}
