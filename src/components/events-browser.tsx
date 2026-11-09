// src/components/events-browser.tsx
// The /events page's calendar + list — Charlie's ask ("an Event
// kalender"). A plain month-grid built from date math, not an external
// calendar library: this app otherwise has no date-picker dependency to
// lean on, and a real calendar UI library tends to assume more styling
// control (and a heavier bundle) than one month-grid needs here. Clicking
// a date with events filters the list below to that day; clicking it
// again (or "Show all") clears the filter. A keyword box searches title/
// organizer/city same as every other category's grid — via the shared
// matchesEvent (word-boundary matching, see lib/search-matching.ts), not
// its own naive substring check, and initialQuery/a Clear button for the
// same reasons every other grid has them (see cars-grid.tsx/filter-bar.tsx).
//
// Filters (Terry, 2026-11-04 — Charlie hadn't asked for specific ones, so
// these use only what an event already has): When (upcoming by default,
// so finished events stop crowding the list; this week / this weekend /
// this month; or past), Where (the event's base, else its city) and
// Organizer (shown even with a single choice, so Charlie can always see
// what's filterable). They apply as soon as they're ticked — events are all
// loaded client-side, so there's no Apply step to wait on. Clicking a
// calendar day overrides When, so a past day can still be looked at.
//
// Type (Charlie's ask, 2026-11-09: "sports, cultural, fests etc") filters
// by the category Charlie picks in Admin → Events. Only categories that
// at least one event uses are offered, so there's never an empty choice;
// events without a category only show while no Type is ticked.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/event-card";
import { FilterCheckboxList } from "@/components/filter-checkbox-list";
import { FilterCluster } from "@/components/filter-cluster";
import { SearchNoResultsAlert } from "@/components/search-no-results-alert";
import { EVENT_CATEGORIES, type Event, type EventCategory } from "@/lib/events";
import { matchesEvent } from "@/lib/search-matching";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

type When = "upcoming" | "week" | "weekend" | "month" | "past";

const WHEN_OPTIONS: { value: When; label: string }[] = [
  { value: "upcoming", label: "All upcoming" },
  { value: "week", label: "Next 7 days" },
  { value: "weekend", label: "This weekend" },
  { value: "month", label: "This month" },
  { value: "past", label: "Past events" },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Does the event overlap [from, to)? An event without an end time is
 * treated as lasting its start day. */
function overlaps(event: Event, from: Date, to: Date): boolean {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(startOfDay(start).getTime() + 24 * 60 * 60 * 1000);
  return start < to && end > from;
}

function matchesWhen(event: Event, when: When, now: Date): boolean {
  const today = startOfDay(now);
  const day = 24 * 60 * 60 * 1000;
  const farFuture = new Date(8640000000000000);
  switch (when) {
    case "upcoming":
      return overlaps(event, now, farFuture);
    case "past":
      return !overlaps(event, now, farFuture);
    case "week":
      return overlaps(event, now, new Date(today.getTime() + 8 * day));
    case "weekend": {
      // Saturday–Sunday of this week; on a Sunday that's today.
      const saturday = new Date(today.getTime() + (today.getDay() === 0 ? -1 : 6 - today.getDay()) * day);
      return overlaps(event, now > saturday ? now : saturday, new Date(saturday.getTime() + 2 * day));
    }
    case "month":
      return overlaps(event, now, new Date(today.getFullYear(), today.getMonth() + 1, 1));
  }
}

function eventArea(event: Event): string {
  return event.base ?? event.city;
}

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EventsBrowser({
  events,
  initialQuery = "",
}: {
  events: Event[];
  /** Carried over from the homepage's unified search bar (?q=) — see
   * cars-grid.tsx's own prop comment and search/page.tsx's redirect. */
  initialQuery?: string;
}) {
  const tCategory = useTranslations("EventCategories");
  const [query, setQuery] = useState(initialQuery);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [when, setWhen] = useState<When>("upcoming");
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [organizers, setOrganizers] = useState<string[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  function handleQueryChange(value: string) {
    setQuery(value);
    setAlertDismissed(false);
  }

  function handleClear() {
    setQuery("");
    setSelectedDate(null);
    setWhen("upcoming");
    setCategories([]);
    setAreas([]);
    setOrganizers([]);
    setAlertDismissed(false);
  }

  // In EVENT_CATEGORIES order (not alphabetical, which would change with
  // the language), limited to categories some event actually has.
  const categoryOptions = useMemo(() => {
    const used = new Set(events.map((e) => e.category).filter(Boolean));
    return EVENT_CATEGORIES.filter((category) => used.has(category));
  }, [events]);
  const areaOptions = useMemo(() => [...new Set(events.map(eventArea))].sort(), [events]);
  const organizerOptions = useMemo(() => [...new Set(events.map((e) => e.organizerName))].sort(), [events]);

  // Search, Where and Organizer — everything except When, which the
  // calendar shouldn't apply (a dot on a past day is still useful).
  const matchingEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (categories.length > 0 && !(event.category && categories.includes(event.category))) return false;
      if (areas.length > 0 && !areas.includes(eventArea(event))) return false;
      if (organizers.length > 0 && !organizers.includes(event.organizerName)) return false;
      return !q || matchesEvent(event, q);
    });
  }, [events, query, categories, areas, organizers]);

  const eventDatesByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of matchingEvents) {
      const key = toDateKey(new Date(event.startsAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [matchingEvents]);

  const filtered = useMemo(() => {
    const now = new Date();
    const list = matchingEvents.filter((event) =>
      selectedDate ? toDateKey(new Date(event.startsAt)) === selectedDate : matchesWhen(event, when, now),
    );
    // Past events read newest first; everything else soonest first.
    return when === "past" && !selectedDate ? list.reverse() : list;
  }, [matchingEvents, selectedDate, when]);

  const noInventory = events.length === 0;
  const noResults = !noInventory && filtered.length === 0;
  const onlyWhenHidesThem = noResults && !selectedDate && when !== "past" && matchingEvents.length > 0;

  // Calendar grid: every day from the Sunday on/before the 1st through
  // the Saturday on/after the last day of the month — always a whole
  // number of weeks, no partial row.
  const gridDays = useMemo(() => {
    const firstOfMonth = monthCursor;
    const lastOfMonth = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const days: Date[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [monthCursor]);

  function changeMonth(delta: number) {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function toggleDate(key: string) {
    setSelectedDate((current) => (current === key ? null : key));
    setAlertDismissed(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row">
        <div className="w-full max-w-[360px] rounded-md border border-canvas-deep bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-md border border-canvas-deep px-2.5 py-1 text-sm text-ink-soft hover:border-olive hover:text-olive-deep"
            >
              ←
            </button>
            <p className="font-display text-sm font-semibold text-ink">{MONTH_FORMATTER.format(monthCursor)}</p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-md border border-canvas-deep px-2.5 py-1 text-sm text-ink-soft hover:border-olive hover:text-olive-deep"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="font-mono text-[0.64rem] uppercase tracking-wider text-ink-soft/60">
                {label}
              </span>
            ))}
            {gridDays.map((day) => {
              const key = toDateKey(day);
              const count = eventDatesByKey.get(key) ?? 0;
              const inMonth = day.getMonth() === monthCursor.getMonth();
              const isSelected = selectedDate === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={count === 0}
                  onClick={() => toggleDate(key)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-md text-[0.78rem] transition-colors ${
                    isSelected
                      ? "bg-brass text-paper"
                      : count > 0
                        ? "bg-olive/15 text-olive-deep hover:bg-olive/25"
                        : inMonth
                          ? "text-charcoal/70"
                          : "text-charcoal/25"
                  } ${count === 0 ? "cursor-default" : "cursor-pointer"}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mt-3 text-xs font-semibold text-ink-soft hover:text-rust"
            >
              Show all dates
            </button>
          )}
        </div>

        <div className="flex-1">
          {noResults && !onlyWhenHidesThem && !alertDismissed && (
            <SearchNoResultsAlert message="Nothing matches that." onDismiss={() => setAlertDismissed(true)} />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search events…"
              className="min-w-[180px] flex-1 rounded-md border border-canvas-deep bg-paper px-3 py-2.5 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
            />
            <FilterCluster label="When" icon="📅" badge={when !== "upcoming" ? 1 : undefined}>
              <div className="flex flex-col gap-1.5">
                {WHEN_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-charcoal">
                    <input
                      type="radio"
                      name="events-when"
                      checked={when === option.value}
                      onChange={() => {
                        setWhen(option.value);
                        setSelectedDate(null);
                        setAlertDismissed(false);
                      }}
                      className="h-4 w-4 flex-shrink-0 border-canvas-deep text-olive focus:ring-olive"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </FilterCluster>
            {categoryOptions.length > 0 && (
              <FilterCluster label="Type" icon="🏷️" badge={categories.length || undefined}>
                <FilterCheckboxList
                  options={categoryOptions.map((category: EventCategory) => ({
                    value: category,
                    label: tCategory(category),
                  }))}
                  selected={categories}
                  onToggle={(value) => {
                    setCategories((prev) => toggleIn(prev, value));
                    setAlertDismissed(false);
                  }}
                />
              </FilterCluster>
            )}
            {areaOptions.length > 0 && (
              <FilterCluster label="Where" icon="📍" badge={areas.length || undefined}>
                <FilterCheckboxList
                  options={areaOptions.map((area) => ({ value: area, label: area }))}
                  selected={areas}
                  onToggle={(value) => {
                    setAreas((prev) => toggleIn(prev, value));
                    setAlertDismissed(false);
                  }}
                />
              </FilterCluster>
            )}
            {organizerOptions.length > 0 && (
              <FilterCluster label="Organizer" icon="🎟️" badge={organizers.length || undefined}>
                <FilterCheckboxList
                  options={organizerOptions.map((name) => ({ value: name, label: name }))}
                  selected={organizers}
                  onToggle={(value) => {
                    setOrganizers((prev) => toggleIn(prev, value));
                    setAlertDismissed(false);
                  }}
                />
              </FilterCluster>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="whitespace-nowrap rounded-md border border-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-rust hover:text-rust"
            >
              Clear
            </button>
          </div>

          {noInventory ? (
            <p className="mt-5 text-ink-soft">No events scheduled right now.</p>
          ) : onlyWhenHidesThem ? (
            <p className="mt-5 text-ink-soft">
              {when === "upcoming" ? "No upcoming events right now." : "Nothing in that time frame."}{" "}
              <button
                type="button"
                onClick={() => setWhen(when === "upcoming" ? "past" : "upcoming")}
                className="font-semibold text-olive-deep hover:underline"
              >
                {when === "upcoming" ? "See past events →" : "See all upcoming →"}
              </button>
            </p>
          ) : (
            !noResults && (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
