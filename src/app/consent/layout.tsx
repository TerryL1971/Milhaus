// src/app/consent/layout.tsx
// Root layout for /consent/[token] — same reasoning as
// src/app/cart/layout.tsx: Next.js nests layouts by directory, so the
// only way for this to have its own <html>/<body> root (not share one
// with /de/...) is for neither to have a common ancestor layout.
// Whoever lands here (clicking the confirmation link in their email)
// has no Milhaus account at all, let alone a session — this is
// deliberately a standalone, chrome-free page, not folded into the
// authenticated app shell.

import type { Metadata } from "next";
import { IBM_Plex_Mono, Work_Sans, Libre_Baskerville } from "next/font/google";
import Image from "next/image";
import "../globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-zilla-slab",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Confirm your business listing",
  robots: { index: false, follow: false },
};

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${libreBaskerville.variable} ${workSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-body">
        <div className="border-b border-canvas-deep bg-ink">
          <div className="mx-auto max-w-[1600px] px-8 py-[18px]">
            <a href="/" className="inline-flex items-center">
              {/* h-7 below md — see site-header.tsx for why this logo
                  needs a smaller mobile size (it overflows a phone's
                  width at h-10). */}
              <Image
                src="/brand/milhaus-logo-cream-red-horizontal.png"
                alt="Milhaus"
                width={1994}
                height={236}
                className="h-7 w-auto md:h-10"
              />
            </a>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
