// src/lib/moderation.ts
// Why a listing was taken down, and the email that tells its owner.
// Added 2026-11-09 after the legal review: the Digital Services Act
// (Art. 17) says a hosting service that removes someone's content must
// send them a "statement of reasons" — what was done, the facts behind
// it, the rule it broke (the law, or which part of the Terms), whether
// it was automated, and how to challenge it. Admin → Reject / Archive
// asks Charlie for a reason (src/components/takedown-form.tsx) and
// src/app/admin/actions.ts sends this email.
//
// "no_notice" is for an archive that isn't a moderation decision at all
// — the owner asked, or the home is no longer available. Nothing is
// sent for that one; telling someone their listing "broke the rules"
// when it didn't would be wrong.

import { sendEmail } from "@/lib/email";
import { emailFrame, escapeHtml } from "@/lib/escape-html";
import { SITE_URL } from "@/lib/site-url";
import type { createAdminClient } from "@/lib/supabase/admin";
import { TRADER } from "@/lib/withdrawal-notice";

export const TAKEDOWN_REASONS = {
  illegal: {
    label: "Illegal content",
    statement: "The listing appears to be illegal under applicable law.",
    ground: "applicable law, and Terms sections 6.1, 6.5 and 14.2",
    noteRequired: true,
  },
  scam: {
    label: "Suspected scam or fraud",
    statement: "The listing appears to be a scam or otherwise fraudulent.",
    ground: "Terms sections 6.1, 6.2 and 14.2",
    noteRequired: false,
  },
  misleading: {
    label: "Misleading or false information",
    statement: "The listing contains information that is materially misleading or false (for example the price, photos or description).",
    ground: "Terms sections 3, 6.2 and 14.2",
    noteRequired: false,
  },
  rights: {
    label: "Uses someone else's photos or content",
    statement: "The listing uses content (such as photos or text) that the poster does not appear to have the rights to.",
    ground: "Terms sections 6.4 and 12.5",
    noteRequired: false,
  },
  not_allowed: {
    label: "Not allowed on Milhaus (breaks the Terms)",
    statement: "The listing is not permitted under the Milhaus Terms and Conditions.",
    ground: "Terms sections 6 and 14",
    noteRequired: true,
  },
  spam: {
    label: "Spam or duplicate listing",
    statement: "The listing is spam or a duplicate of another listing.",
    ground: "Terms sections 6.2 and 6.3",
    noteRequired: false,
  },
  other: {
    label: "Other reason (explain below)",
    statement: "The listing was removed for the reason explained below.",
    ground: "Terms section 14",
    noteRequired: true,
  },
  no_notice: {
    label: "Not a rule problem — owner asked, or no longer available (no email)",
    statement: "",
    ground: "",
    noteRequired: false,
  },
} as const;

export type TakedownReason = keyof typeof TAKEDOWN_REASONS;

export function isTakedownReason(value: unknown): value is TakedownReason {
  return typeof value === "string" && value in TAKEDOWN_REASONS;
}

/** The poster's contact email if they set one, otherwise their sign-in email. */
export async function listingOwnerEmail(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
): Promise<string | null> {
  const { data: profile } = await admin.from("profiles").select("contact_email").eq("id", ownerId).maybeSingle();
  if (profile?.contact_email) return profile.contact_email as string;
  const { data } = await admin.auth.admin.getUserById(ownerId);
  return data.user?.email ?? null;
}

export function sendTakedownNotice({
  to,
  listingTitle,
  reason,
  note,
  fromReport,
  rejected,
}: {
  to: string;
  listingTitle: string;
  reason: Exclude<TakedownReason, "no_notice">;
  note: string | null;
  fromReport: boolean;
  /** true = never went live (rejected at review), false = taken off the live site. */
  rejected: boolean;
}): Promise<boolean> {
  const info = TAKEDOWN_REASONS[reason];
  const decidedOn = new Date().toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "Europe/Berlin" });
  const p = (html: string) => `<p style="margin:0 0 14px;">${html}</p>`;
  const heading = (text: string) => `<p style="margin:18px 0 6px;font-weight:600;color:#101842;">${text}</p>`;

  const html = emailFrame(
    "A decision about your listing",
    [
      p(
        `Your listing <strong>${escapeHtml(listingTitle)}</strong> ${
          rejected ? "has not been published" : "has been removed from public view"
        } on Milhaus (${escapeHtml(decidedOn)}). It stays saved in your account, but nobody else can see it.`,
      ),
      heading("Why"),
      p(escapeHtml(info.statement)),
      note ? p(`<em>${escapeHtml(note)}</em>`) : "",
      p(
        fromReport
          ? "We looked into this after someone reported the listing to us."
          : "We noticed this ourselves while checking listings on the site.",
      ),
      heading("The rule it is based on"),
      p(
        `${escapeHtml(info.ground)} — <a href="${SITE_URL}/terms" style="color:#545A41;">${SITE_URL}/terms</a>`,
      ),
      heading("How this decision was made"),
      p("A person at Milhaus reviewed the listing and made this decision. No automated tools were used."),
      heading("If you disagree"),
      p(
        `Reply to this email, or write to ${escapeHtml(TRADER.email)}, and tell us why — we will look at it again. If you fixed the problem, you can edit the listing and ask us to put it back. You can also take the decision to court.`,
      ),
      `<p style="margin:24px 0 0;font-size:12px;color:#2C345E;">${escapeHtml(
        `${TRADER.name}, ${TRADER.tradingAs}, ${TRADER.street}, ${TRADER.city} · ${TRADER.email}`,
      )}</p>`,
    ].join(""),
  );

  return sendEmail({
    to,
    subject: rejected ? "Your Milhaus listing was not published" : "Your Milhaus listing has been removed",
    html,
    replyTo: TRADER.email,
  });
}
