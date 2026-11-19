import { describe, it, expect } from "vitest";
import { buildMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

describe("seo", () => {
  it("organization json-ld has Chur postal address", () => {
    const org = organizationJsonLd() as { "@type": string; address: Record<string, string> };
    expect(org["@type"]).toBe("Organization");
    expect(org.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: "Hartbertstrasse 9",
      postalCode: "7000",
      addressLocality: "Chur",
      addressCountry: "CH",
    });
  });

  it("website json-ld points at the canonical url", () => {
    expect(websiteJsonLd()).toMatchObject({ "@type": "WebSite", url: "https://skinrockofficial.com" });
  });

  it("metadata has a branded title, description and open graph image", () => {
    const m = buildMetadata();
    expect(String((m.title as { default: string }).default)).toContain("Skinrock");
    expect((m.description ?? "").length).toBeGreaterThan(80);
    expect(m.openGraph?.images).toBeTruthy();
    expect(m.alternates?.canonical).toBe("/");
  });
});
