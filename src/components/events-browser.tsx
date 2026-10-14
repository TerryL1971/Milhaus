// src/components/events-browser.tsx
// The /events page's calendar + list — Charlie's ask ("an Event
// kalender"). A plain month-grid built from date math, not an external
// calendar library: this app otherwise has no date-picker dependency to
// lean on, and a real calendar UI library tends to assume more styling
// control (and a heavier bundle) than one month-grid needs here. Clicking
// a date with events filters the list below to that day; clicking it
// again (or "Show all") clears the filter. A keyword box searches title/
// organizer/city same as every other category's grid.

"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/lib/events";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EventsBrowser({ events }: { events: Event[] }) {
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventDatesByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const key = toDateKey(new Date(event.startsAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (selectedDate && toDateKey(new Date(event.startsAt)) !== selectedDate) return false;
      if (!q) return true;
      return [event.title, event.organizerName, event.city].some((field) => field.toLowerCase().includes(q));
    });
  }, [events, query, selectedDate]);

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
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events…"
            className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2.5 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
          />

          {filtered.length === 0 ? (
            <p className="mt-5 text-ink-soft">
              {events.length === 0 ? "No events scheduled right now." : "Nothing matches that."}
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
