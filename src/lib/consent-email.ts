// src/lib/consent-email.ts
// Sends the business consent-confirmation email — the actual
// verification step in the system Terry ported from European-Living.live.
// Goes to the business's own email (businesses.email), never the
// submitter's account — whoever's signed in and filled out the form
// isn't necessarily the business itself, so this is the out-of-band
// check that they are (or that they've actually reached the real
// business, who can then decline by just not clicking).

import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site-url";

export async function sendConsentRequestEmail({
  to,
  businessName,
  token,
}: {
  to: string;
  businessName: string;
  token: string;
}): Promise<boolean> {
  const confirmUrl = `${SITE_URL}/consent/${token}`;

  const html = `
    <div style="background:#F0EDE4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#FBFAF6;border-radius:8px;padding:32px;">
        <h1 style="margin:0 0 4px;font-size:22px;color:#1B2A3A;">Milhaus</h1>
        <p style="margin:0 0 24px;color:#2C4053;font-size:14px;">Confirm your business listing</p>

        <p style="margin:0 0 16px;color:#22201B;">
          Someone has submitted <strong>${escapeHtml(businessName)}</strong> to be listed in the
          Military-Friendly Businesses directory on Milhaus.
        </p>
        <p style="margin:0 0 24px;color:#22201B;">
          If you are the owner of this business, or an authorized representative, please confirm
          below. If you don't recognize this or didn't authorize it, you can simply ignore this
          email — nothing goes live without this confirmation.
        </p>

        <a href="${confirmUrl}" style="display:inline-block;background:#B5502F;color:#FBFAF6;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;">
          Confirm this listing
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#2C4053;">
          Or paste this link into your browser: ${confirmUrl}
        </p>
      </div>
    </div>`;

  return sendEmail({
    to,
    subject: `Please confirm: ${businessName} on Milhaus`,
    html,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
