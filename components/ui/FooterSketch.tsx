"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotionPrefs } from "@/components/providers/MotionPrefs";
import { BLOCK_PATHS, CURL, LABEL, SKETCH, posePaths, type SketchPose } from "@/lib/stoneSketch";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** light: one short pulse per beam travels this many units a second, in through the stone and
    out warm the other side, then the beam rests until the next pulse; the three beams take turns */
const LIGHT_SPEED = 92;
const PULSE = 30;
const CYCLE = 500;
const OFF = `${PULSE} 4000`;

const SKIN_KEYS = ["skinTop", "skinBottom", "skinBack", "skinEnds"] as const;

/**
 * The footer's live drawing (after the Truvolt footer): a blueprint of the product that draws
 * itself in as the page ends and then keeps working. A block of stone has had its 1.5 mm skin
 * peeled away; the skin keeps flexing, light keeps running through it (it arrives cool and
 * leaves warm) and the strata of the rock shimmer one after another. The loop rests while the
 * footer is off screen. With reduced motion the markup is the finished, still drawing.
 */
export function FooterSketch({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionPrefs();
  const rest = posePaths(CURL.rest);

  useGSAP(
    () => {
      const el = root.current;
      if (reduced || !el) return;
      const q = gsap.utils.selector(el);
      const flows = q<SVGPathElement>("[data-flow]");
      const fades = q<SVGElement>("[data-fade]");

      // attr, not CSS: CSSPlugin rounds px values, which would snap these 0 to 1 offsets
      gsap.set(q("[data-draw]"), { attr: { "stroke-dasharray": "1 2", "stroke-dashoffset": 1.01 } });
      gsap.set([...fades, ...flows], { opacity: 0 });

      // the pose: every line that moves is rebuilt from the curl of the skin
      const state = { curl: CURL.rest };
      const pick = (sel: string) => q<SVGPathElement>(sel);
      const skin = SKIN_KEYS.map((k) => [k, pick(`[data-skin="${k}"]`)[0]] as const);
      const generators = pick("[data-pose='generators']")[0];
      const veins = pick("[data-pose='veins']")[0];
      const raysIn = pick("[data-ray='in']");
      const raysOut = pick("[data-ray='out']");
      const pulsesIn = pick("[data-pulse='in']");
      const pulsesOut = pick("[data-pulse='out']");
      let lightIn = posePaths(CURL.rest).lightIn;
      const pose = () => {
        const p: SketchPose = posePaths(state.curl);
        skin.forEach(([k, path]) => path?.setAttribute("d", p[k]));
        generators?.setAttribute("d", p.generators);
        veins?.setAttribute("d", p.veins);
        [raysIn, pulsesIn].forEach((set) => set.forEach((r, i) => r.setAttribute("d", p.raysIn[i])));
        [raysOut, pulsesOut].forEach((set) => set.forEach((r, i) => r.setAttribute("d", p.raysOut[i])));
        lightIn = p.lightIn;
      };

      /* The live loop: one paused timeline owns every repeating tween, so resting off screen
         is a single pause() and the context revert kills all of it. */
      const loop = gsap.timeline({ paused: true });
      // 1. the skin flexes: out to its widest, then slowly back and forth, like a sheet in the hand
      loop
        .to(state, { curl: CURL.max, duration: 1.6, ease: "sine.inOut", onUpdate: pose }, 0)
        .fromTo(
          state,
          { curl: CURL.max },
          { curl: CURL.min, duration: 3.4, ease: "sine.inOut", repeat: -1, yoyo: true, onUpdate: pose, immediateRender: false },
          1.6,
        );
      // 2. light: a pulse runs in along each beam, passes through the stone and leaves warm
      const travel = { u: 0 };
      const shine = () =>
        pulsesIn.forEach((pin, i) => {
          const u = (travel.u + (i * CYCLE) / pulsesIn.length) % CYCLE;
          pin.setAttribute("stroke-dashoffset", String(-u));
          pulsesOut[i]?.setAttribute("stroke-dashoffset", String(lightIn[i] - u));
        });
      shine();
      loop.to(flows, { opacity: 1, duration: 0.8, ease: "power1.out" }, 0);
      loop.fromTo(travel, { u: 0 }, { u: CYCLE, duration: CYCLE / LIGHT_SPEED, ease: "none", repeat: -1, onUpdate: shine }, 0);
      // 3. the strata of the rock shimmer, one after another
      q<SVGPathElement>("[data-stratum]").forEach((s, i) =>
        loop.fromTo(s, { opacity: 1 }, { opacity: 0.4, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true }, i * 0.4),
      );

      let drawn = false;
      const live = (on: boolean) => {
        el.setAttribute("data-live", on ? "on" : "off");
        if (on) loop.play();
        else loop.pause();
      };
      const visible = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => drawn && live(self.isActive),
      });

      // the draw-in, in the order a draughtsman would: the rock, its strata, the skin, the details
      const draw = { attr: { "stroke-dashoffset": 0 }, ease: "power2.inOut" };
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          drawn = true;
          live(visible.isActive);
        },
      });
      tl.to(q("[data-draw='block']"), { ...draw, duration: 0.8, stagger: 0.12 }, 0)
        .to(q("[data-draw='strata']"), { ...draw, duration: 0.6, stagger: 0.08 }, 0.5)
        .to(q("[data-draw='skin']"), { ...draw, duration: 0.9, stagger: 0.1 }, 0.9)
        .to(q("[data-draw='detail']"), { ...draw, duration: 0.7, stagger: 0.08 }, 1.5)
        .to(fades, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.9);
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tl.play() });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <div ref={root} data-footer-sketch="" aria-hidden className={`footer-sketch ${className}`}>
      <svg
        viewBox={`0 0 ${SKETCH.w} ${SKETCH.h}`}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="sk-soft">
          <path data-draw="detail" pathLength={1} d={BLOCK_PATHS.dims} />
          <path data-draw="block" pathLength={1} d={BLOCK_PATHS.peel} />
          <path data-draw="detail" data-pose="generators" pathLength={1} d={rest.generators} />
        </g>
        <g className="sk-ink">
          <path data-draw="block" pathLength={1} d={BLOCK_PATHS.outline} />
          <path data-draw="block" pathLength={1} d={BLOCK_PATHS.faces} />
        </g>
        <g className="sk-strata">
          {BLOCK_PATHS.strata.map((d) => (
            <path key={d} data-draw="strata" data-stratum="" pathLength={1} d={d} />
          ))}
        </g>
        <path className="sk-vein" data-draw="detail" data-pose="veins" pathLength={1} d={rest.veins} />
        <g className="sk-ink">
          {SKIN_KEYS.map((k) => (
            <path key={k} data-draw="skin" data-skin={k} pathLength={1} d={rest[k]} />
          ))}
        </g>
        {/* light: faint beams arrive cool from the right and leave warm through the stone */}
        <g className="sk-beam-cool">
          {rest.raysIn.map((d, i) => (
            <path key={i} data-draw="detail" data-ray="in" pathLength={1} d={d} />
          ))}
        </g>
        <g className="sk-beam-warm">
          {rest.raysOut.map((d, i) => (
            <path key={i} data-draw="detail" data-ray="out" pathLength={1} d={d} />
          ))}
        </g>
        {/* the pulses that travel along them: faded in by the live loop */}
        <g className="sk-pulse sk-cool">
          {rest.raysIn.map((d, i) => (
            <path key={i} data-pulse="in" data-flow="" strokeDasharray={OFF} d={d} />
          ))}
        </g>
        <g className="sk-pulse sk-warm">
          {rest.raysOut.map((d, i) => (
            <path key={i} data-pulse="out" data-flow="" strokeDasharray={OFF} d={d} />
          ))}
        </g>
        <text data-fade="" className="sk-label" x={LABEL.x} y={LABEL.y} textAnchor="end">
          {LABEL.text}
        </text>
      </svg>
    </div>
  );
}
