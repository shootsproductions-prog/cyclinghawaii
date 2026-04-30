import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getEvent,
  EVENTS,
  daysUntil,
  formatEventDate,
  eventTypeColor,
  type CyclingEvent,
} from "@/lib/events";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event not found — Cycling Hawaii" };
  return {
    title: `${event.title} — Cycling Hawaii`,
    description:
      event.shortDescription ?? event.description.slice(0, 160),
    openGraph: event.coverPhoto
      ? {
          title: event.title,
          description: event.shortDescription,
          images: [{ url: event.coverPhoto }],
        }
      : undefined,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <main>
      <Hero event={event} />
      <QuickFacts event={event} />
      <Description event={event} />
      {event.lauraTake && <LauraCard takeText={event.lauraTake} />}
      {event.schedule && event.schedule.length > 0 && (
        <Schedule items={event.schedule} />
      )}
      <CTA event={event} />
      <BackLink />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero({ event }: { event: CyclingEvent }) {
  const days = daysUntil(event.date);
  const sport = eventTypeColor(event.type);

  return (
    <section className="relative w-full h-[55vh] min-h-[420px] max-h-[640px] overflow-hidden">
      {event.coverPhoto ? (
        <Image
          src={event.coverPhoto}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-strava/30 to-brand/30" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />

      <div className="relative h-full flex items-end pb-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-[860px]">
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${sport.bg} ${sport.text} bg-white`}
            >
              {event.type}
            </span>
            {event.isFundraiser && (
              <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                Fundraiser
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-white/85">
              {event.island} · {formatEventDate(event.date, event.endDate)}
            </span>
            {days >= 0 && (
              <span
                className={`text-[0.7rem] md:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  days === 0
                    ? "bg-strava text-white animate-pulse"
                    : days <= 7
                    ? "bg-strava text-white"
                    : days <= 30
                    ? "bg-white/90 text-strava"
                    : "bg-white/15 text-white/90 backdrop-blur-sm"
                }`}
              >
                {days === 0
                  ? "Today"
                  : days === 1
                  ? "Tomorrow"
                  : `In ${days} days`}
              </span>
            )}
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95]">
            {event.title}
          </h1>
          {event.shortDescription && (
            <p className="text-white/85 text-base md:text-lg max-w-[640px] mt-5 leading-relaxed">
              {event.shortDescription}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ──────────── Quick Facts ────────────────
function QuickFacts({ event }: { event: CyclingEvent }) {
  return (
    <section className="py-12 px-6 bg-bg">
      <div className="max-w-[860px] mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Fact label="When" value={formatEventDate(event.date, event.endDate)} />
            <Fact label="Where" value={event.location} />
            <Fact label="Format" value={event.distances} />
            <Fact label="Cost" value={event.cost ?? "See registration"} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.6rem] uppercase tracking-widest text-mist mb-1">
        {label}
      </div>
      <div className="font-semibold text-text text-sm leading-snug">
        {value}
      </div>
    </div>
  );
}

// ──────────── Description ────────────────
function Description({ event }: { event: CyclingEvent }) {
  return (
    <section className="py-8 px-6 bg-bg">
      <div className="max-w-[720px] mx-auto">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          About
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text mb-5">
          What to expect
        </h2>
        <div className="prose prose-mist max-w-none text-text/85 leading-relaxed text-base space-y-4">
          {event.description.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {event.organizer && (
          <p className="text-mist text-sm italic mt-6">
            Organized by{" "}
            {event.organizerUrl ? (
              <a
                href={event.organizerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-strava hover:underline"
              >
                {event.organizer}
              </a>
            ) : (
              <strong className="text-text">{event.organizer}</strong>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

// ──────────── Laura's Card ────────────────
function LauraCard({ takeText }: { takeText: string }) {
  return (
    <section className="py-12 px-6 bg-bg">
      <div className="max-w-[720px] mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-1">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#fc5200"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-strava uppercase tracking-wider mb-2">
              Laura&apos;s Take
            </div>
            <p className="text-text/85 text-base italic leading-relaxed">
              {takeText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────── Schedule ────────────────
function Schedule({
  items,
}: {
  items: NonNullable<CyclingEvent["schedule"]>;
}) {
  // Group by date
  const byDate = new Map<string, typeof items>();
  for (const item of items) {
    const list = byDate.get(item.date) ?? [];
    list.push(item);
    byDate.set(item.date, list);
  }
  const dates = Array.from(byDate.keys()).sort();

  return (
    <section className="py-12 px-6 bg-surface border-y border-border">
      <div className="max-w-[720px] mx-auto">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Schedule
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text mb-8">
          Day by day
        </h2>

        <div className="space-y-8">
          {dates.map((date) => {
            const day = new Date(date + "T00:00:00");
            const heading = day.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            return (
              <div key={date}>
                <div className="text-xs font-bold uppercase tracking-widest text-strava mb-3">
                  {heading}
                </div>
                <div className="space-y-3">
                  {byDate.get(date)?.map((item, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-start gap-3"
                    >
                      {item.time && (
                        <div className="md:w-32 shrink-0 text-sm font-bold text-text font-[family-name:var(--font-space-grotesk)]">
                          {item.time}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-text text-sm md:text-base">
                          {item.title}
                        </div>
                        {item.location && (
                          <div className="text-mist text-xs uppercase tracking-wider mt-1">
                            {item.location}
                          </div>
                        )}
                        {item.description && (
                          <p className="text-mist text-sm mt-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ──────────── CTAs ────────────────
function CTA({ event }: { event: CyclingEvent }) {
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Get In
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-4xl font-bold tracking-tight text-text mb-6">
          Ready to ride?
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
            >
              Register
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
          )}
          {event.websiteUrl && (
            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-text font-semibold text-sm uppercase tracking-wider hover:border-strava hover:text-strava transition-colors"
            >
              Event Website
            </a>
          )}
          {event.routeUrl && (
            <a
              href={event.routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-text font-semibold text-sm uppercase tracking-wider hover:border-strava hover:text-strava transition-colors"
            >
              Route on Strava
            </a>
          )}
        </div>
        {event.hashtag && (
          <p className="text-mist text-xs italic mt-8">
            Riding it? Tag <strong className="text-strava">{event.hashtag}</strong>{" "}
            on Strava — Laura might write about it.
          </p>
        )}
      </div>
    </section>
  );
}

function BackLink() {
  return (
    <section className="pb-12 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto text-center">
        <Link
          href="/events"
          className="text-strava font-semibold text-xs uppercase tracking-wider hover:text-strava/80"
        >
          ← All events
        </Link>
      </div>
    </section>
  );
}
