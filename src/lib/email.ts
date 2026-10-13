// src/lib/email.ts
// Server-only transactional email sending via Resend's HTTP API — a
// plain fetch call rather than their SDK. Brought back specifically for
// the business consent-confirmation email (src/lib/consent-email.ts):
// Stripe's own receipt emails cover payments, but there's no equivalent
// for "please confirm you consent to being listed" — that's not
// something any payment provider can send. Auth emails are still
// Supabase's own, configured as SMTP in the Supabase dashboard (see
// supabase/SETUP.md) — unrelated to this. Never import this from a
// "use client" component: RESEND_API_KEY must never reach the browser.

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/** Best-effort: logs and returns false instead of throwing when email
 * isn't configured yet, or when Resend rejects the request. A consent
 * request that can't be emailed yet shouldn't block the submission
 * itself — Charlie can still record consent manually (paper form,
 * verbal) while Resend isn't set up. */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      "[email] Skipping send — RESEND_API_KEY / EMAIL_FROM are not set. " +
        "Copy .env.example to .env.local and fill in a Resend API key and a " +
        "sender address on a domain verified with Resend.",
    );
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      console.error(`[email] Resend rejected the send (${response.status}): ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }
}
