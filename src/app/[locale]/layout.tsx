// src/app/[locale]/layout.tsx
// Root layout, now locale-scoped: [locale] sits directly under app/, so
// this is the actual <html>/<body> root (no separate app/layout.tsx above
// it) — see src/i18n/routing.ts for why "en" has no URL prefix.

import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Zilla_Slab } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";
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

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — milhaus` },
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      siteName: "milhaus",
      type: "website",
      locale: locale === "de" ? "de_DE" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
    // Points search engines at the other language version of this same
    // page — without this, Google treats /de/... as a duplicate of the
    // English page instead of its translation.
    alternates: {
      languages: { en: SITE_URL, de: `${SITE_URL}/de` },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for this locale — see next-intl docs on
  // setRequestLocale. Must run before anything below reads translations.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${zillaSlab.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body">
        <NextIntlClientProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </NextIntlClientProvider>
        {/* No-op until deployed to Vercel — that's what activates it. */}
        <Analytics />
      </body>
    </html>
  );
}
