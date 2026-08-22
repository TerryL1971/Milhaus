// src/app/layout.tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Zilla_Slab } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-zilla-slab",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

const description =
  "A rental-listing marketplace for Americans relocating to Germany, combining on-base housing office listings with self-listed homes from families rotating out.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "milhaus — Find home before you land",
    template: "%s — milhaus",
  },
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title: "milhaus — Find home before you land",
    description,
    siteName: "milhaus",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "milhaus — Find home before you land",
    description,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${zillaSlab.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
        {/* No-op until deployed to Vercel — that's what activates it. */}
        <Analytics />
      </body>
    </html>
  );
}
