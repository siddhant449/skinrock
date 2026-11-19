import { describe, it, expect } from "vitest";
import { site } from "@/content/site";
import { collectStrings } from "@/lib/text";

describe("content rules", () => {
  it("content has no em or en dashes", () => {
    const offenders = collectStrings(site).filter((s) => /[–—]/.test(s));
    expect(offenders).toEqual([]);
  });

  it("every image has alt text of at least 12 characters", () => {
    for (const img of Object.values(site.images)) {
      expect(img.alt.length, img.src).toBeGreaterThanOrEqual(12);
    }
  });

  it("manifesto is the four agreed words", () => {
    expect(site.manifesto).toEqual(["Stone.", "Bends.", "Glows.", "1.5 mm."]);
  });

  it("collection lists the four categories", () => {
    expect(site.collection.map((c) => c.name)).toEqual(["Slate", "Quartzite", "Marble", "Acoustic"]);
  });

  it("has at least eight captioned projects", () => {
    expect(site.projects.length).toBeGreaterThanOrEqual(8);
    for (const p of site.projects) expect(p.use && p.setting).toBeTruthy();
  });

  it("flags specs pending client confirmation", () => {
    expect(site.specs.thickness.pending).toBe(true);
    expect(site.specs.thickness.value).toBe("1.5 to 3 mm");
  });
});

describe("collectStrings", () => {
  it("walks nested objects and arrays", () => {
    expect(collectStrings({ a: "x", b: [{ c: "y" }, 3], d: null })).toEqual(["x", "y"]);
  });
});
