import { gsap } from "gsap";
import { springAtRest, stepSpring, type SpringParams, type SpringState } from "@/lib/math";

type Update = (x: number, y: number, vx: number, vy: number) => void;

/**
 * A 2D spring that chases a target on GSAP's ticker (already running for the animations) and stops
 * ticking once it rests. Replaces motion's useSpring, so the motion library is not shipped.
 */
export function springFollow(params: SpringParams, onUpdate: Update, start = { x: 0, y: 0 }) {
  const sx: SpringState = { x: start.x, v: 0 };
  const sy: SpringState = { x: start.y, v: 0 };
  let tx = start.x;
  let ty = start.y;
  let running = false;

  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 0.064);
    stepSpring(sx, tx, params, dt);
    stepSpring(sy, ty, params, dt);
    if (springAtRest(sx, tx) && springAtRest(sy, ty)) {
      sx.x = tx;
      sy.x = ty;
      sx.v = sy.v = 0;
      stop();
    }
    onUpdate(sx.x, sy.x, sx.v, sy.v);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  };

  return {
    set(x: number, y: number) {
      tx = x;
      ty = y;
      if (!running) {
        running = true;
        gsap.ticker.add(tick);
      }
    },
    kill: stop,
  };
}
