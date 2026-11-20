"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useLenis } from "lenis/react";
import { site } from "@/content/site";

const SECTION_OF: Record<string, string> = Object.fromEntries(
  site.nav.links.map((l) => [l.href.slice(1), l.href]),
);

/** A label that rolls up on hover: the word slides out and an identical copy rises from below. */
function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll-a">{children}</span>
      <span className="roll-b" aria-hidden>
        {children}
      </span>
    </span>
  );
}

/**
 * Swiss grid bar (after AAT Architecten, Montfort, SANTAL). Links sit on the page's
 * 12 column grid; the bar goes solid after the hero, cream over cream chapters,
 * hides on scroll down and returns on scroll up. Phones get a full screen index.
 */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [onCream, setOnCream] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const last = useRef(0);
  const hiddenRef = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // scroll direction: only touch React state when the answer changes
  const lenis = useLenis(
    useCallback((l: { scroll: number }) => {
      const y = l.scroll;
      const delta = y - last.current;
      last.current = y;
      let next = hiddenRef.current;
      if (y <= 160) next = false;
      else if (delta > 2) next = true;
      else if (delta < -2) next = false;
      if (next !== hiddenRef.current) {
        hiddenRef.current = next;
        setHidden(next);
      }
    }, []),
  );

  // solid after the hero, cream theme, and current section: all from IntersectionObservers
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const hero = document.getElementById("hero");
    if (hero) {
      const io = new IntersectionObserver(
        ([e]) => setSolid(!e.isIntersecting),
        { rootMargin: "-72px 0px 0px 0px" },
      );
      io.observe(hero);
      observers.push(io);
    }
    const band = (px: number) =>
      `-${px}px 0px -${Math.max(0, window.innerHeight - px - 1)}px 0px`;
    const creams = new Map<Element, boolean>();
    const creamIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => creams.set(e.target, e.isIntersecting));
        setOnCream([...creams.values()].some(Boolean));
      },
      { rootMargin: band(36) },
    );
    document
      .querySelectorAll('[data-theme="cream"]')
      .forEach((el) => creamIO.observe(el));
    observers.push(creamIO);

    const visible = new Map<string, boolean>();
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const hit = Object.keys(SECTION_OF).find((id) => visible.get(id));
        setCurrent(hit ? SECTION_OF[hit] : null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    Object.keys(SECTION_OF).forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    observers.push(spy);
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // menu: lock scroll, focus the first link, Escape closes and returns focus
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [open, lenis]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    // let the menu release the scroll lock first
    requestAnimationFrame(() => {
      if (lenis) {
        lenis.start();
        lenis.scrollTo(target, { duration: 1.4 });
      } else target.scrollIntoView({ behavior: "smooth" });
    });
  };

  const theme = onCream ? "cream" : "ink";

  return (
    <>
      <header
        data-nav-theme={theme}
        data-solid={solid ? "true" : "false"}
        className={`nav-bar fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color] duration-700 ease-expo ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${onCream && !open ? "text-ink" : "text-stone"} ${
          solid && !open
            ? onCream
              ? "bg-cream/95"
              : "bg-ink/92"
            : "bg-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className="relative grid grid-cols-[1fr_auto] items-center px-5 py-5 text-[15px] font-medium md:grid-cols-12 md:gap-x-5 md:px-8 md:py-6"
        >
          <a
            href="#hero"
            onClick={(e) => go(e, "#hero")}
            className="nav-item tracking-[0.16em] md:col-span-3"
            aria-label="Skinrock, back to top"
          >
            SKINROCK
          </a>
          {site.nav.links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => go(e, l.href)}
              aria-current={current === l.href ? "true" : undefined}
              style={{ ["--i" as string]: i + 1 }}
              className={`nav-item nav-roll hidden transition-opacity duration-500 md:block md:col-span-1 ${i === 0 ? "md:col-start-5" : ""} ${
                current && current !== l.href ? "opacity-55" : "opacity-100"
              }`}
            >
              <Roll>{l.label}</Roll>
            </a>
          ))}
          <a
            href={site.nav.cta.href}
            onClick={(e) => go(e, site.nav.cta.href)}
            style={{ ["--i" as string]: 7 }}
            className="nav-item nav-roll nav-cta hidden justify-self-end whitespace-nowrap md:col-span-2 md:col-start-11 md:inline-flex"
          >
            <Roll>{site.nav.cta.label}</Roll>
            <span aria-hidden className={`nav-arrow ml-2 ${onCream ? "text-glacier-ink" : "text-glacier"}`}>
              ↗
            </span>
          </a>
          <button
            ref={menuButton}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="nav-item flex items-center gap-3 md:hidden"
          >
            <span className={`burger ${open ? "is-open" : ""}`} aria-hidden>
              <i />
              <i />
            </span>
            Menu
          </button>
          <span
            aria-hidden
            className="nav-rule pointer-events-none absolute inset-x-5 bottom-0 h-px bg-current opacity-15 md:inset-x-8"
          />
        </nav>
      </header>

      {/* outside the header: the header's translate would trap a fixed child inside the bar */}

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className="mobile-menu fixed inset-0 z-40 flex flex-col justify-between bg-deep px-5 pb-8 pt-24 text-stone md:hidden"
      >
        <ul>
          {[...site.nav.links, site.nav.cta].map((l, i) => (
            <li
              key={l.href}
              style={{ ["--i" as string]: i }}
              className="mobile-item border-t border-stone/12"
            >
              <a
                ref={i === 0 ? firstLink : undefined}
                href={l.href}
                onClick={(e) => go(e, l.href)}
                className="text-headline flex items-baseline justify-between py-3 text-[clamp(2.25rem,11vw,3.5rem)]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[16px] leading-relaxed text-stone/90">
          {site.contact.company}
          <br />
          {site.contact.street}, {site.contact.postal} {site.contact.city}
        </p>
      </div>
    </>
  );
}
