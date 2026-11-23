/**
 * How the page scrolls (Lenis options).
 *
 * Desktop: the wheel is smoothed, and each notch carries the page just a touch less far than
 * the browser's default step (0.85 felt too slow).
 *
 * Touch: the page carries the finger's scroll itself (syncTouch) instead of handing it to the
 * phone's native momentum, which flings the page through whole chapters on a quick flick. The
 * page follows the thumb 1:1, then glides on: a flick carries about three quarters as far as the
 * phone's own fling would, and the glide settles briskly (a shorter, slower glide felt heavy).
 * The project gallery keeps its own sideways swipes (data-lenis-prevent-touch).
 *
 * Reduced motion: no smoothing at all.
 */
export function scrollFeel(reduced: boolean) {
  return {
    autoRaf: false,
    lerp: reduced ? 1 : 0.09,
    smoothWheel: !reduced,
    wheelMultiplier: 0.93,
    syncTouch: !reduced,
    syncTouchLerp: 0.1,
    touchInertiaExponent: 1.8,
    anchors: true,
  };
}
