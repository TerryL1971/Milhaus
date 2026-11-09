// src/lib/withdrawal-notice.ts
// The consumer withdrawal notice (Widerrufsbelehrung) and model
// withdrawal form, in one place so the /withdrawal page and the order
// confirmation email (src/lib/order-confirmation-email.ts) can never
// say different things. Added 2026-11-09 after the legal review: the
// site sold posting fees and ad spots to consumers with no withdrawal
// notice at all.
//
// The German text follows the statutory model (Anlage 1 and 2 zu
// Art. 246a § 1 Abs. 2 EGBGB) for services, with delivery costs left
// out (nothing is delivered) and one added sentence pointing to the
// online withdrawal button that § 356a BGB requires from 19 June 2026.
// The English is the EU directive's own wording (Directive 2011/83/EU,
// Annex I). Using the official model is what protects the trader, so
// don't paraphrase it — any change should come from a lawyer or the
// legal-text service Charlie subscribes to.

export const TRADER = {
  name: "Charles Edward Adam",
  tradingAs: "Milhaus",
  street: "Robert Bosch Str. 6",
  city: "71101 Schönaich",
  country: { en: "Germany", de: "Deutschland" },
  email: "info@milhaus.de",
  phone: "0173 2966536",
};

export type NoticeLocale = "en" | "de";

type NoticeSection = { heading: string; paragraphs: string[] };

function traderLine(locale: NoticeLocale): string {
  return `${TRADER.name}, ${TRADER.tradingAs}, ${TRADER.street}, ${TRADER.city}, ${TRADER.country[locale]}, ${
    locale === "de" ? "E-Mail" : "email"
  }: ${TRADER.email}, ${locale === "de" ? "Telefon" : "phone"}: ${TRADER.phone}`;
}

export function withdrawalNotice(locale: NoticeLocale, withdrawUrl: string): {
  title: string;
  sections: NoticeSection[];
  formTitle: string;
  formIntro: string;
  formLines: string[];
} {
  if (locale === "de") {
    return {
      title: "Widerrufsbelehrung",
      sections: [
        {
          heading: "Widerrufsrecht",
          paragraphs: [
            "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
            "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.",
            `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${traderLine("de")}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.`,
            `Sie können Ihren Widerruf auch online über die Schaltfläche „Vertrag widerrufen“ auf unserer Website erklären (${withdrawUrl}). Wir bestätigen Ihnen den Eingang Ihres Widerrufs unverzüglich per E-Mail.`,
            "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
          ],
        },
        {
          heading: "Folgen des Widerrufs",
          paragraphs: [
            "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
            "Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.",
          ],
        },
        {
          heading: "Vorzeitiges Erlöschen des Widerrufsrechts",
          paragraphs: [
            "Das Widerrufsrecht erlischt vorzeitig, wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung durch uns verlieren.",
            "Das Widerrufsrecht steht nur Verbrauchern zu, also Personen, die den Vertrag zu Zwecken abschließen, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.",
          ],
        },
      ],
      formTitle: "Muster-Widerrufsformular",
      formIntro: "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)",
      formLines: [
        `An ${TRADER.name}, ${TRADER.tradingAs}, ${TRADER.street}, ${TRADER.city}, ${TRADER.country.de}, E-Mail: ${TRADER.email}:`,
        "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*)",
        "Bestellt am (*)",
        "Name des/der Verbraucher(s)",
        "Anschrift des/der Verbraucher(s)",
        "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
        "Datum",
        "(*) Unzutreffendes streichen.",
      ],
    };
  }

  return {
    title: "Withdrawal policy",
    sections: [
      {
        heading: "Right of withdrawal",
        paragraphs: [
          "You have the right to withdraw from this contract within 14 days without giving any reason.",
          "The withdrawal period will expire after 14 days from the day of the conclusion of the contract.",
          `To exercise the right of withdrawal, you must inform us (${traderLine("en")}) of your decision to withdraw from this contract by an unequivocal statement (e.g. a letter sent by post or an email). You may use the attached model withdrawal form, but it is not obligatory.`,
          `You can also withdraw online with the "Withdraw from contract" button on our website (${withdrawUrl}). We will confirm by email, without delay, that we have received your withdrawal.`,
          "To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.",
        ],
      },
      {
        heading: "Effects of withdrawal",
        paragraphs: [
          "If you withdraw from this contract, we shall reimburse to you all payments received from you without undue delay and in any event not later than 14 days from the day on which we are informed about your decision to withdraw from this contract. We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement.",
          "If you requested to begin the performance of services during the withdrawal period, you shall pay us an amount which is in proportion to what has been provided until you have communicated to us your withdrawal from this contract, in comparison with the full coverage of the contract.",
        ],
      },
      {
        heading: "When the right of withdrawal ends early",
        paragraphs: [
          "The right of withdrawal ends early once we have fully provided the service, if we only began providing it after you expressly agreed to that and at the same time confirmed that you know you lose your right of withdrawal once we have fully performed the contract.",
          "The right of withdrawal is only available to consumers — people who conclude the contract for purposes that are mainly outside their trade, business or profession.",
        ],
      },
    ],
    formTitle: "Model withdrawal form",
    formIntro: "(Complete and return this form only if you wish to withdraw from the contract.)",
    formLines: [
      `To ${TRADER.name}, ${TRADER.tradingAs}, ${TRADER.street}, ${TRADER.city}, ${TRADER.country.en}, email: ${TRADER.email}:`,
      "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*)",
      "Ordered on (*)",
      "Name of consumer(s)",
      "Address of consumer(s)",
      "Signature of consumer(s) (only if this form is notified on paper)",
      "Date",
      "(*) Delete as appropriate.",
    ],
  };
}

/** The wording of the cart's required checkbox — kept here because the
 * order confirmation email has to repeat it word for word (§ 312f BGB:
 * the confirmation must record the consumer's request). */
export const IMMEDIATE_START_CONSENT =
  "I ask Milhaus to start providing these services (publishing my listings and ad spots) right away, before the 14-day withdrawal period ends. I understand that if I withdraw, I pay for the part already provided, and that I lose my right of withdrawal once the service has been fully provided.";
