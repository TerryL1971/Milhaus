// src/app/admin/page.tsx
// Admin dashboard (build order step 7) — Charlie's daily tool. Two things:
// a queue of submissions waiting on him, and a table of everything
// currently live with one-click status changes. Deliberately not much
// more than that — "genuinely simple... Charlie is non-technical and will
// use this daily" per CLAUDE.md.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { approveListing, archiveListing, markRented, rejectListing, setFeatured } from "@/app/admin/actions";
import { getLiveListings, getPendingListings } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [pending, live] = await Promise.all([getPendingListings(), getLiveListings()]);

  return (
    <main className="flex-1 py-12">
      <div className="mx-auto max-w-[900px] px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Admin</h1>
            <p className="text-ink-soft">Review submissions and manage what&apos;s live.</p>
          </div>
          <Link
            href="/admin/listings/new"
            className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            + Add listing
          </Link>
        </div>

        <section className="mb-14">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">
            Needs review
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-brass px-2.5 py-0.5 align-middle font-mono text-xs font-semibold text-ink">
                {pending.length}
              </span>
            )}
          </h2>

          {pending.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing waiting on you right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-canvas-deep bg-paper p-4"
                >
                  <div>
                    <p className="font-semibold text-ink">{listing.title}</p>
                    <p className="text-sm text-ink-soft">
                      {listing.address}, {listing.city}
                      {listing.base ? ` · ${listing.base}` : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 font-mono text-xs text-charcoal/80">
                      <span>{currencyFormatter.format(listing.priceEurMonth)}/mo</span>
                      <span>{listing.bedrooms} bed</span>
                      <span>{listing.bathrooms} bath</span>
                      <span className="text-ink-soft">
                        {listing.source === "housing_office" ? "Housing office" : "Self-listed"} · submitted{" "}
                        {dateFormatter.format(new Date(listing.createdAt))}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveListing}>
                      <input type="hidden" name="id" value={listing.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-olive px-4 py-2 text-sm font-semibold text-paper transition-[transform] hover:-translate-y-px"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectListing}>
                      <input type="hidden" name="id" value={listing.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-rust hover:text-rust"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Live listings</h2>

          {live.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing live yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-canvas-deep bg-paper">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-canvas-deep text-left font-mono text-xs uppercase tracking-wider text-ink-soft/75">
                    <th className="px-4 py-3 font-medium">Listing</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {live.map((listing) => (
                    <tr key={listing.id} className="border-b border-canvas-deep last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">
                          {listing.isFeatured && <span className="mr-1 text-brass">★</span>}
                          {listing.title}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {listing.city}
                          {listing.base ? ` · ${listing.base}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {currencyFormatter.format(listing.priceEurMonth)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
                            listing.status === "rented"
                              ? "bg-rust/10 text-rust"
                              : "bg-olive/15 text-olive-deep"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {listing.status === "active" && (
                            <form action={setFeatured}>
                              <input type="hidden" name="id" value={listing.id} />
                              <input type="hidden" name="isFeatured" value={(!listing.isFeatured).toString()} />
                              <button
                                type="submit"
                                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                                  listing.isFeatured
                                    ? "border-brass bg-brass/15 text-brass-deep"
                                    : "border-canvas-deep text-ink-soft hover:border-brass hover:text-brass-deep"
                                }`}
                              >
                                {listing.isFeatured ? "★ Featured" : "☆ Feature"}
                              </button>
                            </form>
                          )}
                          {listing.status === "active" && (
                            <form action={markRented}>
                              <input type="hidden" name="id" value={listing.id} />
                              <button
                                type="submit"
                                className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep"
                              >
                                Mark rented
                              </button>
                            </form>
                          )}
                          <form action={archiveListing}>
                            <input type="hidden" name="id" value={listing.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-canvas-deep px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-rust hover:text-rust"
                            >
                              Archive
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
        </section>
      </div>
    </main>
  );
}
