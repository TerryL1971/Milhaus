// src/app/admin/messages/page.tsx
// Admin → Messages: everything sent through the Contact page, plus the
// Milhaus Service pop-up's requests (both Charlie's asks, 2026-11-09).
// Each one is also emailed to info@milhaus.de —
// this page is the backup if an email goes missing, and where Charlie
// ticks them off. Answer by email ("Reply" link), then Mark handled;
// Delete once it's no longer needed.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteMessage,
  deleteServiceRequest,
  markMessageHandled,
  markServiceRequestHandled,
} from "@/app/admin/messages/actions";
import {
  CONTACT_TOPIC_ADMIN_LABELS,
  isContactTopic,
} from "@/lib/contact-topics";
import {
  SERVICE_INTEREST_ADMIN_LABELS,
  isServiceInterest,
} from "@/lib/milhaus-service";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

type Row = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  page: string | null;
  status: "open" | "handled";
  created_at: string;
  handled_at: string | null;
};

type ServiceRow = {
  id: string;
  email: string;
  interests: string[];
  locale: string;
  page: string | null;
  status: "open" | "handled";
  created_at: string;
};

const smallButton =
  "rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep";

function MessageCard({ row }: { row: Row }) {
  const topic = isContactTopic(row.topic)
    ? CONTACT_TOPIC_ADMIN_LABELS[row.topic]
    : row.topic;
  return (
    <div
      className={`rounded-md border border-canvas-deep p-4 ${row.status === "open" ? "bg-paper" : "bg-paper/60"}`}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-ink">
          {row.name} ·{" "}
          <a
            href={`mailto:${row.email}`}
            className="text-olive-deep hover:underline"
          >
            {row.email}
          </a>
        </p>
        <p className="font-mono text-xs text-ink-soft">
          {dateFormatter.format(new Date(row.created_at))}
        </p>
      </div>
      <p className="mb-2 font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-olive-deep">
        {topic}
      </p>
      <p className="mb-3 whitespace-pre-line text-sm text-charcoal">
        {row.message}
      </p>
      {row.page && (
        <p className="mb-3 text-xs text-ink-soft">Sent from {row.page}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${row.email}?subject=${encodeURIComponent("Re: your message to Milhaus")}`}
          className="rounded-md bg-brass px-3 py-1.5 text-xs font-semibold text-paper hover:bg-brass-deep"
        >
          Reply by email
        </a>
        {row.status === "open" && (
          <form action={markMessageHandled}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className={smallButton}>
              Mark handled
            </button>
          </form>
        )}
        <form action={deleteMessage}>
          <input type="hidden" name="id" value={row.id} />
          <button
            type="submit"
            className={`${smallButton} hover:border-rust hover:text-rust`}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function ServiceRequestCard({ row }: { row: ServiceRow }) {
  const wants = row.interests
    .filter(isServiceInterest)
    .map((key) => SERVICE_INTEREST_ADMIN_LABELS[key]);
  return (
    <div
      className={`rounded-md border border-canvas-deep p-4 ${row.status === "open" ? "bg-paper" : "bg-paper/60"}`}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <a
          href={`mailto:${row.email}`}
          className="font-medium text-olive-deep hover:underline"
        >
          {row.email}
        </a>
        <p className="font-mono text-xs text-ink-soft">
          {dateFormatter.format(new Date(row.created_at))}
        </p>
      </div>
      <p className="mb-3 text-sm text-charcoal">
        Wants help with: {wants.length ? wants.join(", ") : "nothing ticked"}
        <span className="text-ink-soft">
          {" "}
          · {row.locale === "de" ? "German" : "English"}
          {row.page ? ` · on ${row.page}` : ""}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${row.email}?subject=${encodeURIComponent("Milhaus Service")}`}
          className="rounded-md bg-brass px-3 py-1.5 text-xs font-semibold text-paper hover:bg-brass-deep"
        >
          Reply by email
        </a>
        {row.status === "open" && (
          <form action={markServiceRequestHandled}>
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className={smallButton}>
              Mark handled
            </button>
          </form>
        )}
        <form action={deleteServiceRequest}>
          <input type="hidden" name="id" value={row.id} />
          <button
            type="submit"
            className={`${smallButton} hover:border-rust hover:text-rust`}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/messages");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = (data ?? []) as Row[];
  const { data: serviceData } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  const serviceRows = (serviceData ?? []) as ServiceRow[];
  const open = rows.filter((row) => row.status === "open");
  const handled = rows.filter((row) => row.status === "handled");

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[900px] px-8">
        <div className="mb-10">
          <Link
            href="/admin"
            className="mb-2 inline-block text-sm text-ink-soft hover:text-ink"
          >
            ← Admin
          </Link>
          <h1 className="mb-1 font-display text-3xl font-semibold text-ink">
            Messages
          </h1>
          <p className="max-w-[65ch] text-ink-soft">
            What people sent through the Contact page and the Milhaus Service
            pop-up. Each one was also emailed to info@milhaus.de. Answer by
            email, then mark it handled. Delete it once you no longer need it.
          </p>
        </div>

        <h2 className="mb-4 font-display text-xl font-semibold text-ink">
          Milhaus Service requests
        </h2>
        {serviceRows.length === 0 ? (
          <p className="mb-12 text-sm text-ink-soft">None yet.</p>
        ) : (
          <div className="mb-12 flex flex-col gap-3">
            {[
              ...serviceRows.filter((r) => r.status === "open"),
              ...serviceRows.filter((r) => r.status !== "open"),
            ].map((row) => (
              <ServiceRequestCard key={row.id} row={row} />
            ))}
          </div>
        )}

        <h2 className="mb-6 font-display text-2xl font-semibold text-ink">
          Contact page
        </h2>

        <h2 className="mb-4 font-display text-xl font-semibold text-ink">
          Open
        </h2>
        {open.length === 0 ? (
          <p className="mb-12 text-sm text-ink-soft">No open messages.</p>
        ) : (
          <div className="mb-12 flex flex-col gap-3">
            {open.map((row) => (
              <MessageCard key={row.id} row={row} />
            ))}
          </div>
        )}

        <h2 className="mb-4 font-display text-xl font-semibold text-ink">
          Handled
        </h2>
        {handled.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing handled yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {handled.map((row) => (
              <MessageCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
