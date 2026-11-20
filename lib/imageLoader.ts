"use client";

import manifest from "./image-manifest.json";

const entries = manifest as Record<string, { hash: string; widths: number[] }>;

/**
 * next/image loader (next.config `images.loaderFile`) and the WebGL texture source: photos
 * are pre-encoded at build time (scripts/optimize-images.mjs), so every size is a static,
 * immutable file on the CDN from the very first visit.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const m = /^\/images\/([^/]+)\.(?:jpe?g|png)$/i.exec(src);
  const entry = m && entries[m[1]];
  if (!entry) return src;
  const w = entry.widths.find((x) => x >= width) ?? entry.widths[entry.widths.length - 1];
  return `/_img/${m[1]}-${entry.hash}-${w}.webp`;
}
