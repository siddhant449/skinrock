import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { buildMetadata, jsonLdScript, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { Providers } from "@/components/providers/Providers";
import { Grain } from "@/components/ui/Grain";
import { GLStage } from "@/components/gl/GLStage";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: "#0D1520",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <Providers>
          {children}
          <GLStage />
        </Providers>
        <Grain />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd()) }}
        />
      </body>
    </html>
  );
}
