// src/app/cart/layout.tsx
// Root layout for /cart — same reasoning as src/app/auth/layout.tsx and
// src/app/admin/layout.tsx: Next.js nests layouts by directory, so the
// only way for /cart to have its own <html>/<body> root (not share one
// with /de/...) is for neither to have a common ancestor layout. This
// is the gap the old /checkout/[listingId] route had too — it never
// had a layout of its own either, which went unnoticed because it was
// only verified against the Stripe/PayPal APIs directly, never by
// actually loading the page in a browser.

import type { Metadata } from "next";
import { IBM_Plex_Mono, Work_Sans, Libre_Baskerville } from "next/font/google";
import "../globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"], // only weights Google Fonts actually serves for this family
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
  title: "Milhaus",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${libreBaskerville.variable} ${workSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-body">
        {/* No SiteHeader here — it relies on next-intl's Link/translations,
            which this layout doesn't provide (see the file-top comment on
            why /cart sits outside [locale] at all). A plain link back to
            "/" is enough: unlike /auth's brief interstitials, /cart is a
            page people land on mid-browse and need a way out of. */}
        <div className="border-b border-canvas-deep bg-ink">
          <div className="mx-auto max-w-[1400px] px-8 py-[18px]">
            <a href="/" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, not worth next/image's config here */}
              <img src="/brand/milhaus-logo-cream-red-horizontal.png" alt="Milhaus" className="h-10 w-auto" />
            </a>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
