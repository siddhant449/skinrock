/**
 * The phone hero's framed window (a clip-path inset over the full-screen photo). The loader
 * opens its stone window to exactly this frame on phones and fades out, so the hand-over into
 * the hero is seamless; scrolling then opens the hero window to full screen.
 * app/globals.css repeats the inset for first paint (kept in step by tests/unit/hero-window.test.ts).
 */
export const HERO_WINDOW = "inset(14% 5% 25% 5% round 10px)";
export const HERO_WINDOW_OPEN = "inset(0% 0% 0% 0% round 0px)";
/** the hero photo's scale at rest on touch (in-frame parallax 1.12 times the drift's 1.04) */
export const HERO_PHOTO_SCALE = 1.165;
