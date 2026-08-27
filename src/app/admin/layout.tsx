// src/app/admin/layout.tsx
// Admin's own root layout — deliberately outside src/app/[locale], so
// there's no src/app/layout.tsx above it (Next.js nests layouts by
// directory unconditionally; the only way for /admin/* and /de/... to have
// independent, non-nested <html>/<body> roots is for neither to share an
// ancestor layout). English-only for now — Charlie's internal tool, not in
// scope for translation yet — but SiteHeader/SiteFooter both call
// useTranslations(), so this still needs a NextIntlClientProvider; it's
// just always fed the English messages rather than a per-request locale.

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Zilla_Slab } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import enMessages from "../../../messages/en.json";
import "../globals.css";

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

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — milhaus" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${zillaSlab.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body">
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
