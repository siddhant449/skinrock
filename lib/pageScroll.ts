/**
 * The page scrolls natively, like any other website. These helpers only read that scrolling
 * (once per frame, for the bars that step aside and the shaders that react to speed) and glide
 * to a chapter when a menu link is chosen.
 */

type Listener = (s: { y: number; velocity: number }) => void;

const listeners = new Set<Listener>();
let lastY = 0;
let latest = 0;
let frame = 0;

function notify() {
  frame = 0;
  const y = latest;
  const velocity = y - lastY;
  lastY = y;
  listeners.forEach((l) => l({ y, velocity }));
}

function onScroll() {
  // read here, where the layout is still clean: the scroll event comes before the frame's
  // animation work, and reading the position after that work would force an early layout
  latest = window.scrollY;
  if (!frame) frame = requestAnimationFrame(notify);
}

/** Calls `listener` at most once a frame while the page scrolls; returns the unsubscribe. */
export function onPageScroll(listener: Listener): () => void {
  if (!listeners.size) {
    lastY = latest = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** Glides to a chapter (or a position) with the browser's own smooth scroll; instant with reduced motion. */
export function glideTo(target: HTMLElement | number) {
  const top = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}
