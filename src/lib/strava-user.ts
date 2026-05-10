// Strava API calls scoped to an arbitrary athlete (not Vini).
// Used by the rider OAuth flow at /api/auth/strava/* and the
// dynamic /[slug] page that renders any connected rider.

import type { StravaActivity, StravaTokenResponse } from "@/types/strava";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

// The slug Strava assigns to our club. Used to gate membership on connect.
const CYCLING_HAWAII_CLUB_SLUG = "cyclinghawaii";

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city?: string;
  state?: string;
  country?: string;
  username?: string;
}

export interface StravaClubLite {
  id: number;
  name: string;
  url: string;
  member_count: number;
  profile?: string;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<StravaTokenResponse & { athlete: StravaAthlete }> {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
  });

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function refreshUserToken(
  refreshToken: string
): Promise<StravaTokenResponse> {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  return res.json();
}

export async function getAthleteClubs(
  accessToken: string
): Promise<StravaClubLite[]> {
  const res = await fetch(`${STRAVA_API_BASE}/athlete/clubs?per_page=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function isInCyclingHawaiiClub(
  accessToken: string
): Promise<boolean> {
  const clubs = await getAthleteClubs(accessToken);
  return clubs.some((c) => c.url === CYCLING_HAWAII_CLUB_SLUG);
}

export async function getAthleteActivities(
  accessToken: string,
  perPage: number = 10
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      // Cache per-rider for 15 min
      next: { revalidate: 900 },
    }
  );
  if (!res.ok) return [];
  return res.json();
}
