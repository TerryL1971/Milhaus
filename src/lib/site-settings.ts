// src/lib/site-settings.ts
// The free-posting promotion Charlie runs from Admin → Promotion (one
// row in site_settings). Started as a single "free until" launch-promo
// date (supabase/migrations/20261019090000_add_site_settings_free_until.sql);
// since 2026-11-11 (Terry's ask, so Charlie can run e.g. "free car ads
// all July") it also has an on/off switch, a start date, the categories
// it covers and the banner text
// (supabase/migrations/20261111120000_promotion_settings.sql).
//
// Read with select("*") so the site keeps working on a database where
// that second migration hasn't run yet: the new fields just come back
// missing and the old "free until" behaviour applies.

import type { PriceableType } from "@/lib/listing-prices";
import { createClient } from "@/lib/supabase/server";

/** The categories Charlie can pick, in the order the admin form shows them. */
export const PROMO_TYPES = ["rental", "rental_sale", "car", "business"] as const satisfies readonly PriceableType[];

export interface Promotion {
  enabled: boolean;
  startsAt: Date | null;
  /** The moment it stops (stored in free_until). */
  endsAt: Date | null;
  /** null = every category. */
  types: PriceableType[] | null;
  showBanner: boolean;
  bannerEn: string | null;
  bannerDe: string | null;
  /** Switched on and between its dates right now. Computed here rather
   * than in a component: Date.now() isn't allowed in a render body, and
   * every caller needs the same answer. */
  isActive: boolean;
  /** Switched on but its start date hasn't come yet. */
  isScheduled: boolean;
  /** While running with a last day: how many free days are left,
   * counting today (German calendar days) — 1 on the last day. null if
   * not running or it has no end date. Shown as "Free for 12 days" on
   * the posting page (Terry, 2026-11-11). */
  freeDaysLeft: number | null;
}

const NO_PROMOTION: Promotion = {
  enabled: false,
  startsAt: null,
  endsAt: null,
  types: null,
  showBanner: true,
  bannerEn: null,
  bannerDe: null,
  isActive: false,
  isScheduled: false,
  freeDaysLeft: null,
};

export async function getPromotion(): Promise<Promotion> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
  if (error || !data) return NO_PROMOTION;

  const endsAt = data.free_until ? new Date(data.free_until) : null;
  const startsAt = data.promo_starts_at ? new Date(data.promo_starts_at) : null;
  // Before the 2026-11-11 migration there's no switch: a date means on.
  const enabled = typeof data.promo_enabled === "boolean" ? data.promo_enabled : Boolean(endsAt);
  const now = Date.now();
  const started = !startsAt || startsAt.getTime() <= now;
  const notEnded = !endsAt || endsAt.getTime() > now;
  const isActive = enabled && started && notEnded;

  return {
    enabled,
    startsAt,
    endsAt,
    types: Array.isArray(data.promo_types) ? (data.promo_types as PriceableType[]) : null,
    showBanner: data.promo_banner !== false,
    bannerEn: data.promo_banner_en || null,
    bannerDe: data.promo_banner_de || null,
    isActive,
    isScheduled: enabled && !started && notEnded,
    freeDaysLeft:
      isActive && endsAt ? daysBetween(berlinDay(new Date(now)), berlinDay(new Date(endsAt.getTime() - 1))) + 1 : null,
  };
}

/** Whether a running promotion makes this category free to post. */
export function promotionCovers(promotion: Promotion, type: PriceableType): boolean {
  return promotion.isActive && (promotion.types === null || promotion.types.includes(type));
}

// ---------- Dates in German time ----------
// Charlie picks whole days ("1 July" to "31 July"). They mean days in
// Germany, whatever time zone the server runs in (Vercel's is UTC), so
// a promotion starts at midnight Berlin time on its first day and stops
// at midnight Berlin time after its last day. The first version used a
// date-and-time box read in the server's time zone, so "13:30" saved as
// 14:30 German time.

function berlinOffsetMs(utcMs: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Berlin",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Midnight at the start of a "YYYY-MM-DD" day in Germany. */
export function berlinDayStart(day: string, addDays = 0): Date {
  const [year, month, date] = day.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, date + addDays);
  const first = guess - berlinOffsetMs(guess);
  return new Date(guess - berlinOffsetMs(first));
}

/** The "YYYY-MM-DD" day in Germany that a moment falls on. */
export function berlinDay(moment: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(moment);
}

/** Whole days from one "YYYY-MM-DD" to another. */
function daysBetween(from: string, to: string): number {
  const utc = (day: string) => {
    const [year, month, date] = day.split("-").map(Number);
    return Date.UTC(year, month - 1, date);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** e.g. "31 July 2027", for Charlie's status line. */
export function berlinLongDate(moment: Date): string {
  return moment.toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "Europe/Berlin" });
}
