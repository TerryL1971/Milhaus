// src/components/event-card.tsx
// A single tile in the /events calendar/list — cover photo up top
// (falling back to a gradient, same pattern every other card type uses
// for a missing photo), a date badge, title, organizer, and city/base.

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NoPhotoPlaceholder } from "@/components/no-photo-placeholder";
import type { Event } from "@/lib/events";

const PHOTO_GRADIENT = "linear-gradient(135deg,#B9C4A3,#6B7353)";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function EventCard({ event }: { event: Event }) {
  const t = useTranslations("EventCard");
  const startsAt = new Date(event.startsAt);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
    >
      <div className="relative">
        {event.coverImageUrl ? (
          // object-contain, not object-cover — same reasoning as the
          // detail page's cover (src/app/[locale]/events/[id]/page.tsx):
          // event covers are often flyers, not photos that tolerate a crop.
          <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-canvas-deep">
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="relative aspect-[16/9] w-full">
            <NoPhotoPlaceholder gradient={PHOTO_GRADIENT} label={t("noPhotoYet")} />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
          {dateFormatter.format(startsAt)}
        </span>
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <p className="mb-1 truncate text-[0.95rem] font-medium text-charcoal">{event.title}</p>
        <p className="mb-2 text-[0.86rem] text-ink-soft">{timeFormatter.format(startsAt)}</p>
        <div className="flex flex-wrap gap-3 text-[0.76rem] text-charcoal/80">
          <span>{event.organizerName}</span>
          <span>
            {event.city}
            {event.base ? ` · ${event.base}` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
