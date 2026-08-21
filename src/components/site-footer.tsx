// src/components/site-footer.tsx
// Ported from the "FOOTER" section of
// /design-reference/milhaus-landing-mockup.html.

import Link from "next/link";

const columns = [
  {
    heading: "For renters",
    links: [
      { label: "Browse listings", href: "/#listings" },
      { label: "How verification works", href: "#" },
    ],
  },
  {
    heading: "For listers",
    links: [
      { label: "Post a home", href: "/post" },
      { label: "For landlords", href: "#" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Contact", href: "#" },
      { label: "Impressum", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1180px] px-8 pb-7 pt-11">
        <div className="mb-4.5 flex flex-wrap justify-between gap-6 border-b border-paper/15 pb-7">
          <div className="font-display text-2xl font-bold tracking-tight text-paper">
            milhaus<span className="text-brass">.</span>
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

        <p className="text-[0.78rem] opacity-55">
          A resource for the American community living in Germany. Not
          affiliated with the U.S. Department of Defense.
        </p>
      </div>
    </footer>
  );
}
