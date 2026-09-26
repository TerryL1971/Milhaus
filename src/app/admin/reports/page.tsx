// src/app/admin/reports/page.tsx
// Admin's Reports queue — every open "report this listing" flag, oldest
// first. Kept as its own page rather than a section on the main dashboard:
// the pending-review queue is Charlie's daily list, this is closer to an
// exception list he checks less often.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveReport } from "@/app/admin/reports/actions";
import { getOpenReports } from "@/lib/listing-reports";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const LISTING_PATH: Record<string, string> = {
  rental: "/listings",
  car: "/cars",
  product: "/products",
  service: "/services",
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/reports");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!isAdminRole(profile?.role)) redirect("/");

  const reports = await getOpenReports();

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[900px] px-8">
        <div className="mb-10">
          <Link href="/admin" className="mb-2 inline-block text-sm text-ink-soft hover:text-ink">
            ← Admin
          </Link>
          <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Reports</h1>
          <p className="text-ink-soft">Listings other users have flagged for you to look at.</p>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing reported right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-canvas-deep bg-paper p-4"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {report.listingType && (
                      <span className="mr-2 rounded-full bg-canvas-deep px-2 py-0.5 align-middle font-mono text-[0.6rem] uppercase tracking-wider text-ink-soft">
                        {report.listingType}
                      </span>
                    )}
                    {report.listingTitle ? (
                      <Link
                        href={`${LISTING_PATH[report.listingType ?? "rental"]}/${report.listingId}`}
                        className="text-olive-deep hover:underline"
                      >
                        {report.listingTitle}
                      </Link>
                    ) : (
                      "(listing removed)"
                    )}
                  </p>
                  <p className="mt-1.5 max-w-[60ch] whitespace-pre-line text-sm text-charcoal/90">{report.reason}</p>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    Reported by {report.reporterName || report.reporterEmail || "a user"} ·{" "}
                    {dateFormatter.format(new Date(report.createdAt))}
                  </p>
                </div>
                <form action={resolveReport}>
                  <input type="hidden" name="id" value={report.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep"
                  >
                    Mark resolved
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
