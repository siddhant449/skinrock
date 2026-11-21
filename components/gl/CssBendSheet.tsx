import type { CSSProperties, ReactNode } from "react";

/** strips on each side of the centre line */
const PER_SIDE = 7;
const STRIPS = PER_SIDE * 2;

/**
 * A stone sheet that really curls, in CSS only (touch devices have no WebGL). The photo is
 * cut into vertical strips joined edge to edge in 3D: each strip hinges on its neighbour and
 * turns a little further as --bend (0 to 1, from the scroll) grows, so the sheet curves.
 * Shading deepens toward the edges as they turn away from the light. No filters or opacity on
 * the strips themselves, which would flatten the 3D.
 */
export function CssBendSheet({ src }: { src: string }) {
  const strip = (side: "left" | "right", depth: number): ReactNode => {
    if (depth >= PER_SIDE) return null;
    // which slice of the photo this strip shows, counted left to right across the sheet
    const k = side === "left" ? PER_SIDE - 1 - depth : PER_SIDE + depth;
    const style = {
      backgroundImage: `url(${src})`,
      backgroundSize: `${STRIPS * 100}% 100%`,
      backgroundPositionX: `${(k / (STRIPS - 1)) * 100}%`,
      ["--d" as string]: depth + 1,
    } as CSSProperties;
    return (
      <div data-bend-strip="" className={`bend-strip bend-strip-${side} ${depth === 0 ? "bend-strip-root" : ""}`} style={style}>
        {strip(side, depth + 1)}
      </div>
    );
  };
  return (
    <div aria-hidden className="bend-strips absolute inset-0">
      {strip("left", 0)}
      {strip("right", 0)}
    </div>
  );
}
