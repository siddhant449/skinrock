/**
 * Tiny "page intro finished" signal. The preloader calls markLoaded(); hero reveals wait on it.
 * If no preloader runs (reduced motion, repeat visit), markLoaded() is called immediately.
 */
const EVENT = "sr:loaded";

export function isLoaded() {
  return typeof document !== "undefined" && document.documentElement.dataset.loaded === "true";
}

export function markLoaded() {
  if (isLoaded()) return;
  document.documentElement.dataset.loaded = "true";
  window.dispatchEvent(new Event(EVENT));
}

export function onLoaded(cb: () => void): () => void {
  if (isLoaded()) {
    cb();
    return () => {};
  }
  window.addEventListener(EVENT, cb, { once: true });
  return () => window.removeEventListener(EVENT, cb);
}

/** Guarantees the intro signal fires even if no preloader runs or it fails. */
export function scheduleLoadedFallback(ms = 3000): () => void {
  const id = window.setTimeout(markLoaded, ms);
  return () => window.clearTimeout(id);
}
