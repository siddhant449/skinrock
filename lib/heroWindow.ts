/**
 * The hero photo's scale at rest on touch: the in-frame parallax (1.12) times the slow drift
 * (1.04). The loader's stone window grows to exactly this scale as it opens to the full screen,
 * so the hand-over into the phone hero is seamless.
 */
export const HERO_PHOTO_SCALE = 1.165;

/**
 * How wide the hero photo is drawn: phones crop the landscape photo to a tall screen, so it is
 * drawn about three screen widths wide and must be fetched at that size or it turns soft. The
 * loader shows the same photo with the same sizes, so the browser downloads it once.
 */
export const HERO_SIZES = "(min-width: 768px) 60vw, 330vw";
