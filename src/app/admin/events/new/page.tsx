// src/app/admin/events/new/page.tsx
// Admin's "add an event" form — plain fields Charlie types in by hand,
// same reasoning as /admin/businesses/new (he's hand-curating a public
// calendar, not reviewing self-serve submissions). Cover photo + a
// gallery of additional pictures upload as real files (not pasted URLs
// like businesses' logo/cover fields) since there's no existing
// precedent he'd already be used to, and a file picker is simpler for a
// non-technical user than finding somewhere to host an image first.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createEvent } from "@/app/admin/events/actions";
import { BASE_NAMES } from "@/lib/bases";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add an event",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export default async function AdminNewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/events/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <Link href="/admin/events" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          ← Back to events
        </Link>
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Add an event</h1>
        <p className="mb-8 text-ink-soft">Shows up on the public Events page right away.</p>

        <form action={createEvent} encType="multipart/form-data" className="flex flex-col gap-5">
          <div>
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input id="title" name="title" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea id="description" name="description" rows={4} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="organizerName" className={labelClass}>
                Organizer name
              </label>
              <input id="organizerName" name="organizerName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="organizerUrl" className={labelClass}>
                Organizer link
              </label>
              <input
                id="organizerUrl"
                name="organizerUrl"
                type="url"
                placeholder="https://…"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className={labelClass}>
                City
              </label>
              <input id="city" name="city" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="base" className={labelClass}>
                Nearest base
              </label>
              <select id="base" name="base" defaultValue="" className={inputClass}>
                <option value="">Not base-specific</option>
                {BASE_NAMES.map((base) => (
                  <option key={base} value={base}>
                    {base}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startsAt" className={labelClass}>
                Starts
              </label>
              <input id="startsAt" name="startsAt" type="datetime-local" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="endsAt" className={labelClass}>
                Ends (optional)
              </label>
              <input id="endsAt" name="endsAt" type="datetime-local" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="coverImage" className={labelClass}>
              Cover photo (optional)
            </label>
            <input
              id="coverImage"
              name="coverImage"
              type="file"
              accept="image/*"
              className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-canvas-deep file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            />
          </div>

          <div>
            <label htmlFor="photos" className={labelClass}>
              More pictures (optional)
            </label>
            <input
              id="photos"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-canvas-deep file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-fit rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Save event
          </button>
        </form>
      </div>
    </main>
  );
}
