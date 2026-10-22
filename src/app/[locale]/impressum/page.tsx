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
// given rather than being generated. The EU Online Dispute Resolution
// section is standard, non-negotiable boilerplate required of any
// EU-based trader selling to consumers online (Art. 14 ODR Regulation)
// — independent of the separate German VSBG question Charlie answered,
// so it's included regardless of his "I don't employ anyone" reasoning
// for that one (which is about the right outcome — declining to
// participate, which the law does allow a business of any size to do —
// even if headcount isn't actually the legal basis for it).
//
// Section headers and the two disclosure paragraphs are kept in German
// (the conventional language for this document on a German-operated
// site, and the form the exact legal wording was supplied in); the
// factual contact block (name/address/phone/email/VAT ID) is plain
// English labels, same split /terms uses for its own contact block.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Legal notice (Impressum) for Milhaus, per § 5 DDG.",
};

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
            71106 Schönaich
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
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">EU-Streitschlichtung</h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-olive-deep hover:underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            .
          </p>
          <p className="text-sm italic text-ink-soft">
            The European Commission provides a platform for online dispute resolution (ODR), available at the link
            above.
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
