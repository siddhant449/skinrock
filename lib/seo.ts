import type { Metadata } from "next";
import { site } from "@/content/site";

export function buildMetadata(): Metadata {
  const og = site.images.og;
  return {
    metadataBase: new URL(site.url),
    title: { default: site.seo.title, template: `%s | ${site.name}` },
    description: site.seo.description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: site.url,
      siteName: site.name,
      title: site.seo.title,
      description: site.seo.description,
      locale: "en_CH",
      images: [{ url: og.src, width: og.width, height: og.height, alt: og.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: site.seo.title,
      description: site.seo.description,
      images: [og.src],
    },
    robots: { index: true, follow: true },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  const c = site.contact;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: `${site.url}/icon.png`,
    description: site.seo.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.street,
      postalCode: c.postal,
      addressLocality: c.city,
      addressCountry: c.country,
    },
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
  };
}

/** Serialises JSON-LD safely for a <script> tag (escapes `<`). */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
