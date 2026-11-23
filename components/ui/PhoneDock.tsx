"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { glideTo, onPageScroll } from "@/lib/pageScroll";
import { site } from "@/content/site";
import { onLoaded } from "@/lib/loaded";
import { LogoMark } from "./Logo";

/** the name the dock shows for each chapter, in page order (each chapter's own label) */
const CHAPTERS: [id: string, name: string][] = [
  ["hero", "Skinrock"],
  ["manifesto", "Real stone"],
  ["flex", site.flex.kicker],
  ["light", site.light.kicker],
  ["collection", "Collection"],
  ["projects", "Projects"],
  ["why", site.whyKicker],
  ["proof", "Swiss proof"],
  ["samples", "Samples"],
  ["footer", "Studio"],
];

/** Stones is the row of swatches; the other chapters are plain links */
const LINKS = site.nav.links.filter((l) => l.href !== "#collection");

/**
 * Phones (after Fluid Glass): the navigation sits at the foot of the screen, under the thumb, as
 * a slim dock: the S mark (back to the top), the name of the chapter you are reading, and the
 * menu. It steps aside while you read on and comes back when you scroll up. The menu grows out
 * of the dock as a card over the dimmed page: the four stones, the chapters, a samples button
 * and the studio's address. Tablets and desktop keep the top bar (components/ui/Nav.tsx).
 */
export function PhoneDock() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState(CHAPTERS[0][1]);
  const hiddenRef = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // steps aside on the way down, back on the way up (and always at the top of the page)
  useEffect(
    () =>
      onPageScroll(({ y, velocity }) => {
        let next = hiddenRef.current;
        if (y <= 160) next = false;
        else if (velocity > 2) next = true;
        else if (velocity < -2) next = false;
        if (next !== hiddenRef.current) {
          hiddenRef.current = next;
          setHidden(next);
        }
      }),
    [],
  );

  // rises into place once the intro has handed over
  useEffect(() => onLoaded(() => setReady(true)), []);

  // the chapter in the middle band of the screen names itself in the dock
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const hit = CHAPTERS.find(([id]) => seen.get(id));
        if (hit) setChapter(hit[1]);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    CHAPTERS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    return () => spy.disconnect();
  }, []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  }, []);

  // open: the page holds still, focus moves into the card, Escape closes and hands focus back
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const first = card.current?.querySelector<HTMLElement>("a");
    // after the card has started to grow, so the focus ring does not flash on a clipped card
    const t = window.setTimeout(() => first?.focus({ preventScroll: true }), 120);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, close]);

  // keep Tab inside the card and the dock while the menu is open
  const trap = (e: ReactKeyboardEvent) => {
    if (!open || e.key !== "Tab") return;
    const items = [...(card.current?.querySelectorAll<HTMLElement>("a, button") ?? []), ...(bar.current?.querySelectorAll<HTMLElement>("a, button") ?? [])];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
    e.preventDefault();
    items[next].focus();
  };

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    // let the menu release the scroll lock first
    requestAnimationFrame(() => glideTo(target));
  };

  return (
    <div className="md:hidden" onKeyDown={trap}>
      {/* the page dims behind the card; a tap on it closes the menu */}
      <div aria-hidden data-open={open} className="dock-veil fixed inset-0 z-[55]" onClick={() => close()} />

      <div
        ref={card}
        id="phone-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-open={open}
        inert={!open}
        className="dock-card fixed z-[56] flex flex-col overflow-y-auto bg-deep text-stone"
      >
        <a
          href="#collection"
          onClick={(e) => go(e, "#collection")}
          aria-label="Stones"
          data-item=""
          style={{ ["--i" as string]: 0 }}
          className="block"
        >
          <span className="text-label text-mute">Stones</span>
          <ul aria-hidden className="mt-3 grid grid-cols-4 gap-2">
            {site.collection.map((c) => (
              <li key={c.slug} data-menu-swatch="">
                <span className="relative block aspect-square overflow-hidden ring-1 ring-stone/10">
                  <Image src={c.image.src} alt="" fill sizes="96px" className="object-cover" />
                </span>
                <span className="mt-1.5 block text-[11px] leading-tight text-stone/80">{c.name}</span>
              </li>
            ))}
          </ul>
        </a>

        <ul className="mt-6 flex flex-col">
          {LINKS.map((l, i) => (
            <li key={l.href} data-item="" style={{ ["--i" as string]: i + 1 }}>
              <a href={l.href} onClick={(e) => go(e, l.href)} className="text-headline block py-1 text-[clamp(1.75rem,8vw,2.1rem)] leading-[1.1]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={site.nav.cta.href}
          onClick={(e) => go(e, site.nav.cta.href)}
          data-item=""
          style={{ ["--i" as string]: LINKS.length + 1 }}
          className="dock-cta mt-6 flex items-center justify-center gap-2 bg-stone py-4 text-[15px] font-medium text-ink"
        >
          {site.nav.cta.label}
          <span aria-hidden>↗</span>
        </a>

        <p data-item="" style={{ ["--i" as string]: LINKS.length + 2 }} className="mt-5 text-[13px] leading-snug text-mute">
          {site.contact.company}, {site.contact.street}, {site.contact.postal} {site.contact.city}
        </p>
      </div>

      <div data-dock="" data-hidden={hidden && !open} data-ready={ready} className="dock fixed z-[57]">
        <nav ref={bar} aria-label="Main" className="dock-bar flex h-[52px] items-stretch bg-ink text-stone">
          <a
            href="#hero"
            onClick={(e) => go(e, "#hero")}
            aria-label="Skinrock, back to top"
            className="grid w-[52px] shrink-0 place-items-center border-r border-stone/10"
          >
            <LogoMark className="h-[18px] w-auto" />
          </a>
          <span className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden">
            <span data-dock-chapter="" key={chapter} className="dock-chapter text-label truncate">
              {chapter}
            </span>
          </span>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="phone-menu"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="grid w-[52px] shrink-0 place-items-center border-l border-stone/10"
          >
            <span className={`burger ${open ? "is-open" : ""}`} aria-hidden>
              <i />
              <i />
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
