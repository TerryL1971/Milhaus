// src/app/[locale]/contact/page.tsx
// Contact page — Charlie's ask (2026-11-09): a Contact link in the
// header "that allows people to contact in the beginning if they need
// help with something specific". Until then the only contact was a
// mailto: link in the footer. Terry chose a form with a "What do you
// need help with?" topic, so each message arrives already sorted; it's
// emailed to info@milhaus.de and kept in Admin → Messages. Email and
// phone are listed beside it for anyone who'd rather not use a form.
//
// Links can pre-pick a topic and say where they came from:
// /contact?topic=advertising&from=/advertise

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { isContactTopic } from "@/lib/contact-topics";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { TRADER } from "@/lib/withdrawal-notice";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ContactPage");
  return pageMetadata({
    locale: await getLocale(),
    path: "/contact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

type SearchParams = Promise<{ topic?: string; from?: string }>;

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("ContactPage");
  const { topic, from } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("display_name, contact_email").eq("id", user.id).maybeSingle()
    : { data: null };

  // Only a path on this site, never a full URL someone could stuff in.
  const page = from && from.startsWith("/") && !from.startsWith("//") ? from.slice(0, 500) : null;

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto grid max-w-[1000px] gap-10 px-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="mb-3 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
          <p className="mb-8 max-w-[60ch] text-ink-soft">{t("intro")}</p>
          <ContactForm
            defaultName={(profile?.display_name as string | null) ?? ""}
            defaultEmail={(profile?.contact_email as string | null) ?? user?.email ?? ""}
            defaultTopic={isContactTopic(topic) ? topic : null}
            page={page}
          />
        </div>

        <aside className="h-fit rounded-md border border-canvas-deep bg-paper/60 p-5 text-sm lg:mt-[8rem]">
          <p className="mb-3 font-display text-lg font-semibold text-ink">{t("directHeading")}</p>
          <p className="mb-1 text-ink-soft">{t("emailLabel")}</p>
          <a href={`mailto:${TRADER.email}`} className="mb-4 block font-semibold text-olive-deep hover:underline">
            {TRADER.email}
          </a>
          <p className="mb-1 text-ink-soft">{t("phoneLabel")}</p>
          <a href={`tel:+49${TRADER.phone.replace(/\s/g, "").replace(/^0/, "")}`} className="mb-4 block font-semibold text-olive-deep hover:underline">
            {TRADER.phone}
          </a>
          <p className="text-xs text-ink-soft">{t("replyTime")}</p>
        </aside>
      </div>
    </main>
  );
}
