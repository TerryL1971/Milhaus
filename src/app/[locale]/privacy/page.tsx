// src/app/[locale]/privacy/page.tsx
// Privacy Policy — drafted by Claude at Terry's explicit request
// (2026-10-26), built from two real sources rather than invented: the
// GDPR's own required disclosures (Arts. 12-22) and the factual/
// operative content already in /terms (section 19, "Privacy and data
// protection") and /impressum (controller identity, address, VAT ID —
// all Charlie-supplied, real facts, same as those two pages). This is
// NOT the same situation as /terms or /impressum, where the actual
// legal wording came verbatim from Charlie or was legally mandatory
// boilerplate — this document's structure and most of its sentences are
// Claude's own drafting, not reviewed by a lawyer. Flag for Terry/
// Charlie before relying on this as final:
//   - The Supabase hosting region is AWS eu-west-2, which is LONDON
//     (UK), not an EU member state post-Brexit — worded below as "the
//     United Kingdom, under the UK's GDPR adequacy decision," not as
//     "the EU," since that would be factually wrong. Confirm this
//     region is still correct and that this framing is acceptable (vs.
//     e.g. migrating the project to an actual EU region).
//   - "How to exercise your rights" below describes what's *actually
//     built* today — self-service account deletion AND a self-service
//     data export both exist on /my-listings (the export shipped
//     2026-10-26, same day as this policy); anything beyond what those
//     two cover is still a manual email request to info@milhaus.de.
//   - English only, on purpose, same reasoning as /terms: this is
//     operative legal text, not UI copy, and a mistranslation risk here
//     is worse than the inconvenience of one language. A German version
//     needs Charlie's sign-off or a professional translation, not a
//     generated guess.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Milhaus collects, uses, and protects personal data.",
};

type Section = {
  num: number;
  heading: string;
  clauses: (string | { lead: string; items: string[] })[];
};

const SECTIONS: Section[] = [
  {
    num: 1,
    heading: "Who this policy covers, and who is responsible",
    clauses: [
      "1.1. This Privacy Policy explains how Milhaus collects, uses, shares, and protects personal data when you visit the website, create an account, submit a listing or business profile, or otherwise use Milhaus's services.",
      "1.2. The data controller responsible for this processing is Charles Edward Adam, trading as Milhaus, Adam's Sales Co., Military Sales, Robert Bosch Str. 6, 71106 Schönaich, Germany. Contact: info@milhaus.de, phone 0173 2966536. See the Impressum for the full legal notice.",
      "1.3. This policy should be read alongside the Milhaus Terms and Conditions of Use, which it is referenced from (section 19).",
    ],
  },
  {
    num: 2,
    heading: "What personal data we collect",
    clauses: [
      {
        lead: "2.1. Account and profile data: when you create an account, we collect your display name, contact email, and (optionally) contact phone number and a profile photo/cover image.",
        items: [],
      },
      "2.2. Listing and business content: any content you submit in a rental, car, item, or business listing — including photos, descriptions, prices, and contact details you choose to show publicly.",
      "2.3. Business consent verification data: if a business profile is submitted (by its owner or someone acting on their behalf), we keep a dated record of the consent process — the business's own email address, the IP address used to confirm or decline, the confirmation method (email link, a signed paper form, or a recorded verbal yes), and any note Charlie records. This exists specifically to prove, if ever disputed, that the actual business owner agreed to being listed — see section 8 for how long this is kept.",
      "2.4. Payment data: if you pay for a listing or subscription, payment is handled directly by Stripe, our payment processor — Milhaus does not receive or store your full card details.",
      "2.5. Communications: if you report a listing, contact us, or request your rights under this policy, we keep the content of that communication and the email address you sent it from.",
      "2.6. Technical and usage data: your IP address is processed transiently by our hosting infrastructure (standard for any website) and, separately, by error-monitoring software when something breaks (see section 5). Aggregated, privacy-focused analytics (page views, not individual tracking) only run if you accept the cookie banner shown on your first visit.",
    ],
  },
  {
    num: 3,
    heading: "Why we process your data, and our legal basis",
    clauses: [
      {
        lead: "3.1. We rely on the following legal bases under Article 6 GDPR, depending on the processing:",
        items: [
          "Performance of a contract (Art. 6(1)(b)): creating your account, publishing your listings, processing a paid order.",
          "Consent (Art. 6(1)(a)): the business consent-verification process itself, and optional analytics cookies — both can be withdrawn at any time, with no effect on anything already done while consent was in place.",
          "Legitimate interests (Art. 6(1)(f)): keeping the site secure and working (error monitoring, fraud prevention, enforcing our Terms), communicating about reported listings.",
          "Legal obligation (Art. 6(1)(c)): keeping records required by German commercial or tax law, and responding to lawful requests from authorities.",
        ],
      },
    ],
  },
  {
    num: 4,
    heading: "Cookies and analytics",
    clauses: [
      "4.1. Milhaus shows a cookie consent banner on your first visit. Until you accept it, no analytics cookies are set and no analytics tracking runs.",
      "4.2. If you accept, we use Vercel Analytics, a privacy-focused analytics service that measures aggregate page views and traffic patterns without building an individual profile of you or using cross-site tracking identifiers.",
      "4.3. Declining the banner does not affect your ability to use Milhaus — accounts, listings, browsing, and payments all work the same either way.",
      "4.4. Essential, strictly-necessary cookies (for example, keeping you signed in) are used regardless of this choice, since the site cannot function as a marketplace without them.",
    ],
  },
  {
    num: 5,
    heading: "Error monitoring",
    clauses: [
      "5.1. Milhaus uses Sentry to automatically detect and diagnose software errors, so problems can be found and fixed quickly.",
      "5.2. This runs independently of the cookie banner above — we treat keeping the site working reliably as a legitimate interest, not a marketing or tracking activity.",
      "5.3. Error reports are configured to minimize personal data: request cookies and authorization headers are stripped before a report is sent, and known-sensitive breadcrumbs (such as data typed into forms) are removed. Sentry does not receive your IP address by default.",
    ],
  },
  {
    num: 6,
    heading: "Who we share data with",
    clauses: [
      {
        lead: "6.1. We use the following processors to run Milhaus. Each only receives the data it needs to provide its specific service, under a data processing agreement, and none of them may use your data for their own independent purposes:",
        items: [
          "Supabase — hosts our database, authentication, and file storage (listing photos, business logos, consent documents).",
          "Stripe — processes payments for paid listings and subscriptions.",
          "Resend — sends transactional emails (business consent confirmations, account notifications). Milhaus does not operate a marketing or newsletter mailing list.",
          "Vercel — hosts the website itself, and (only once you accept the cookie banner) runs the privacy-focused analytics described in section 4.",
          "Sentry — receives error reports as described in section 5.",
        ],
      },
      "6.2. We do not sell personal data, and we do not share it with advertisers for their own marketing purposes.",
      "6.3. We may disclose data where required by law, to establish or defend a legal claim, or to protect the rights, safety, or property of Milhaus or others.",
    ],
  },
  {
    num: 7,
    heading: "International data transfers",
    clauses: [
      "7.1. Supabase hosts Milhaus's database and storage in the United Kingdom. The United Kingdom is not an EU member state, but the European Commission has recognised it as providing an adequate level of data protection (a UK adequacy decision), so data can be transferred there without additional safeguards.",
      "7.2. Stripe, Resend, Vercel, and Sentry may process data in other countries, including the United States, under their own applicable data transfer safeguards (such as Standard Contractual Clauses). Each provider's own privacy policy has further detail on this.",
    ],
  },
  {
    num: 8,
    heading: "How long we keep data",
    clauses: [
      "8.1. Account and profile data is kept for as long as your account exists, and deleted when you delete your account (see section 9).",
      "8.2. Listings are kept while active, and for a limited period after being marked rented/sold or archived, to support your own records and any dispute handling — after which they're removed in the ordinary course of account or content cleanup.",
      "8.3. Business consent verification records (section 2.3) are kept even after the related business listing or account is deleted, specifically to preserve evidence that consent was properly obtained — this is a deliberate exception to immediate deletion, made to protect both the business owner and Milhaus in the event of a later dispute about whether a listing was authorized.",
      "8.4. Payment records are kept by Stripe for as long as required by applicable financial and tax law.",
    ],
  },
  {
    num: 9,
    heading: "Your rights",
    clauses: [
      {
        lead: "9.1. Under the GDPR, you have the right to:",
        items: [
          "Access the personal data we hold about you.",
          "Correct inaccurate or incomplete data.",
          "Request erasure of your data (\"the right to be forgotten\").",
          "Restrict or object to certain processing.",
          "Receive your data in a portable format.",
          "Withdraw consent at any time, where processing is based on consent.",
          "Lodge a complaint with a data protection supervisory authority — in Germany, the authority for the state where Milhaus is based.",
        ],
      },
      "9.2. You can download a copy of everything Milhaus holds about you at any time from your profile page (My Listings → Download your data) — your profile, listings, favorites, business profiles, reports you've filed, and cart items, as a single file.",
      "9.3. You can delete your own account at any time from the same page (My Listings → Danger zone) — this permanently removes your profile, listings, favorites, and business profiles, with the one exception described in section 8.3.",
      "9.4. For anything else — correcting something you can't edit yourself, or any other request under section 9.1 — email info@milhaus.de. We will respond within one month, as required by the GDPR.",
    ],
  },
  {
    num: 10,
    heading: "Children's privacy",
    clauses: [
      "10.1. Milhaus is not directed at children, and we do not knowingly collect personal data from anyone under 16. If you believe a child has provided us with personal data, contact info@milhaus.de and we will remove it.",
    ],
  },
  {
    num: 11,
    heading: "Changes to this policy",
    clauses: [
      "11.1. We may update this policy as our services, processors, or legal obligations change. A revised version will be published here with an updated effective date.",
    ],
  },
  {
    num: 12,
    heading: "Contact",
    clauses: [
      "12.1. Questions about this policy, or requests relating to your data, can be sent to info@milhaus.de.",
    ],
  },
];

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";

export default function PrivacyPage() {
  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Privacy Policy</h1>
        <p className="mb-8 text-sm text-ink-soft">
          Effective date: 1 November 2026 · Website: https://www.milhaus.de
        </p>

        {SECTIONS.map((section) => (
          <section key={section.num} className="mb-9">
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">
              {section.num}. {section.heading}
            </h2>
            <div className="flex flex-col gap-3">
              {section.clauses.map((clause, index) =>
                typeof clause === "string" ? (
                  <p key={index} className="text-[0.95rem] leading-relaxed text-charcoal">
                    {clause}
                  </p>
                ) : (
                  <div key={index}>
                    <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">{clause.lead}</p>
                    {clause.items.length > 0 && (
                      <ul className="list-disc space-y-1 pl-6 text-[0.95rem] leading-relaxed text-charcoal">
                        {clause.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ),
              )}
            </div>
          </section>
        ))}

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">Contact and legal information</h2>
          <p className="mb-1 text-[0.95rem] font-semibold text-charcoal">Milhaus — operated by Charles Edward Adam</p>
          <p className={labelClass}>Address</p>
          <p className="mb-3 text-[0.95rem] text-charcoal">
            Robert Bosch Str. 6
            <br />
            71106 Schönaich
            <br />
            Germany
          </p>
          <p className="text-[0.95rem] text-charcoal">
            Email: info@milhaus.de
            <br />
            Phone: 0173 2966536
            <br />
            Website: https://www.milhaus.de
          </p>
        </section>
      </div>
    </main>
  );
}
