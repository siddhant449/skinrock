/**
 * Getting the page's pictures in before they are needed. The intro switches every image the
 * page has laid out from lazy to eager, so the browser fetches exactly the file each one will
 * show (its own srcset choice), and waits for those near the top. WebGL textures are fetched at
 * their own sizes, so the scene warms those files instead (see `warm`).
 */

/** what the WebGL stage asks for when it fetches a texture; a warm fetch must match it */
export const IMG_ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";

const warmed = new Set<string>();

/** fetch a file into the browser cache once, at low priority, so it is there when asked for */
export function warm(url: string) {
  if (warmed.has(url)) return;
  warmed.add(url);
  fetch(url, { headers: { Accept: IMG_ACCEPT }, priority: "low" } as RequestInit).catch(() => warmed.delete(url));
}

/** photos the WebGL scene draws on desktop: their own <img> is only a stand-in until then */
const GL_DRAWN = "[data-gl-image], [data-backlight], [data-bend]";

/**
 * Start loading every image the page has laid out (images hidden on this screen size are left
 * alone). Resolves once those within `nearPx` of the top are decoded. With `glDrawn`, photos the
 * WebGL scene will draw keep their lazy stand-in, since the scene fetches its own files.
 */
export function loadImagesEarly(nearPx: number, glDrawn = false): Promise<void> {
  const near: Promise<unknown>[] = [];
  for (const img of Array.from(document.images)) {
    if (!img.getClientRects().length) continue;
    if (glDrawn && img.closest(GL_DRAWN)) continue;
    if (img.loading === "lazy") img.loading = "eager";
    if (img.getBoundingClientRect().top + window.scrollY < nearPx) near.push(img.decode().catch(() => undefined));
  }
  return Promise.all(near).then(() => undefined);
}
