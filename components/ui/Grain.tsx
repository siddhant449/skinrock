/** Fixed film grain over everything. Pure CSS; static under reduced motion. */
export function Grain() {
  return <div aria-hidden className="grain pointer-events-none fixed inset-[-15%] z-[60]" />;
}
