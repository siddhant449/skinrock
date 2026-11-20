import { describe, it, expect } from "vitest";
import { site } from "@/content/site";
import { PRELOADER_TIMING, introLength } from "@/lib/timing";

describe("pending values come from site.specs", () => {
  it("manifesto, flex and seo use the spec values", () => {
    expect(site.manifesto[3]).toBe(`${site.specs.thickness.min} mm.`);
    expect(site.flex.stats[0].value).toBe(site.specs.thickness.min);
    expect(site.seo.description).toContain(site.specs.thickness.value);
  });
});

describe("copy stays within what the current site says", () => {
  it("translucency is attributed to selected stones, not the whole range", () => {
    expect(site.hero.lede).toMatch(/selected stones/i);
    expect(site.manifestoNotes[2]).toMatch(/selected stones/i);
  });
  it("does not name stone types for the AgBB result", () => {
    const agbb = site.proof.find((p) => p.standard.startsWith("AgBB"))!;
    expect(agbb.result).not.toMatch(/slate|quartzite/i);
  });
});

describe("preloader", () => {
  it("the intro stays under the spec's 2.2s when nothing has to wait", () => {
    expect(introLength()).toBeLessThanOrEqual(2.2);
  });
  it("never holds on the tile for long, even on a slow connection", () => {
    expect(introLength() + PRELOADER_TIMING.holdMax).toBeLessThanOrEqual(3.5);
  });
});

describe("collection count", () => {
  it("counts stones separately from the acoustic panel (10 + 8 + 24)", () => {
    const stones = site.flex.stats.find((s) => s.label.startsWith("Stones"))!;
    expect(stones.value).toBe(42);
    expect(site.collectionTitle).toMatch(/forty two stones/i);
  });
});
