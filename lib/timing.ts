/** Preloader timings in seconds. Spec: the intro stays under 2.2s unless assets are slow. */
export const PRELOADER_TIMING = {
  count: 1.2,
  wipe: 0.9,
  /** longest we hold at 100 waiting for fonts and images */
  holdMax: 1.2,
};
