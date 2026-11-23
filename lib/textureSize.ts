import imageLoader from "./imageLoader";

/**
 * WebGL textures are fetched at the size they are drawn instead of the 2000px originals,
 * from the same pre-encoded files as next/image (lib/imageLoader.ts).
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

/** URL of the pre-encoded image at `width` (or the next size up). */
export function textureUrl(src: string, width: number): string {
  return imageLoader({ src, width });
}

type Box = { width: number; height: number };

/** the texture a GLImage draws for a box this size (its parallax zooms in by 1 + 2 * parallax) */
export function glImageTexture(src: string, box: Box, imageWidth: number, imageHeight: number, parallax: number): string {
  return textureUrl(
    src,
    textureWidth({
      boxWidth: box.width || imageWidth,
      boxHeight: box.height || imageHeight,
      imageWidth,
      imageHeight,
      devicePixelRatio: window.devicePixelRatio,
      zoom: 1 + parallax * 2,
    }),
  );
}

/** the backlit stone's texture: the shader frames the photo 1.22x tighter */
export function backlightTexture(src: string, box: Box, imageWidth: number, imageHeight: number): string {
  return textureUrl(
    src,
    textureWidth({
      boxWidth: box.width || imageWidth,
      boxHeight: box.height || imageHeight,
      imageWidth,
      imageHeight,
      devicePixelRatio: window.devicePixelRatio,
      zoom: 1.22,
    }),
  );
}

/** the bending sheet's texture: the close-up is smaller than the sheet is drawn, so full size */
export function bendTexture(src: string, imageWidth: number): string {
  return textureUrl(src, TEXTURE_WIDTHS.find((w) => w >= imageWidth) ?? 2048);
}
