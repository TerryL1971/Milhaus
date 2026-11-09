// src/components/contact-form.tsx
// The form on /contact (Charlie's ask, 2026-11-09). A client component
// only so it can say "Sending…", then thank the visitor on the page —
// or show what's wrong — without a pop-up or an error screen. The work
// itself is the server action in src/app/[locale]/contact/actions.ts.

"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { sendContactMessage, type ContactResult } from "@/app/[locale]/contact/actions";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/contact-topics";

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none";

export function ContactForm({
  defaultName,
  defaultEmail,
  defaultTopic,
  page,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultTopic: ContactTopic | null;
  /** The page they came from, when a link passed it (?from=). */
  page: string | null;
}) {
  const t = useTranslations("ContactPage");
  const [result, action, pending] = useActionState<ContactResult, FormData>(sendContactMessage, null);

  if (result?.ok) {
    return (
      <div role="status" className="rounded-md border border-olive/40 bg-olive/10 p-6">
        <p className="mb-1 font-display text-xl font-semibold text-ink">{t("sentHeading")}</p>
        <p className="text-charcoal">{t("sentBody")}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
    >
      <div>
        <label htmlFor="topic" className={labelClass}>
          {t("topic")}
        </label>
        <select id="topic" name="topic" required defaultValue={defaultTopic ?? ""} className={inputClass}>
          <option value="" disabled>
            {t("topicChoose")}
          </option>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {t(`topic_${topic}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={200}
            autoComplete="name"
            defaultValue={defaultName}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            defaultValue={defaultEmail}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          placeholder={t("messagePlaceholder")}
          className={inputClass}
        />
      </div>
      {page && <input type="hidden" name="page" value={page} />}
      {/* Honeypot — hidden from people, see actions.ts. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {result && !result.ok && (
        <p role="alert" className="rounded-md border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
          {result.error}
        </p>
      )}
      <p className="text-xs text-ink-soft">{t("privacyNote")}</p>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:opacity-60"
      >
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
