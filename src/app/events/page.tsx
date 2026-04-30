import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getUpcomingEvents,
  getPastEvents,
  getFeaturedEvent,
  daysUntil,
  formatEventDate,
  eventTypeColor,
  type CyclingEvent,
} from "@/lib/events";

// ─── Countdown — tier-aware urgency badge ────────────────────────
function CountdownBadge({
  days,
  size = "sm",
}: {
  days: number;
  size?: "sm" | "lg";
}) {
  if (days < 0) return null;

  const text =
    days === 0
      ? "Today"
      : days === 1
      ? "Tomorrow"
      : `In ${days} day${days === 1 ? "" : "s"}`;

  let cls = "";
  if (days === 0) {
    cls =
      "bg-strava text-white animate-pulse shadow-md shadow-strava/30";
  } else if (days <= 7) {
    cls = "bg-strava text-white shadow-sm shadow-strava/20";
  } else if (days <= 30) {
    cls = "bg-strava/15 text-strava";
  } else if (days <= 90) {
    cls = "bg-strava/8 text-strava";
  } else {
    cls = "bg-mist/10 text-mist";
  }

  const sizeCls =
    size === "lg"
      ? "text-xs md:text-sm px-3 py-1.5"
      : "text-[0.6rem] px-2 py-0.5";

  return (
    <span
      className={`font-bold uppercase tracking-wider rounded-full inline-block ${cls} ${sizeCls}`}
    >
      {text.toUpperCase()}
    </span>
  );
}

export const metadata: Metadata = {
  title: "Events — Cycling Hawaii",
  description:
    "The Hawaii cycling events calendar. Curated by Vini, narrated by Laura. Where to ride, when to register, who to roast.",
};

export const revalidate = 3600;

export default function EventsPage() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();
  const featured = getFeaturedEvent();
  const featuredOnly = featured ? [featured] : [];
  const otherUpcoming = upcoming.filter((e) => e.slug !== featured?.slug);

  return (
    <main>
      <Hero hasUpcoming={upcoming.length > 0} />
      {featured && <FeaturedEventCard event={featured} />}
      {otherUpcoming.length > 0 && <UpcomingGrid events={otherUpcoming} />}
      {upcoming.length === 0 && featuredOnly.length === 0 && <EmptyState />}
      {past.length > 0 && <PastArchive events={past} />}
      <SubmitCTA />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ hasUpcoming }: { hasUpcoming: boolean }) {
  return (
    <section className="relative pt-32 pb-12 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          The Calendar
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
          Hawaiʻi Cycling<span className="text-strava"> Events</span>
        </h1>
        <p className="text-mist text-base md:text-lg max-w-[640px] mx-auto leading-relaxed">
          {hasUpcoming
            ? "Where to ride. When to register. Who to roast. Curated by Vini, narrated by Laura."
            : "Calendar's quiet right now. New events drop here as we hear about them."}
        </p>
      </div>
    </section>
  );
}

// ──────────── Featured Event ────────────────
function FeaturedEventCard({ event }: { event: CyclingEvent }) {
  const days = daysUntil(event.date);
  const sport = eventTypeColor(event.type);

  return (
    <section className="py-12 px-6 bg-bg">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            Featured · Coming Up
          </div>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="group block bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow no-underline"
        >
          <div className="grid md:grid-cols-[1.3fr_1fr]">
            {/* Cover image */}
            <div className="relative aspect-[16/10] md:aspect-auto bg-surface overflow-hidden">
              {event.coverPhoto ? (
                <Image
                  src={event.coverPhoto}
                  alt={event.title}
                  fill
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-strava/20 via-brand/15 to-mist/10 flex items-center justify-center p-8">
                  <div className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text/55 text-center leading-tight">
                    {event.title}
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span
                  className={`text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${sport.bg} ${sport.text} bg-white`}
                >
                  {event.type}
                </span>
                {event.isFundraiser && (
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                    Fundraiser
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[0.65rem] uppercase tracking-widest text-mist">
                  {event.island} · {formatEventDate(event.date, event.endDate)}
                </span>
                <CountdownBadge days={days} size="lg" />
              </div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-3 leading-tight">
                {event.title}
              </h2>
              <p className="text-mist text-sm md:text-base leading-relaxed mb-4">
                {event.shortDescription ?? event.description.slice(0, 220)}
              </p>
              <div className="text-xs text-mist mb-4">
                <strong className="text-text">{event.distances}</strong>
              </div>
              {event.lauraTake && (
                <div className="border-t border-border pt-4 mt-auto flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="#fc5200"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-semibold text-strava uppercase tracking-wider mb-1">
                      Laura&apos;s Take
                    </div>
                    <p className="text-mist text-xs italic leading-relaxed line-clamp-3">
                      {event.lauraTake}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
                <span className="text-[0.65rem] text-mist uppercase tracking-widest">
                  View details
                </span>
                <span className="text-strava group-hover:translate-x-1 transition-transform">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ──────────── Upcoming Grid ────────────────
function UpcomingGrid({ events }: { events: CyclingEvent[] }) {
  return (
    <section className="py-12 px-6 bg-bg">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            More Coming Up
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text">
            On the calendar
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event }: { event: CyclingEvent }) {
  const days = daysUntil(event.date);
  const sport = eventTypeColor(event.type);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col no-underline"
    >
      <div className="relative aspect-[16/9] bg-surface overflow-hidden">
        {event.coverPhoto ? (
          <Image
            src={event.coverPhoto}
            alt={event.title}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-strava/15 via-brand/10 to-mist/10 flex items-center justify-center p-6">
            <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-text/50 text-center leading-tight">
              {event.title}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sport.bg} ${sport.text} bg-white`}
          >
            {event.type}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
          {event.island} · {formatEventDate(event.date, event.endDate)}
        </div>
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-lg leading-tight mb-2">
          {event.title}
        </h3>
        {event.shortDescription && (
          <p className="text-mist text-sm leading-relaxed line-clamp-3 mb-3">
            {event.shortDescription}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
          <CountdownBadge days={days} size="sm" />
          <span className="text-strava group-hover:translate-x-1 transition-transform">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ──────────── Past Events ────────────────
function PastArchive({ events }: { events: CyclingEvent[] }) {
  return (
    <section className="py-12 px-6 bg-surface border-t border-border">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Archive
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text">
            Past events
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
          {events.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────── Empty / Submit ────────────────
function EmptyState() {
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[600px] mx-auto text-center">
        <p className="text-mist italic">
          No events on the calendar right now. New ones get added here as they
          come up.
        </p>
      </div>
    </section>
  );
}

function SubmitCTA() {
  return (
    <section className="py-20 px-6 bg-surface border-t border-border">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Got an Event?
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
          Tell Laura about it
        </h2>
        <p className="text-mist text-sm md:text-base mb-6 max-w-[520px] mx-auto leading-relaxed">
          Hosting a Hawaiʻi cycling event? Drop the details — date, location,
          link — and we&apos;ll get it on the calendar. Free to list. No
          podiums in our voice either.
        </p>
        <a
          href="mailto:laura@cyclinghawaii.com?subject=Event%20Submission"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors"
        >
          Email laura@cyclinghawaii.com
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
