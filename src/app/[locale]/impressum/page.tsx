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
// - 2026-11-09: added the customary (not legally required) blocks other
//   German Impressums carry — independence, liability for content and
//   links, copyright and image credits, links to privacy/terms/
//   withdrawal, and a "Stand" date. Update that date when this page changes.
//
// Section headers and the two disclosure paragraphs are kept in German
// (the conventional language for this document on a German-operated
// site, and the form the exact legal wording was supplied in); the
// factual contact block (name/address/phone/email/VAT ID) is plain
// English labels, same split /terms uses for its own contact block.

import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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

        {/* Everything below was added 2026-11-09, after Terry compared this
            page with other German Impressums (usedcarguys.net,
            european-living.live). None of it is a § 5 DDG requirement —
            it's the customary disclaimer block, written here with current
            law (the DSA's hosting rule rather than the old TMG § 10 that
            older templates still cite). */}
        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Unabhängigkeit</h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Milhaus ist ein unabhängiges, privat betriebenes Angebot. Es steht in keiner Verbindung zum
            US-Verteidigungsministerium, zu den US-Streitkräften oder zu einer Dienststelle eines Militärstandorts
            und wird von diesen weder betrieben noch geprüft oder empfohlen.
          </p>
          <p className="text-sm italic text-ink-soft">
            Milhaus is an independent, privately run service. It is not affiliated with, operated, reviewed or
            endorsed by the U.S. Department of Defense, the U.S. armed forces or any office of a military
            installation.
          </p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Haftung für Inhalte</h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Für eigene Inhalte dieser Website sind wir nach den allgemeinen Gesetzen verantwortlich. Inserate,
            Fotos und Angaben zu Unternehmen werden von den jeweiligen Nutzern eingestellt; für diese fremden
            Inhalte sind die Nutzer verantwortlich. Als Hostingdienst haften wir dafür nach Art. 6 der Verordnung
            (EU) 2022/2065 (Digital Services Act) erst, wenn wir von einer konkreten Rechtsverletzung Kenntnis
            erlangen; dann entfernen wir den betreffenden Inhalt unverzüglich. Rechtswidrige Inhalte können Sie
            uns über die Schaltfläche „Anzeige melden“ am Inserat oder per E-Mail an info@milhaus.de mitteilen.
          </p>
          <p className="text-sm italic text-ink-soft">
            We are responsible for our own content under general law. Listings, photos and business details are
            posted by users, who are responsible for them. As a hosting service we are only liable for them under
            Article 6 of the Digital Services Act once we become aware of a specific infringement, and we then
            remove it without delay. Report illegal content with the &ldquo;Report this listing&rdquo; button or
            at info@milhaus.de.
          </p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Haftung für Links</h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Diese Website enthält Links zu externen Websites Dritter (z. B. Websites von Inserenten und
            Veranstaltern), auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist stets der jeweilige
            Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar; werden uns
            Rechtsverletzungen bekannt, entfernen wir den Link unverzüglich.
          </p>
          <p className="text-sm italic text-ink-soft">
            This site links to third-party websites (such as advertisers&rsquo; and event organisers&rsquo;
            sites) whose content we do not control; their operators are responsible for it. We remove a link
            without delay once we learn that it leads to unlawful content.
          </p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Urheberrecht und Bildnachweise</h2>
          <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">
            Die von uns erstellten Inhalte, das Design und das Logo von Milhaus unterliegen dem deutschen
            Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung außerhalb der Grenzen des Urheberrechts
            bedürfen unserer schriftlichen Zustimmung. Fotos und Texte in Inseraten, Unternehmensprofilen und
            Werbeanzeigen stammen von den jeweiligen Nutzern und Werbetreibenden, die die Rechte daran besitzen
            müssen. Sollten Sie eine Urheberrechtsverletzung bemerken, bitten wir um einen Hinweis an
            info@milhaus.de.
          </p>
          <p className="text-sm italic text-ink-soft">
            Our own content, the design and the Milhaus logo are protected by German copyright law. Photos and
            text in listings, business profiles and ads come from the users and advertisers who post them, and
            who must hold the rights to them. Please tell us at info@milhaus.de if you notice an infringement.
          </p>
        </section>

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Datenschutz</h2>
          <p className="text-[0.95rem] leading-relaxed text-charcoal">
            Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
            <Link href="/privacy" className="font-semibold text-olive-deep hover:underline">
              Datenschutzerklärung
            </Link>
            . Allgemeine Geschäftsbedingungen:{" "}
            <Link href="/terms" className="font-semibold text-olive-deep hover:underline">
              Nutzungsbedingungen
            </Link>
            ; Widerrufsrecht:{" "}
            <Link href="/withdrawal" className="font-semibold text-olive-deep hover:underline">
              Widerrufsbelehrung
            </Link>
            .
          </p>
        </section>

        <p className="text-sm text-ink-soft">Stand: November 2026</p>
      </div>
    </main>
  );
}
