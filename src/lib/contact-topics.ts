// src/lib/contact-topics.ts
// The "What do you need help with?" choices on /contact (Charlie's ask,
// 2026-11-09: a Contact link in the header "that allows people to
// contact in the beginning if they need help with something specific").
// The keys must match the CHECK on contact_messages.topic in
// supabase/migrations/20261109180000_add_popup_ad_and_contact.sql;
// visitors see ContactPage.topic_<key> from messages/*.json, Charlie
// sees the English labels below in Admin → Messages and the email.

export const CONTACT_TOPICS = ["listing", "finding", "business", "advertising", "payment", "report", "other"] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export function isContactTopic(value: unknown): value is ContactTopic {
  return typeof value === "string" && (CONTACT_TOPICS as readonly string[]).includes(value);
}

export const CONTACT_TOPIC_ADMIN_LABELS: Record<ContactTopic, string> = {
  listing: "Help with their listing",
  finding: "Finding a home, car or service",
  business: "Their business in the Services directory",
  advertising: "Advertising",
  payment: "A payment or invoice",
  report: "Reporting a problem or a listing",
  other: "Something else",
};
