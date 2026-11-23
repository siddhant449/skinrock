/**
 * How the page scrolls (Lenis options).
 *
 * Desktop: the wheel is smoothed, and each notch carries the page a little less far than the
 * browser's default step, so the chapters pass at a reading pace.
 *
 * Touch: the page carries the finger's scroll itself (syncTouch) instead of handing it to the
 * phone's native momentum, which flings the page through whole chapters on a quick flick. The
 * page follows the thumb 1:1, then glides on calmly: flicks travel less far than Lenis's default
 * and ease out a touch slower. The project gallery keeps its own sideways swipes
 * (data-lenis-prevent-touch).
 *
 * Reduced motion: no smoothing at all.
 */
export function scrollFeel(reduced: boolean) {
  return {
    autoRaf: false,
    lerp: reduced ? 1 : 0.09,
    smoothWheel: !reduced,
    wheelMultiplier: 0.85,
    syncTouch: !reduced,
    syncTouchLerp: 0.075,
    touchInertiaExponent: 1.5,
    anchors: true,
  };
}
