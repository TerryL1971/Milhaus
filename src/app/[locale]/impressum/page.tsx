// src/app/[locale]/impressum/page.tsx
// Legal notice required under § 5 DDG (Digitale-Dienste-Gesetz) for a
// commercial website operated from Germany — see launch-blockers-pending
// memory for the full back-and-forth this was built from. Charlie
// confirmed (2026-10-22): the Schönaich address is the operative one
// (not the Magstadt address also mentioned in the Terms), he's not
// entered in the Handelsregister (so no register court/number here),
// and he supplied the exact German non-participation sentence for the
// Verbraucherstreitbeilegung section below — not translated/paraphrased,
// same reasoning as /terms for why operative legal wording stays as
// given rather than being generated.
//
// Legal check (2026-11-08):
// - The EU Online Dispute Resolution section and its link are gone: the
//   EU shut that platform down on 20 July 2025 (Regulation (EU)
//   2024/3228 repealed the ODR Regulation), and a dead link can be
//   treated as misleading. The separate German § 36 VSBG statement below
//   still applies and stays.
// - Postcode corrected to 71101 (Schönaich's); 71106 is Magstadt's.
// - Added the Digital Services Act point of contact (Art. 11 and 12 DSA),
//   which every hosting service must publish whatever its size.
//
// Section headers and the two disclosure paragraphs are kept in German
// (the conventional language for this document on a German-operated
// site, and the form the exact legal wording was supplied in); the
// factual contact block (name/address/phone/email/VAT ID) is plain
// English labels, same split /terms uses for its own contact block.

import { getLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    locale: await getLocale(),
    path: "/impressum",
    title: "Impressum",
    description: "Legal notice (Impressum) for Milhaus, per § 5 DDG.",
  });
}

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";

export default function ImpressumPage() {
  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Impressum</h1>
        <p className="mb-8 text-sm text-ink-soft">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</p>

        <section className="mb-9">
          <p className="mb-1 text-[0.95rem] font-semibold text-charcoal">Charles Edward Adam</p>
          <p className="mb-3 text-[0.95rem] text-charcoal">trading as Milhaus, Adam&rsquo;s Sales Co., Military Sales</p>

          <p className={labelClass}>Address</p>
          <p className="mb-3 text-[0.95rem] text-charcoal">
            Robert Bosch Str. 6
            <br />
            71101 Schönaich
            <br />
            Germany
          </p>

          <p className={labelClass}>Contact</p>
          <p className="mb-3 text-[0.95rem] text-charcoal">
            Phone: 0173 2966536
            <br />
            Email: info@milhaus.de
          </p>

          <p className={labelClass}>VAT ID (Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG)</p>
          <p className="text-[0.95rem] text-charcoal">DE454001542</p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Verantwortlich für den Inhalt</h2>
          <p className="text-[0.95rem] text-charcoal">
            Charles Edward Adam (Anschrift wie oben), verantwortlich gemäß § 18 Abs. 2 MStV.
          </p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">
            Kontaktstelle nach dem Digital Services Act
          </h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Zentrale Kontaktstelle für Behörden, die Europäische Kommission und Nutzer (Art. 11 und 12 DSA):
            E-Mail info@milhaus.de. Kommunikation auf Deutsch oder Englisch.
          </p>
          <p className="text-sm italic text-ink-soft">
            Single point of contact for authorities, the European Commission and users under Articles 11 and 12 of
            the Digital Services Act: info@milhaus.de. We communicate in German or English.
          </p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Verbraucherstreitbeilegung</h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
          <p className="text-sm italic text-ink-soft">
            We are not willing and not obligated to participate in dispute resolution proceedings before a consumer
            arbitration board.
          </p>
        </section>
      </div>
    </main>
  );
}
