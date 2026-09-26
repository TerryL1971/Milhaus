// src/lib/listing-reports.ts
// Admin's "Reports" queue — community-flagged listings (see the
// "Report this listing" button on every detail page and the
// listing_reports table added in
// supabase/migrations/20260926180000_split_listing_types_and_trust_safety.sql).
// Same pattern as listings.ts/profiles.ts: RLS already scopes this to
// admins, this just shapes the query.

import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

export interface ListingReport {
  id: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
  listingId: string;
  listingTitle: string | null;
  listingType: ListingType | null;
  reporterName: string | null;
  reporterEmail: string | null;
}

function mapReportRow(row: Record<string, unknown>): ListingReport {
  const listing = row.listings as { title: string; type: ListingType } | null;
  const reporter = row.profiles as { display_name: string | null; contact_email: string | null } | null;
  return {
    id: row.id as string,
    reason: row.reason as string,
    status: row.status as "open" | "resolved",
    createdAt: row.created_at as string,
    listingId: row.listing_id as string,
    listingTitle: listing?.title ?? null,
    listingType: listing?.type ?? null,
    reporterName: reporter?.display_name ?? null,
    reporterEmail: reporter?.contact_email ?? null,
  };
}

export async function getOpenReports(): Promise<ListingReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_reports")
    .select("id, reason, status, created_at, listing_id, listings(title, type), profiles(display_name, contact_email)")
    .eq("status", "open")
    .order("created_at");

  if (error) {
    console.error("getOpenReports failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapReportRow);
}
