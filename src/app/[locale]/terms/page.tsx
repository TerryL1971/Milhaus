// src/app/[locale]/terms/page.tsx
// Terms and Conditions of Use — the exact legal text Charlie supplied
// (2026-10-22), not paraphrased or restructured. One fix made to his
// text: every section heading after the first ("1. About Milhaus")
// pasted in as "1." again instead of counting up (an artifact of
// whatever he drafted this in — the numbered *clauses* inside each
// section still count up correctly, e.g. "10.1"..."10.17" under the
// section that read "1. Billing periods and cancellation"), so the
// section numbers here are renumbered 2–23 to match what the clause
// numbers already imply. No wording was changed.
//
// English only, on purpose, regardless of locale — this is operative
// legal text, not UI copy; translating it (even via next-intl) risks a
// mistranslation in a document that's meant to be legally binding.
// Flag for Terry/Charlie: a German version needs either an authorized
// translation or Charlie's own sign-off on one, not a generated guess.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions of Use",
  description: "Milhaus's Terms and Conditions of Use.",
};

type Section = {
  num: number;
  heading: string;
  clauses: (string | { lead: string; items: string[] })[];
};

const SECTIONS: Section[] = [
  {
    num: 1,
    heading: "About Milhaus",
    clauses: [
      "1.1. Milhaus is an online advertising, classified listings, business directory and promotional platform operated by Charles Edward Adam as part of his wider business activities, which also include Adam's Sales Co. and Military Sales.",
      "1.2. Unless expressly identified otherwise in a separate legally valid agreement, Milhaus is operated by Charles Edward Adam and is not represented as a separate legal entity.",
      "1.3. Milhaus enables private individuals and businesses to advertise goods, vehicles, property, accommodation, services, business profiles, special offers and other permitted listings.",
      "1.4. These Terms govern access to and use of the website, submission of listings, creation of business profiles, and purchase of advertising, promotional and subscription services.",
      "1.5. By using Milhaus, submitting a listing or purchasing a paid service, you agree to the applicable provisions of these Terms.",
      "1.6. If you act on behalf of a business or organisation, you confirm that you have authority to act on its behalf.",
      "1.7. These Terms must be read alongside the Milhaus Privacy Policy, Impressum, advertising and subscription information, and any additional terms supplied before purchase.",
    ],
  },
  {
    num: 2,
    heading: "The role of Milhaus",
    clauses: [
      "2.1. Milhaus provides an advertising and listing service. It does not ordinarily sell, own, rent, supply or provide the goods, property or services advertised by third parties.",
      "2.2. Unless expressly agreed otherwise, Milhaus does not act as the seller, buyer, landlord, tenant, estate agent, vehicle dealer, employer, professional service provider, payment intermediary or transaction agent for users.",
      "2.3. Users contact advertisers directly. Milhaus does not ordinarily negotiate or conclude transactions on behalf of users, collect payments for third-party transactions, hold deposits or arrange delivery.",
      "2.4. Any transaction between an advertiser and an interested user is ordinarily concluded directly between those parties. They are responsible for agreeing and fulfilling their own contractual obligations.",
      "2.5. Milhaus is not a party to such a transaction merely because the parties found one another through the website.",
      "2.6. Milhaus may provide paid advertising, directory visibility, featured placements and promotional services. These services do not make Milhaus responsible for the underlying goods or services advertised.",
      "2.7. Nothing in these Terms excludes any duty or liability that applicable law imposes directly on Milhaus.",
    ],
  },
  {
    num: 3,
    heading: "Advertiser responsibilities",
    clauses: [
      "3.1. The person or business publishing a listing is responsible for its accuracy, legality, completeness and continued validity.",
      {
        lead: "3.2. Advertisers are responsible for the information, representations and offers contained in their listings, including:",
        items: [
          "Prices, fees, taxes, additional charges and payment conditions.",
          "Availability, stock levels and validity of offers.",
          "Product descriptions, specifications, condition and photographs.",
          "Vehicle mileage, ownership, registration, condition and history.",
          "Property descriptions, rental terms, availability and deposits.",
          "Business identity, contact details, addresses and opening hours.",
          "Qualifications, licences, insurance and professional authorisations.",
          "The quality, safety, legality and performance of advertised services.",
          "Any guarantees, warranties or promises they make.",
          "Compliance with applicable laws and advertising requirements.",
        ],
      },
      "3.3. Advertisers must have the necessary authority and rights to advertise the relevant goods, property or services.",
      "3.4. Advertisers must not knowingly publish false, fraudulent, materially misleading or unlawful content.",
      "3.5. Advertisers must promptly correct material inaccuracies and update or remove listings that are no longer valid or available.",
      "3.6. Advertisers must disclose material prices, charges and other information wherever required by law.",
      "3.7. Milhaus does not independently verify every listing, price, contact detail, availability statement or representation.",
      "3.8. Users should independently verify important information before making payments, travelling to view goods or property, sharing sensitive information or entering into a contract.",
    ],
  },
  {
    num: 4,
    heading: "No general guarantee or endorsement",
    clauses: [
      "4.1. The appearance of an advertisement, business profile or promotional offer on Milhaus does not, by itself, constitute an endorsement, recommendation, certification or guarantee by Milhaus.",
      "4.2. Unless a particular verification service expressly states otherwise, Milhaus does not guarantee that an advertiser is genuine, trustworthy, financially sound, properly licensed or authorised to offer the advertised goods or services.",
      "4.3. Milhaus does not guarantee that goods exist, property remains available, a service provider will perform as promised or an advertiser will respond to an enquiry.",
      "4.4. Payment for a listing, business profile or featured placement does not constitute independent verification or approval of the advertiser.",
      "4.5. Milhaus does not guarantee sales, bookings, enquiries, leads, advertising reach, revenue or other commercial results unless an express written agreement provides otherwise.",
      "4.6. Nothing in this section excludes liability for a specific representation or service for which Milhaus is legally responsible.",
    ],
  },
  {
    num: 5,
    heading: "Private and professional advertisers",
    clauses: [
      "5.1. Milhaus may be used by both private individuals and professional advertisers.",
      "5.2. Advertisers must accurately identify whether they are acting privately or in the course of a trade, business or profession wherever required by law.",
      "5.3. Professional advertisers must comply with applicable consumer protection, commercial advertising, pricing, licensing and disclosure requirements.",
      "5.4. Where required by law, professional advertisers must provide their business identity, address, contact details, registration information and other prescribed information.",
      "5.5. Advertisers must not misrepresent a commercial transaction as a private sale or use false identities to evade legal obligations.",
      "5.6. Milhaus may request appropriate information to investigate complaints, assess suspected unlawful activity or comply with legal obligations.",
    ],
  },
  {
    num: 6,
    heading: "Prohibited content and conduct",
    clauses: [
      "6.1. Users must not use Milhaus to publish or facilitate unlawful, fraudulent, deceptive or infringing content.",
      "6.2. Prohibited activities include advertising stolen goods, counterfeit products, unlawful services, scams, phishing, impersonation, materially misleading prices, unauthorised copyrighted material, unlawfully disclosed personal information, malware, spam and other content prohibited by law.",
      "6.3. Users must not interfere with website security, scrape content without authorisation, manipulate listing rankings or enquiries, or misuse another person's contact information.",
      "6.4. Advertisers must have the necessary rights and permissions to publish their content.",
      "6.5. Milhaus may restrict or remove content in accordance with these Terms and applicable law.",
    ],
  },
  {
    num: 7,
    heading: "Vehicles, property and services",
    clauses: [
      "7.1. Vehicle advertisers are responsible for the accuracy of specifications, mileage, ownership, registration, condition, service history and other material information.",
      "7.2. Property advertisers are responsible for the accuracy and legality of property advertisements, including their authority to advertise the property and the terms offered.",
      "7.3. Service providers are responsible for the legality, quality, safety and performance of their services, including required qualifications, licences and insurance.",
      "7.4. Milhaus does not ordinarily inspect vehicles, conduct property surveys, verify ownership or independently assess professional qualifications.",
      "7.5. Users should conduct appropriate inspections and due diligence before entering into an agreement.",
      "7.6. Nothing in this section removes statutory rights or obligations applicable to a particular transaction.",
    ],
  },
  {
    num: 8,
    heading: "Accounts and security",
    clauses: [
      "8.1. Users must provide accurate registration information and keep it reasonably current.",
      "8.2. Users must protect their login credentials and promptly report suspected unauthorised access.",
      "8.3. Users must not impersonate another person or business, create fraudulent accounts or use Milhaus to facilitate unlawful activity.",
      "8.4. Milhaus may restrict access where reasonably necessary to investigate suspected fraud, address security risks, enforce these Terms or comply with legal obligations.",
    ],
  },
  {
    num: 9,
    heading: "Advertising and promotional services",
    clauses: [
      "9.1. Milhaus may offer free listings, paid advertisements, business profiles, monthly and annual subscriptions, featured placements, banner advertisements and other promotional services.",
      "9.2. Before purchase, Milhaus will disclose the applicable price, billing period, service duration, features, renewal arrangements and cancellation conditions.",
      "9.3. Paid services provide the advertising or promotional service described in the relevant package. They do not guarantee a particular commercial outcome.",
      "9.4. Advertisers are responsible for supplying accurate advertising materials and ensuring that they have the necessary rights to use them.",
      "9.5. Milhaus may determine the technical presentation, formatting and placement of advertisements, subject to the purchased package, applicable contractual commitments and legal requirements.",
      "9.6. Paid promotional content will be identified as advertising where required by law.",
      "9.7. Milhaus may reject or remove advertisements that are unlawful, materially misleading, infringing, technically incompatible or otherwise in breach of these Terms.",
      "9.8. Refunds or credits following rejection, removal or interruption of paid advertising will be determined by the applicable agreement, the circumstances of the case and mandatory law.",
    ],
  },
  {
    num: 10,
    heading: "Billing periods and cancellation",
    clauses: [
      "10.1. Each paid Milhaus service will have a defined billing or service period, which will be disclosed before purchase.",
      "10.2. Services may be purchased on a monthly, annual, other fixed-period or one-off basis. The specific service period and payment obligations will be displayed before the customer commits.",
      "Monthly subscriptions",
      "10.3. Monthly subscriptions are charged for calendar-month service periods unless the purchase information expressly states a different billing arrangement.",
      "10.4. Customers may submit a cancellation request at any time.",
      "10.5. For a monthly subscription, cancellation ordinarily takes effect at the end of the calendar month in which the cancellation becomes effective. The service remains available until the end of that month, and the full monthly fee remains payable for that month.",
      "10.6. Cancellation during a calendar month does not ordinarily entitle the customer to a pro-rata reduction or refund of that month's fee, provided the agreed service remains available until the end of the month and no mandatory legal right requires a different result.",
      "10.7. No further monthly renewal charge will be made after the effective cancellation date, except for amounts already properly due under the agreement.",
      "Annual and other fixed-period subscriptions",
      "10.8. For an annual or other fixed-period subscription, the initial service period, total price, payment schedule, renewal arrangements and cancellation conditions will be disclosed before purchase.",
      "10.9. Customers may submit a cancellation request at any time. Unless the agreement or mandatory law provides otherwise, cancellation of an initial fixed-period subscription will prevent renewal at the end of that period but will not automatically entitle the customer to a refund for unused time already paid for.",
      "10.10. Where an annual or other fixed-period subscription automatically renews and the customer is a consumer, any renewal and cancellation terms will comply with mandatory German law. Where the law requires a contract to continue for an indefinite period after the initial term, the customer will be able to terminate the renewed contract with the legally required notice period.",
      "10.11. A customer may terminate a subscription earlier where an applicable statutory right, an agreed contractual right or a legally valid right to terminate for an important reason applies.",
      "One-off advertising purchases",
      "10.12. One-off purchases cover the advertising period or service described at purchase. Any cancellation or refund entitlement will be determined by the purchase terms and mandatory law.",
      "Mandatory rights",
      "10.13. Nothing in this section excludes a statutory right of withdrawal, a remedy for failure to provide the agreed service, a right to terminate for an important reason or any other mandatory consumer protection right.",
      "10.14. Where a statutory withdrawal right applies, Milhaus will provide the required information and instructions before purchase.",
      "10.15. If a consumer requests that a service begin during a statutory withdrawal period, Milhaus will obtain any required express request and acknowledgement and apply the applicable statutory rules regarding payment for services performed and loss of the withdrawal right.",
      "10.16. Where a refund is legally required, Milhaus will process it in accordance with applicable law.",
      "10.17. Cancellation requests may be submitted through the applicable online cancellation facility, where required, or by contacting info@milhaus.de. Where German law requires an online cancellation button, the website will provide a compliant facility and the required confirmation.",
    ],
  },
  {
    num: 11,
    heading: "Payments, renewals and invoices",
    clauses: [
      "11.1. Where a subscription renews automatically, its renewal frequency, price and cancellation conditions will be clearly disclosed before purchase.",
      "11.2. Milhaus will comply with applicable German consumer contract rules concerning subscription renewals, cancellation deadlines and online cancellation facilities.",
      "11.3. Customers are responsible for reviewing the price, service description, billing period and renewal conditions before purchase.",
      "11.4. Milhaus may suspend paid services for non-payment where permitted by the applicable agreement and law.",
      "11.5. Milhaus may use third-party payment providers to collect fees for its own advertising and subscription services.",
      "11.6. Payments to Milhaus relate to Milhaus's advertising and promotional services. Unless expressly stated otherwise, Milhaus does not accept or hold money exchanged directly between users.",
      "11.7. Milhaus will provide invoices or payment confirmations as required by law.",
    ],
  },
  {
    num: 12,
    heading: "Intellectual property and content licence",
    clauses: [
      "12.1. Advertisers retain ownership of content they lawfully own and submit to Milhaus.",
      "12.2. By submitting content, advertisers grant Milhaus a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, format, display and distribute that content as reasonably necessary to operate, provide and promote the relevant Milhaus services.",
      "12.3. Any broader use of advertiser content outside the reasonably expected operation and promotion of the service must have an appropriate legal basis or authorisation.",
      "12.4. Advertisers confirm that they have the necessary rights to submit their content and grant the licence described above.",
      "12.5. Milhaus may remove content where required by law, where it infringes third-party rights or where it breaches these Terms.",
      "12.6. Milhaus retains its rights in its branding, website design, software, original content and other intellectual property.",
    ],
  },
  {
    num: 13,
    heading: "Reporting illegal content and complaints",
    clauses: [
      "13.1. Milhaus will provide an accessible mechanism for reporting content that may be illegal or otherwise in breach of its rules.",
      "13.2. Reports should identify the relevant listing, explain the reasons for the complaint and provide supporting information where available.",
      "13.3. Milhaus may investigate reports and take appropriate action in accordance with applicable law.",
      "13.4. Depending on the circumstances, action may include requesting changes, restricting access, removing content or suspending an account.",
      "13.5. Where required by law, Milhaus will provide reasons for moderation decisions and information about applicable complaint or appeal procedures.",
      "13.6. A complaint does not automatically establish that an advertiser has acted unlawfully.",
      "13.7. Reports may be submitted to info@milhaus.de or through a designated reporting facility on the website.",
    ],
  },
  {
    num: 14,
    heading: "Moderation and suspension",
    clauses: [
      "14.1. Milhaus may review content and take proportionate action to enforce these Terms and comply with legal obligations.",
      "14.2. Reasons for restricting, suspending or terminating a listing or account may include suspected fraud, unlawful content, material misrepresentation, infringement of rights, repeated substantiated complaints, non-payment, security threats or a legal requirement.",
      "14.3. Where required by law, Milhaus will provide an explanation of the decision and information about available complaint or appeal procedures.",
      "14.4. Milhaus will comply with applicable notice, reasoning and procedural requirements.",
      "14.5. Milhaus does not guarantee that a listing will remain published for a particular period unless expressly agreed as part of a paid service.",
    ],
  },
  {
    num: 15,
    heading: "Third-party websites and services",
    clauses: [
      "15.1. Milhaus may contain links to third-party websites, services or payment providers.",
      "15.2. These services are operated independently and may be subject to separate terms and privacy policies.",
      "15.3. Milhaus does not control external websites and does not guarantee their content, availability, security or accuracy.",
      "15.4. A link or advertisement does not necessarily indicate endorsement by Milhaus.",
      "15.5. Nothing in this section excludes liability for a service that Milhaus itself provides or for which it is legally responsible.",
    ],
  },
  {
    num: 16,
    heading: "Website availability",
    clauses: [
      "16.1. Milhaus will take reasonable steps to maintain the availability and functionality of its website.",
      "16.2. Continuous, uninterrupted or error-free availability cannot be guaranteed.",
      "16.3. Temporary interruptions may occur because of maintenance, updates, hosting issues, telecommunications failures, security incidents or circumstances outside Milhaus's reasonable control.",
      "16.4. Milhaus may update or modify website features for operational, technical, security or legal reasons.",
      "16.5. Material changes affecting existing paid commitments will be handled in accordance with the applicable agreement and law.",
    ],
  },
  {
    num: 17,
    heading: "Limitation of liability",
    clauses: [
      "17.1. Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited.",
      "17.2. Milhaus remains responsible for its own contractual obligations and any acts or omissions for which it is legally liable.",
      "17.3. To the extent permitted by law, Milhaus is not responsible for the independent representations, products, services, property, contractual obligations or conduct of third-party advertisers merely because they use the platform.",
      "17.4. Any limitation of liability for indirect or consequential loss applies only to the extent permitted by applicable law and only where Milhaus is not otherwise legally responsible for that loss.",
      "17.5. Any limitation of liability for breach of an essential contractual obligation applies only to the extent permitted by law.",
      "17.6. Nothing in these Terms excludes liability for injury to life, body or health, intentional misconduct, gross negligence, fraud, an expressly assumed guarantee, mandatory statutory liability or any other liability that cannot lawfully be excluded.",
      "17.7. Milhaus does not guarantee sales, rentals, bookings, enquiries, leads, advertising reach or revenue.",
      "17.8. Users remain responsible for conducting appropriate due diligence before entering into transactions with other users.",
    ],
  },
  {
    num: 18,
    heading: "Advertiser responsibility",
    clauses: [
      "18.1. Advertisers are responsible for the legality and accuracy of their listings and advertising materials.",
      "18.2. To the extent permitted by law, an advertiser may be responsible for reasonable, legally recoverable losses and costs directly resulting from that advertiser's unlawful conduct, infringement of third-party rights or material breach of these Terms.",
      "18.3. Any reimbursement claim must be assessed according to the advertiser's actual responsibility, applicable law and the circumstances of the case.",
      "18.4. Nothing in this section requires an advertiser to reimburse Milhaus for losses caused by Milhaus's own unlawful conduct or for matters for which the advertiser is not legally responsible.",
    ],
  },
  {
    num: 19,
    heading: "Privacy and data protection",
    clauses: [
      "19.1. Milhaus processes personal information in accordance with applicable data protection law, including the EU General Data Protection Regulation where applicable.",
      "19.2. The separate Privacy Policy explains the information collected, purposes and legal bases for processing, recipients, retention periods and applicable rights.",
      "19.3. Users must handle personal information obtained through Milhaus lawfully and must not use contact details for harassment, fraud or unauthorised marketing.",
      "19.4. The Privacy Policy will be available at the website's designated Privacy Policy page.",
    ],
  },
  {
    num: 20,
    heading: "Changes to these Terms",
    clauses: [
      "20.1. Milhaus may amend these Terms where reasonably necessary to reflect changes in its services, business practices, security requirements or applicable law.",
      "20.2. Updated Terms will be published with a revised effective date.",
      "20.3. Where changes materially affect existing contractual relationships, Milhaus will provide notice or obtain agreement where required by applicable law.",
      "20.4. Mandatory consumer rights and existing contractual rights will not be removed merely by publishing a revised version.",
      "20.5. Any amendments affecting business users will comply with applicable platform-to-business requirements where relevant.",
    ],
  },
  {
    num: 21,
    heading: "Suspension, termination and account closure",
    clauses: [
      "21.1. Users may stop using Milhaus at any time.",
      "21.2. Account closure and subscription cancellation are separate actions unless the applicable service expressly combines them.",
      "21.3. Milhaus may suspend or terminate access for reasons permitted by these Terms and applicable law.",
      "21.4. Where required, Milhaus will provide notice, reasons and information about complaint or appeal mechanisms.",
      "21.5. Accrued payment obligations and provisions intended to survive termination will remain effective to the extent permitted by law.",
    ],
  },
  {
    num: 22,
    heading: "Governing law and jurisdiction",
    clauses: [
      "22.1. These Terms are governed by the laws of the Federal Republic of Germany, subject to mandatory consumer protection provisions that apply in individual cases.",
      "22.2. The competent courts will be determined under applicable law.",
      "22.3. Nothing in these Terms deprives consumers of mandatory rights concerning applicable law, court jurisdiction or consumer protection.",
      "22.4. If any provision is held invalid or unenforceable, the remaining provisions will continue to apply to the extent permitted by law.",
    ],
  },
];

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";

export default function TermsPage() {
  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Terms and Conditions of Use</h1>
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
                  // Plain-text sub-headings inside section 10 (e.g. "Monthly
                  // subscriptions") read differently from a numbered clause —
                  // distinguished the same way Charlie's own source text does,
                  // by not starting with a number.
                  /^\d/.test(clause) ? (
                    <p key={index} className="text-[0.95rem] leading-relaxed text-charcoal">
                      {clause}
                    </p>
                  ) : (
                    <h3 key={index} className="mt-2 font-display text-base font-semibold text-ink">
                      {clause}
                    </h3>
                  )
                ) : (
                  <div key={index}>
                    <p className="mb-2 text-[0.95rem] leading-relaxed text-charcoal">{clause.lead}</p>
                    <ul className="list-disc space-y-1 pl-6 text-[0.95rem] leading-relaxed text-charcoal">
                      {clause.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}

        <section className="mb-9">
          <h2 className="mb-3 font-display text-xl font-semibold text-ink">23. Contact and legal information</h2>
          <p className="mb-1 text-[0.95rem] font-semibold text-charcoal">Milhaus — operated by Charles Edward Adam</p>
          <p className={labelClass}>Business address</p>
          <p className="mb-3 text-[0.95rem] text-charcoal">
            Oswaldstr 59
            <br />
            71106 Magstadt
            <br />
            Germany
          </p>
          <p className={labelClass}>Postal address</p>
          <p className="mb-3 text-[0.95rem] text-charcoal">
            Robert Bosch Str-6
            <br />
            71106 Schonaich
            <br />
            Germany
          </p>
          <p className="text-[0.95rem] text-charcoal">
            Email: info@milhaus.de
            <br />
            Website: https://www.milhaus.de
          </p>
        </section>
      </div>
    </main>
  );
}
