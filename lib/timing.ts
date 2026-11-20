/** Preloader timings in seconds. Spec: the intro stays under 2.2s unless assets are slow. */
export const PRELOADER_TIMING = {
  /** the Skinrock mark rises out of its mask */
  mark: 0.7,
  /** the stone window opens to a small tile, starting this long after the mark */
  tileAt: 0.3,
  tile: 0.55,
  /** the window grows to fill the screen once the hero photo is in */
  expand: 0.85,
  /** the loader fades off the page */
  fade: 0.35,
  /** longest we hold on the tile waiting for fonts and the hero photo */
  holdMax: 1.2,
};

/** Length of the intro when nothing has to wait. */
export function introLength(t = PRELOADER_TIMING): number {
  return Math.max(t.mark, t.tileAt + t.tile) + t.expand + t.fade;
}
