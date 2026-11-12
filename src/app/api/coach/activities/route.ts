// Strava rides for the coach. Private: see lib/coach/access.ts for who
// gets what. The response holds ride totals only (no GPS) and is never
// cached by browsers or CDNs.

import { NextResponse } from "next/server";
import { identify } from "@/lib/coach/access";
import { fetchStravaRides } from "@/lib/coach/strava";
import { getRiderByAthleteId, saveRider, type Rider } from "@/lib/rider-store";
import { getAccessToken } from "@/lib/strava";
import { refreshUserToken } from "@/lib/strava-user";

export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" };

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE });
}

/** A connected rider's access token, refreshed and re-saved if it has expired. */
async function riderToken(rider: Rider): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (rider.tokenExpiresAt > now + 60) return rider.accessToken;
  const refreshed = await refreshUserToken(rider.refreshToken);
  await saveRider({
    ...rider,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    tokenExpiresAt: refreshed.expires_at,
  });
  return refreshed.access_token;
}

export async function POST(request: Request) {
  let password: unknown;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    // An empty body is fine: the caller may be relying on their session.
  }

  const who = await identify(password);
  if (!who) return reply({ error: "sign-in" }, 401);

  try {
    if (who.kind === "owner") {
      if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET || !process.env.STRAVA_REFRESH_TOKEN) {
        return reply({ error: "not-configured" }, 503);
      }
      const rides = await fetchStravaRides(await getAccessToken(), { shared: true });
      return reply({ who: "owner", rides });
    }

    if (who.kind === "rider") {
      const rider = await getRiderByAthleteId(who.athleteId);
      if (!rider) return reply({ error: "not-connected" }, 404);
      const rides = await fetchStravaRides(await riderToken(rider), { shared: false });
      return reply({ who: "rider", rides });
    }

    // Signed in, but not with Strava: there are no rides to fetch.
    return reply({ error: "no-strava" }, 404);
  } catch (error) {
    console.error("[coach] Strava fetch failed:", error);
    return reply({ error: "strava-unavailable" }, 502);
  }
}
