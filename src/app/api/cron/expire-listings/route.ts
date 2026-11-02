// src/app/api/cron/expire-listings/route.ts
// Daily job behind Charlie's 30-day listing limit — run by Vercel Cron
// (see vercel.json), which calls this with `Authorization: Bearer
// $CRON_SECRET`. Two passes, both service-role since there's no signed-in
// user here:
//
// 1. Take down anything past its expires_at: active -> expired. It drops
//    off every public page (they all read status='active') and shows up
//    under "Expired" in the poster's My Listings with a Renew button.
// 2. Email anyone whose listing comes down within the next 3 days, once
//    per listing (expiry_warning_sent_at; renewing resets it). Sending is
//    best-effort via sendEmail — if Resend isn't configured the listing
//    still expires on schedule, the poster just isn't warned.
//
// expires_at itself is set by a database trigger whenever a listing goes
// live (20261102150000_add_listing_expiry.sql), so this never decides
// *when* something expires, only acts on it.

import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

const WARNING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: expired, error: expireError } = await admin
    .from("listings")
    .update({ status: "expired" })
    .eq("status", "active")
    .lte("expires_at", now.toISOString())
    .select("id");
  if (expireError) {
    console.error("expire-listings: expiring failed:", expireError.message);
    return NextResponse.json({ error: expireError.message }, { status: 500 });
  }

  const { data: dueSoon, error: dueError } = await admin
    .from("listings")
    .select("id, title, owner_id, expires_at")
    .eq("status", "active")
    .is("expiry_warning_sent_at", null)
    .lte("expires_at", new Date(now.getTime() + WARNING_WINDOW_MS).toISOString());
  if (dueError) {
    console.error("expire-listings: warning lookup failed:", dueError.message);
    return NextResponse.json({ error: dueError.message }, { status: 500 });
  }

  let warned = 0;
  for (const listing of dueSoon ?? []) {
    const to = await ownerEmail(admin, listing.owner_id as string);
    if (!to) continue;
    const sent = await sendExpiryWarning({
      to,
      title: listing.title as string,
      expiresAt: new Date(listing.expires_at as string),
    });
    // Only marked when it actually went out, so a Resend outage today
    // means tomorrow's run tries again rather than silently skipping.
    if (sent) {
      await admin.from("listings").update({ expiry_warning_sent_at: now.toISOString() }).eq("id", listing.id);
      warned += 1;
    }
  }

  return NextResponse.json({ expired: expired?.length ?? 0, warned });
}

// The poster's own contact email if they set one on their profile,
// otherwise the email they sign in with.
async function ownerEmail(admin: ReturnType<typeof createAdminClient>, ownerId: string): Promise<string | null> {
  const { data: profile } = await admin.from("profiles").select("contact_email").eq("id", ownerId).maybeSingle();
  if (profile?.contact_email) return profile.contact_email as string;
  const { data } = await admin.auth.admin.getUserById(ownerId);
  return data.user?.email ?? null;
}

function sendExpiryWarning({ to, title, expiresAt }: { to: string; title: string; expiresAt: Date }) {
  const renewUrl = `${SITE_URL}/my-listings`;
  const date = expiresAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const html = `
    <div style="background:#F0EDE4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#FBFAF6;border-radius:8px;padding:32px;">
        <h1 style="margin:0 0 4px;font-size:22px;color:#1B2A3A;">Milhaus</h1>
        <p style="margin:0 0 24px;color:#2C4053;font-size:14px;">Your listing is about to expire</p>

        <p style="margin:0 0 16px;color:#22201B;">
          <strong>${escapeHtml(title)}</strong> comes off Milhaus on <strong>${date}</strong> —
          listings stay up for 30 days at a time.
        </p>
        <p style="margin:0 0 24px;color:#22201B;">
          Still available? Renew it from My Listings to keep it up for another 30 days — renewing
          now adds the 30 days on top of the time it has left. If it's already gone, you don't need
          to do anything.
        </p>

        <a href="${renewUrl}" style="display:inline-block;background:#C0392B;color:#FBFAF6;padding:12px 24px;border-radius:6px;font-weight:600;text-decoration:none;">
          Renew my listing
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#2C4053;">
          Or paste this link into your browser: ${renewUrl}
        </p>
      </div>
    </div>`;

  return sendEmail({ to, subject: `Your Milhaus listing expires ${date}`, html });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
