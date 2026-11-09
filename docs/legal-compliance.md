<!-- docs/legal-compliance.md -->
# Legal compliance notes (Germany)

What German and EU law asks of Milhaus, what the site does about each
point, and what the owner still has to decide or sign. Written on
2026-11-09 from a review of current law. **This is not legal advice** —
have a German IT lawyer or a legal-text service with formal-warning
cover (*Abmahnschutz*, e.g. IT-Recht Kanzlei or Händlerbund) confirm it
before launch, and again whenever the law changes.

## Built into the site

| Requirement | Law | Where |
|---|---|---|
| Legal notice (Impressum) | § 5 DDG, § 18 MStV | `src/app/[locale]/impressum/page.tsx` |
| No EU dispute-platform link (platform closed 20 July 2025); German consumer-arbitration statement kept | Reg. (EU) 2024/3228, § 36 VSBG | Impressum |
| Digital Services Act contact point | DSA Art. 11, 12 | Impressum |
| Way to report illegal content | DSA Art. 16 | "Report this listing" on every listing, Admin → Reports |
| Reasons emailed to the owner when a listing is rejected or taken down | DSA Art. 17 | `src/lib/moderation.ts`, `src/components/takedown-form.tsx` |
| Paid ads labelled "Ad" / "Anzeige" | § 5a UWG, DSA Art. 26 | `src/components/ad-label.tsx` |
| Withdrawal policy and model form | § 312g, § 355 BGB, Art. 246a EGBGB | `/withdrawal`, text in `src/lib/withdrawal-notice.ts` |
| Online "Withdraw from contract" / "Vertrag widerrufen" button with instant receipt | § 356a BGB (from 19 June 2026) | `/withdraw`, footer, Admin → Withdrawals |
| Express request to start the service now, so a withdrawal later is paid pro rata and the right ends once the service is fully provided | § 356(4), § 357a(2) BGB | Required checkbox in `/cart`, stored on `listing_payments` |
| "Order and pay" button with the terms and withdrawal policy beside it | § 312j(3) BGB | `/cart` |
| Order confirmation with the withdrawal notice, sent by email | § 312f(2) BGB | `src/lib/order-confirmation-email.ts` |
| Energy-certificate details in home ads (type, value, class, energy source, year built) | § 87 GEG | `src/components/energy-certificate-fields.tsx`, listing page |
| Private individual vs business shown on the seller card, with the consumer-rights warning for private sellers | § 312l BGB | `src/components/seller-card.tsx` |
| Cookie consent before analytics; privacy policy; data export | GDPR, TDDDG § 25 | Cookie banner, `/privacy`, My account |
| Businesses listed only with their own consent | § 7 UWG, GDPR | `src/lib/businesses-queries.ts` |

## Exemptions the owner relies on — and why

Keep this section up to date. If the business grows past a threshold,
the exemption ends and the obligations below start to apply.

- **Accessibility law (Barrierefreiheitsstärkungsgesetz, BFSG).** Online
  services to consumers must be accessible from 28 June 2025, but a
  *micro-enterprise* providing services is exempt (§ 3(3) BFSG): fewer
  than 10 employees **and** annual turnover or balance sheet of no more
  than €2 million. Milhaus is run by one person, so it qualifies. Record
  the headcount and turnover once a year. The site still follows good
  accessibility practice (semantic HTML, labels, contrast), which keeps
  the risk low if it ever stops qualifying.
- **Heavier Digital Services Act duties for online platforms** (internal
  complaint system, out-of-court dispute settlement, trader
  traceability, transparency reports — Art. 20–28). Small enterprises
  are exempt (Art. 19): fewer than 50 employees and turnover or balance
  sheet of no more than €10 million. The duties that apply to every
  hosting service (Art. 11–18) are built in, as listed above.
- **New-car fuel and CO₂ information (Pkw-EnVKV).** Only applies to
  someone advertising a **new** car in the course of business. Used
  cars, and private sellers, are exempt. The car form reminds dealers to
  add the figures to the description; nothing is enforced.

## Still for the owner to decide or do

- **VAT on prices.** With a VAT ID, prices shown to consumers must
  include VAT and say so (PAngV), unless the owner uses the small-business
  exemption (§ 19 UStG). Decide with the accountant, then the site's
  price labels need "incl. 19% VAT" or "no VAT charged (§ 19 UStG)".
- **Invoices** must meet § 14 UStG (full name and address, VAT ID,
  sequential number, VAT shown separately). Set this up in Stripe's
  invoice settings.
- **Data processing agreements (AVV / DPA)** with every processor:
  Supabase, Vercel, Stripe, Resend, Sentry and IONOS. Most are accepted
  in each provider's dashboard.
- **Privacy policy additions (2026-11-09):** the Contact form (name,
  email and message, stored in Admin → Messages until deleted), the
  Milhaus Service pop-up's form (email address and the help wanted,
  stored the same way), and the pop-up's two session-storage entries (when the visit started, and
  whether the pop-up has shown, so it appears at most once per visit;
  both are cleared when the browser session ends).
  Whether that storage needs cookie consent under § 25 TDDDG is a
  question for the lawyer or legal-text service; if it does, the pop-up
  can be limited to visitors who accepted the cookie banner.
- **Privacy policy additions:** IONOS (email), advertiser and invoice
  data, the 8–10-year tax retention of invoices, the supervisory
  authority (Landesbeauftragter für Datenschutz und Informationsfreiheit
  Baden-Württemberg), and the EU–US Data Privacy Framework for U.S.
  providers.
- **Terms additions:** how paid "featured" placement affects ranking
  (P2B Regulation Art. 5), and removing the subscription clauses that
  describe products the site doesn't sell.
- **Withdrawals:** refund within 14 days of each request (Admin →
  Withdrawals shows the deadline). Keeping a pro-rata share for a
  listing that already ran is allowed, but confirm the method with the
  accountant or lawyer first.
- **Wording on the site** that claims listings are "reviewed" before
  going live — they aren't (payment is the gate), and a false claim can
  itself draw a formal warning (§ 5 UWG).
- **Protection:** a legal-text service with formal-warning cover,
  business liability insurance, and a limited company (UG or GmbH) once
  revenue grows — a sole trader is personally liable.
