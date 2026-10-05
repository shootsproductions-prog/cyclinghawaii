import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getClubData } from "@/lib/club";
import {
  getAllIslandConditions,
  type IslandConditions,
} from "@/lib/conditions";
import { getStravaData } from "@/lib/strava";
import { generateBlogEntries, type BlogEntry } from "@/lib/blog";
import { computeHonorRoll } from "@/lib/honor-roll";
import { getDispatch, type DispatchRoundup } from "@/lib/laura-dispatch";

// Aloha Gravel · Nov 7 2026. The AlohaGravelHero section auto-hides once
// this date passes; bump the ISO when next year's date is set.
const ALOHA_GRAVEL_DATE = "2026-11-07";

function daysUntilIso(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export const metadata: Metadata = {
  title: "Cycling Hawaii — Vini rides, Laura writes",
  description:
    "A cycling journal from Hawai'i: ride-by-ride dispatches from Vini, roasted by Laura, with events and conditions across all four islands.",
};

export const revalidate = 900;

export default async function Home() {
  // Three independent fetches, all cached. Any one failing degrades
  // gracefully: the dependent section just doesn't render.
  const [club, islandConditions, stravaData] = await Promise.all([
    getClubData(),
    getAllIslandConditions(),
    getStravaData().catch(() => null),
  ]);

  // Blog entries — one per Vini ride, each with Laura's roast. Reconciles
  // the Strava feed with cached entries in Vercel Blob, generating any
  // missing ones on demand. The full list stays in scope so The Feed
  // can render the N most recent, not just the latest.
  let blogEntries: BlogEntry[] = [];
  if (stravaData?.featured) {
    try {
      blogEntries = await generateBlogEntries(
        stravaData.featured,
        stravaData.rides
      );
    } catch {
      // Degrade gracefully — The Feed hides if blogEntries stays empty.
    }
  }

  // Laura's Dispatch — bi-weekly editorial, cached in Vercel Blob and
  // regenerated at most every ~14 days. The prompt still references club
  // activity in a follow-up commit it gets rewritten to the solo
  // narrative. In the meantime the stored copy serves either way.
  const honorRoll = club
    ? computeHonorRoll(club.activities, club.members)
    : [];
  const roundup = club
    ? await getDispatch(club.activities, honorRoll).catch(() => null)
    : null;

  return (
    <main>
      <Hero />
      {islandConditions.length > 0 && (
        <RideToday conditions={islandConditions} />
      )}
      <AlohaGravelHero />
      {blogEntries.length > 0 && (
        <RideFeed entries={blogEntries.slice(0, 6)} />
      )}
      {roundup && <LauraDispatch roundup={roundup} />}
    </main>
  );
}

// ─────────────────── Hero ───────────────────
function Hero() {
  return (
    <section className="pt-24 md:pt-28 pb-12 md:pb-16 px-6 md:px-10 lg:px-16 bg-bg">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative aspect-[16/8] md:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-[0_20px_60px_-18px_rgba(0,0,0,0.22)] mb-10 md:mb-14">
          <Image
            src="/club/hero.jpg"
            alt="Vini on a Maui gravel road at golden hour"
            fill
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="max-w-[820px]">
          <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
            Hawai&apos;i · One Rider · Four Islands
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
            Just<span className="text-strava"> Ride.</span>
          </h1>
          <p className="text-mist text-base md:text-lg leading-relaxed italic max-w-[620px] mb-7">
            Riding every corner of these islands, chasing light and getting
            roasted by Laura. Welcome to the feed.
          </p>
          {/* Points at the club URL as a safe fallback until Vini confirms
              his personal athlete-profile URL. Once we have that, swap this
              href to https://www.strava.com/athletes/{id} so "Follow" means
              follow the rider, not join the club. */}
          <a
            href="https://www.strava.com/clubs/737679"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
          >
            Follow on Strava
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
      </div>
    </section>
  );
}

// ─── Ride Today ────────────────────────────────────────
// The top-of-page decision panel. For each of the four main islands
// we surface temp, wind (with a rotating arrow), sky, and a single
// Laura-voice line telling you what to do about it. Free Open-Meteo
// data, 30-min ISR, no API key. Individual island failures degrade
// gracefully; a card only renders if we got a real reading.
function RideToday({ conditions }: { conditions: IslandConditions[] }) {
  return (
    <section className="px-6 md:px-10 lg:px-16 pt-2 pb-8 md:pb-12 bg-bg">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-5 md:mb-6 flex items-baseline justify-between gap-4 flex-wrap">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava">
            Ride today
          </div>
          <div className="text-[0.65rem] font-medium tracking-widest uppercase text-mist/70">
            Conditions across the islands · Refreshes every 30 min
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {conditions.map((c) => (
            <IslandCard key={c.island} conditions={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function IslandCard({ conditions }: { conditions: IslandConditions }) {
  const c = conditions;
  // Arrow points downwind — where a tailwind would take you. Open-Meteo
  // reports direction wind is coming FROM, so we add 180°.
  const arrowRotation = (c.windDeg + 180) % 360;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5 flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[0.65rem] md:text-xs font-bold uppercase tracking-widest text-text">
          {c.label}
        </div>
        <div className="text-[0.6rem] uppercase tracking-widest text-mist">
          {c.hub}
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-2">
        <div className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-5xl font-bold text-text leading-none">
          {c.tempF}
          <span className="text-2xl md:text-3xl text-mist">°</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-strava"
            style={{ transform: `rotate(${arrowRotation}deg)` }}
            aria-hidden
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <div className="text-xs md:text-sm text-text font-semibold">
            {c.windMph}
            <span className="text-mist font-normal"> mph {c.windDir}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-mist mb-3">{c.weatherText}</div>

      <div className="mt-auto pt-3 border-t border-border">
        <p className="text-xs md:text-sm text-text italic leading-snug">
          {c.prescription}
        </p>
      </div>
    </div>
  );
}

// ─── Aloha Gravel announcement ─────────────────────────
// Full-section hero for the Nov 7 event. Auto-hides once the date
// passes. Big date, description, register CTA (movemint) + info CTA
// (alohagravel.com). Countdown badge changes color inside 7 days out.
function AlohaGravelHero() {
  const days = daysUntilIso(ALOHA_GRAVEL_DATE);
  if (days < 0) return null;
  const countdown =
    days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
  const urgent = days <= 7;

  return (
    <section className="px-6 md:px-10 lg:px-16 pb-16 md:pb-20 bg-bg">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-strava/30 bg-gradient-to-br from-strava/10 via-strava/5 to-transparent p-6 md:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-strava/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-brand/15 blur-3xl"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 md:gap-10 items-center">
            <div className="text-center md:text-left">
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-strava mb-1">
                Nov
              </div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-7xl md:text-8xl font-bold tracking-tighter text-text leading-none">
                07
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-mist mt-1">
                2026 · Maui
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-strava">
                  The event
                </span>
                <span
                  className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    urgent
                      ? "bg-strava text-white"
                      : "bg-strava/15 text-strava"
                  }`}
                >
                  {countdown}
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl font-bold tracking-tight text-text leading-[1.02] mb-4">
                Aloha<span className="text-strava"> Gravel.</span>
              </h2>
              <p className="text-mist text-base md:text-lg leading-relaxed max-w-[560px] mb-6">
                Lap-based gravel on Maui. Ride as many 9-mile loops as your
                legs allow. Fundraiser, no drop, all welcome.
              </p>
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <a
                  href="https://www.movemint.cc/events/aloha_gravel_2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
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
                <a
                  href="https://alohagravel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-strava/40 text-strava font-semibold text-sm uppercase tracking-wider hover:bg-strava/10 transition-colors"
                >
                  Full event info
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── The Feed (ride cards) ─────────────────────────────
// Vini's recent rides as a scannable card grid. Each card is a condensed
// view of a Laura-written blog entry — title, 2-line preview, date and
// key stats, and a thumbnail (ride photo if Strava has one, else the map
// polyline SVG we build from the ride's track).
function RideFeed({ entries }: { entries: BlogEntry[] }) {
  return (
    <section className="py-16 md:py-20 px-6 md:px-10 lg:px-16 bg-bg border-t border-border">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-10 md:mb-12 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-2">
              The Feed
            </div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
              Latest rides, roasted.
            </h2>
          </div>
          <Link
            href="/rides"
            className="text-xs md:text-sm font-semibold text-strava hover:text-strava/80 uppercase tracking-wider no-underline whitespace-nowrap"
          >
            See every ride →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {entries.map((e) => (
            <FeedCard key={e.rideId} entry={e} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeedCard({ entry }: { entry: BlogEntry }) {
  const firstPara = entry.body.split(/\n\n/)[0] ?? entry.body;
  const preview =
    firstPara.length > 170
      ? firstPara.slice(0, 167).replace(/\s+\S*$/, "") + "…"
      : firstPara;

  // Prefer a real ride photo; fall back to the map polyline SVG. mapImageUrl
  // is always populated (even if just the gray SVG placeholder).
  const heroImage = entry.photoUrl || entry.mapImageUrl;

  return (
    <Link
      href={`/rides#${entry.rideId}`}
      className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow no-underline"
    >
      {heroImage && (
        <div className="relative aspect-[16/9] bg-surface overflow-hidden">
          {/* <img> instead of next/image: mapImageUrl is a data: URI SVG
              and photoUrl is a Strava CDN URL that rotates — not worth
              the next.config remotePatterns churn. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={entry.rideName}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 p-5 md:p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-3 text-[0.6rem] uppercase tracking-widest text-mist font-semibold">
          <span>{entry.date}</span>
          <span className="opacity-50">·</span>
          <span>{entry.distance} mi</span>
          <span className="opacity-50">·</span>
          <span>{entry.elevation} ft</span>
        </div>

        <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg md:text-xl font-bold text-text leading-tight mb-2 group-hover:text-strava transition-colors">
          {entry.title}
        </h3>

        <div className="text-[0.65rem] uppercase tracking-widest text-mist/80 mb-3 truncate">
          {entry.rideName}
        </div>

        {preview && (
          <p className="text-mist text-sm leading-relaxed italic flex-1">
            {preview}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-border text-xs font-semibold uppercase tracking-wider text-strava inline-flex items-center gap-2">
          Read Laura&apos;s roast
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            className="group-hover:translate-x-0.5 transition-transform"
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─────────────── Laura's Dispatch ──────────────────
// Laura's bi-weekly editorial. The cached body in Vercel Blob is served
// as-is until the next regeneration (~14 days). The prompt in
// lib/laura-dispatch.ts still references club activity; a follow-up
// commit will rewrite it for the solo narrative so the next Dispatch
// reads as Laura reflecting on Vini's two weeks of riding.
function LauraDispatch({ roundup }: { roundup: DispatchRoundup }) {
  const generated = new Date(roundup.generatedAt);
  const generatedStr = generated.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <section className="py-20 px-6 bg-bg border-t border-border">
      <div className="max-w-[760px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            From Laura · The Dispatch
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
            {roundup.title}
          </h2>
          <p className="text-mist text-xs uppercase tracking-widest">
            Posted {generatedStr}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="text-text text-base md:text-lg leading-relaxed space-y-5 whitespace-pre-line">
            {roundup.body.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="border-t border-border pt-5 mt-7 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-strava/10 flex items-center justify-center shrink-0">
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
            <div className="text-xs text-mist italic">
              <strong className="text-text not-italic">
                Laura Ryder
              </strong>{" "}
              · Chief Reality Officer · cyclinghawaii.com
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
