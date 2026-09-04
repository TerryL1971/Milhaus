// src/components/site-footer.tsx
// Ported from the "FOOTER" section of
// /design-reference/milhaus-landing-mockup.html.

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoIcon } from "@/components/logo-icon";

export function SiteFooter() {
  const t = useTranslations("SiteFooter");

  const columns = [
    {
      heading: t("forRentersHeading"),
      links: [
        { label: t("browseListings"), href: "/#listings" },
        { label: t("howVerificationWorks"), href: "/how-verification-works" },
      ],
    },
    {
      heading: t("forListersHeading"),
      links: [
        { label: t("postAHome"), href: "/post" },
        { label: t("forLandlords"), href: "/for-landlords" },
      ],
    },
    {
      heading: t("aboutHeading"),
      links: [
        { label: t("contact"), href: "#" },
        { label: t("impressum"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1180px] px-8 pb-7 pt-11">
        <div className="mb-4.5 flex flex-wrap justify-between gap-6 border-b border-paper/15 pb-7">
          <div className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-paper">
            <LogoIcon className="h-7 w-auto text-paper" />
            Milhaus<span className="text-brass">.</span>
          </div>

          <div className="flex flex-wrap gap-12">
            {columns.map((col) => (
              <div key={col.heading}>
                <h4 className="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-brass">
                  {col.heading}
                </h4>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="mb-2 block text-[0.86rem] opacity-80 transition-opacity last:mb-0 hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[0.78rem] opacity-55">{t("tagline")}</p>
      </div>
    </footer>
  );
}
