// Strava as a source of rides for the coach.
//
// Reuses the site's existing Strava plumbing (token refresh in
// lib/strava.ts and lib/strava-user.ts) and adds one thing: a wider,
// leaner activity list. The coach needs months of rides but only their
// totals, so this asks for summaries and keeps a handful of fields.
// Nothing here returns GPS, routes or start locations.
//
// Server-only: called from /api/coach/activities, never from the browser.

import type { CoachRide, RideKind } from "./types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/** How far back the coach looks. Fitness needs six weeks to settle; this gives it room. */
export const STRAVA_HISTORY_DAYS = 180;
const PER_PAGE = 200;
const MAX_PAGES = 3;

/** The fields of a Strava summary activity the coach reads. */
export interface StravaSummaryActivity {
  id: number;
  name?: string;
  type?: string;
  sport_type?: string;
  start_date_local?: string;
  moving_time?: number;
  elapsed_time?: number;
  distance?: number;
  total_elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  device_watts?: boolean;
  average_cadence?: number;
  trainer?: boolean;
}

const KIND: Record<string, RideKind> = {
  Ride: "road",
  EBikeRide: "road",
  GravelRide: "gravel",
  MountainBikeRide: "mtb",
  EMountainBikeRide: "mtb",
  VirtualRide: "virtual",
  Handcycle: "road",
  Velomobile: "road",
};

/** Map one Strava activity to a coach ride, or null if it is not a bike ride. Pure. */
export function stravaToRide(a: StravaSummaryActivity): CoachRide | null {
  const kind = KIND[a.sport_type ?? ""] ?? KIND[a.type ?? ""];
  if (!kind) return null;
  if (!a.start_date_local || !a.moving_time || a.moving_time <= 0) return null;
  const ride: CoachRide = {
    id: `strava-${a.id}`,
    source: "strava",
    name: (a.name ?? "Ride").slice(0, 120),
    // Strava's "local" stamp is local wall-clock time with a Z on the end.
    start: a.start_date_local.slice(0, 19),
    kind,
    movingSec: Math.round(a.moving_time),
    elapsedSec: Math.round(a.elapsed_time ?? a.moving_time),
    distanceM: Math.round(a.distance ?? 0),
    climbM: Math.round(a.total_elevation_gain ?? 0),
    indoor: a.trainer === true || kind === "virtual",
  };
  if (a.average_heartrate) ride.avgHr = Math.round(a.average_heartrate);
  if (a.max_heartrate) ride.maxHr = Math.round(a.max_heartrate);
  if (a.average_watts) {
    ride.avgPower = Math.round(a.average_watts);
    if (a.weighted_average_watts) ride.normPower = Math.round(a.weighted_average_watts);
    // Without a power meter Strava estimates watts from speed and weight. Not good enough for load.
    ride.powerMeasured = a.device_watts === true;
  }
  if (a.average_cadence) ride.avgCadence = Math.round(a.average_cadence);
  return ride;
}

/**
 * Fetch the athlete's rides for the last STRAVA_HISTORY_DAYS.
 *
 * `shared` controls caching. The site owner's token is the same for
 * every request, so its responses may sit in Next's data cache for 15
 * minutes like the rest of the site's Strava calls. A connected
 * rider's data must never be cached on the server.
 */
export async function fetchStravaRides(
  accessToken: string,
  options: { shared: boolean; now?: Date }
): Promise<CoachRide[]> {
  const now = options.now ?? new Date();
  // Midnight UTC, so the URL (and the cache key) is stable through the day.
  const after = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000) - STRAVA_HISTORY_DAYS * 86400;
  const rides: CoachRide[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?after=${after}&per_page=${PER_PAGE}&page=${page}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        ...(options.shared
          ? { next: { revalidate: 900, tags: ["strava-coach-activities"] } }
          : { cache: "no-store" as const }),
      }
    );
    if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`);
    const batch = (await res.json()) as StravaSummaryActivity[];
    if (!Array.isArray(batch)) break;
    for (const activity of batch) {
      const ride = stravaToRide(activity);
      if (ride) rides.push(ride);
    }
    if (batch.length < PER_PAGE) break;
  }
  return rides;
}
