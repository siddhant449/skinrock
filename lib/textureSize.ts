/**
 * WebGL textures are fetched through the Next image optimizer at the size they are drawn,
 * instead of the 2000px originals. Widths must be in next.config `images.deviceSizes`
 * (the defaults below), or the optimizer rejects the request.
 */
export const TEXTURE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

/** The canvas renders at most at this pixel ratio (GLCanvas `dpr`). */
export const MAX_GL_DPR = 1.75;

type Fit = {
  /** CSS size of the box the texture fills (object-fit: cover) */
  boxWidth: number;
  boxHeight: number;
  /** intrinsic size of the source image */
  imageWidth: number;
  imageHeight: number;
  devicePixelRatio: number;
  /** extra magnification applied in the shader (parallax zoom, reframing) */
  zoom?: number;
};

/**
 * Smallest optimizer width that still gives at least one texel per drawn pixel.
 * Never asks for more than the source has (the optimizer does not upscale).
 */
export function textureWidth({ boxWidth, boxHeight, imageWidth, imageHeight, devicePixelRatio, zoom = 1 }: Fit): number {
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), MAX_GL_DPR);
  // cover: the image is scaled until both sides fill the box, so the binding side decides
  const coverWidth = Math.max(boxWidth, boxHeight * (imageWidth / imageHeight));
  const needed = Math.min(coverWidth * dpr * zoom, imageWidth);
  return TEXTURE_WIDTHS.find((w) => w >= needed) ?? TEXTURE_WIDTHS[TEXTURE_WIDTHS.length - 1];
}

/** URL of the optimised image at `width`, using the default next/image loader format. */
export function textureUrl(src: string, width: number, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
