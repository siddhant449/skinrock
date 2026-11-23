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
        {/* runs before the first paint: marks JS and a repeat visit for the intro's CSS, and makes a
            refresh open the page at the top instead of where the reader was (a link to a
            #chapter still opens at that chapter) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('sr-loaded')==='1')d.classList.add('sr-seen')}catch(e){}try{if('scrollRestoration' in history)history.scrollRestoration='manual';if(!location.hash)window.scrollTo(0,0)}catch(e){}",
          }}
        />
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
