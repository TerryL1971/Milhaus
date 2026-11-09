// src/lib/milhaus-service.ts
// "Milhaus Service" — Charlie's personal arrival-support offer (apartment
// viewings, car buying and registration, paperwork, general advice),
// promoted by the 30-second pop-up (src/components/service-popup.tsx,
// Charlie's design, 2026-11-09). The keys must match the CHECK on
// service_requests.interests in
// supabase/migrations/20261109210000_service_popup.sql; visitors see
// ServicePopup.interest_<key> from messages/*.json, Charlie sees the
// English labels below in Admin → Messages and the email.

export const SERVICE_INTERESTS = ["car", "apartment", "bureaucracy", "advice"] as const;

export type ServiceInterest = (typeof SERVICE_INTERESTS)[number];

export function isServiceInterest(value: unknown): value is ServiceInterest {
  return typeof value === "string" && (SERVICE_INTERESTS as readonly string[]).includes(value);
}

export const SERVICE_INTEREST_ADMIN_LABELS: Record<ServiceInterest, string> = {
  car: "Car & registration",
  apartment: "Apartment support",
  bureaucracy: "Bureaucracy help",
  advice: "General advice",
};

/** The address Charlie's design shows at the bottom of the pop-up ("Or
 * simply drop us a line directly at …"). The form itself delivers to
 * info@milhaus.de (TRADER.email), which is known to work — whether this
 * mailbox exists yet is for Charlie to confirm (flagged 2026-11-09). */
export const SERVICE_EMAIL = "service@milhaus.de";
