"use client";

import { useEffect } from "react";
import { Loader, NoColorSpace, Texture, TextureLoader, LinearFilter, LinearMipmapLinearFilter } from "three";
import { useLoader, useThree } from "@react-three/fiber";

/**
 * createImageBitmap with options decodes on a worker thread. Same guard as three's GLTFLoader:
 * Safari before 17 and Firefox before 98 lack the options used here, so they take the <img> path.
 */
function bitmapsSupported() {
  if (typeof createImageBitmap === "undefined") return false;
  const ua = navigator.userAgent;
  if (/^((?!chrome|android).)*safari/i.test(ua)) {
    const v = ua.match(/version\/(\d+)/i);
    return !!v && Number(v[1]) >= 17;
  }
  const ff = ua.match(/firefox\/(\d+)/i);
  return !ff || Number(ff[1]) >= 98;
}

const IMG_ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";

/**
 * Loads a photo as a texture without blocking the main thread. A texture made from an <img>
 * is decoded synchronously inside texImage2D, which cost 30 to 50 ms per photo mid-scroll.
 */
class StoneTextureLoader extends Loader<Texture> {
  mipmaps = true;

  load(url: string, onLoad: (t: Texture) => void, _onProgress?: unknown, onError?: (e: unknown) => void) {
    const done = (t: Texture) => {
      t.colorSpace = NoColorSpace;
      t.generateMipmaps = this.mipmaps;
      t.minFilter = this.mipmaps ? LinearMipmapLinearFilter : LinearFilter;
      t.needsUpdate = true;
      onLoad(t);
    };
    const viaImage = () => new TextureLoader(this.manager).load(url, done, undefined, onError);
    if (!bitmapsSupported()) return viaImage();
    // Chrome's own <img> Accept header: the optimizer answers with AVIF or WebP, and when the
    // DOM image already fetched this exact URL the response comes from the HTTP cache
    fetch(url, { credentials: "same-origin", headers: { Accept: IMG_ACCEPT } })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.blob();
      })
      .then((blob) =>
        // raw pass-through, flipped the way WebGL expects (flipY is ignored for ImageBitmaps)
        createImageBitmap(blob, { imageOrientation: "flipY", premultiplyAlpha: "none", colorSpaceConversion: "none" }),
      )
      .then((bitmap) => {
        const t = new Texture(bitmap);
        t.flipY = false;
        done(t);
      })
      .catch(viaImage);
  }
}

/** For planes drawn at about their texture size. */
class FlatTextureLoader extends StoneTextureLoader {
  mipmaps = false;
}

/**
 * Suspends until the photo is decoded, then uploads it to the GPU straight away (outside a
 * render frame). Each URL is cached by the loader, so a remount costs nothing.
 */
export function useStoneTexture(url: string, { mipmaps = true }: { mipmaps?: boolean } = {}) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const tex = useLoader(mipmaps ? StoneTextureLoader : FlatTextureLoader, url);
  useEffect(() => {
    gl.initTexture(tex);
    invalidate();
  }, [gl, tex, invalidate]);
  return tex;
}
