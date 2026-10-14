// src/app/admin/events/page.tsx
// Admin's Events page — the calendar the public /events page shows.
// Charlie adds every entry himself, same pattern as /admin/businesses
// minus the review queue and consent system (public event info he's
// choosing to publish, not a third party's private details).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteEvent, toggleEventActive } from "@/app/admin/events/actions";
import { getAllEvents } from "@/lib/events-queries";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/events");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const events = await getAllEvents();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[1000px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
              ← Admin
            </Link>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Events</h1>
            <p className="max-w-[60ch] text-ink-soft">
              What the public Events page and calendar show. Hide one without losing its details, or
              delete it for good.
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Add an event
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-ink-soft">None added yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-canvas-deep bg-paper">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-canvas-deep text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Organizer</th>
                  <th className="px-4 py-3 font-medium">City / base</th>
                  <th className="px-4 py-3 font-medium">Starts</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-canvas-deep last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{event.title}</td>
                    <td className="px-4 py-3 text-ink-soft">{event.organizerName}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {event.city}
                      {event.base ? ` · ${event.base}` : ""}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{dateFormatter.format(new Date(event.startsAt))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
                          event.isActive ? "bg-olive/15 text-olive-deep" : "bg-rust/15 text-rust"
                        }`}
                      >
                        {event.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <form action={toggleEventActive}>
                          <input type="hidden" name="id" value={event.id} />
                          <input type="hidden" name="isActive" value={String(event.isActive)} />
                          <button
                            type="submit"
                            className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                          >
                            {event.isActive ? "Hide" : "Unhide"}
                          </button>
                        </form>
                        <form action={deleteEvent}>
                          <input type="hidden" name="id" value={event.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-rust hover:text-rust"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
