import { cache } from "react";
import { getAccessToken } from "./strava";
import { metersToFeet, metersToMiles } from "./formatters";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
// Numeric club ID for Cycling Hawaiʻi on Strava
// (https://www.strava.com/clubs/737679). Numeric IDs are permanent;
// slugs can change, so we default to the number. STRAVA_CLUB_ID env
// var still wins if set — useful for testing against another club.
const CLUB_ID = process.env.STRAVA_CLUB_ID || "737679";

export interface ClubInfo {
  id: number;
  name: string;
  profile: string;
  cover_photo: string | null;
  member_count: number;
  city: string;
  state: string;
  country: string;
  sport_type: string;
  url: string;
}

export interface ClubMember {
  firstname: string;
  lastname: string;
  profile: string;
  city?: string;
  state?: string;
}

export interface ClubActivity {
  athlete: { firstname: string; lastname: string };
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
}

export interface ClubStats {
  totalMiles: number;
  totalElevationFt: number;
  totalRides: number;
  topMember: string | null;
}

export interface ClubData {
  info: ClubInfo;
  members: ClubMember[];
  activities: ClubActivity[];
  stats: ClubStats;
}

export const getClubData = cache(async (): Promise<ClubData | null> => {
  if (!process.env.STRAVA_REFRESH_TOKEN) return null;

  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const opts = {
      headers,
      next: { revalidate: 900, tags: ["strava-club"] as string[] },
    };

    const [infoRes, membersRes, activitiesRes] = await Promise.all([
      fetch(`${STRAVA_API_BASE}/clubs/${CLUB_ID}`, opts),
      fetch(`${STRAVA_API_BASE}/clubs/${CLUB_ID}/members?per_page=100`, opts),
      // Back to per_page=30, the Strava default. per_page=200 caused this
      // endpoint to return 404 (Strava rejects out-of-range params with
      // 404, not 400). If the endpoint still 404s at 30 it's a real API
      // deprecation, not a param issue, and we pivot away from the API.
      fetch(
        `${STRAVA_API_BASE}/clubs/${CLUB_ID}/activities?per_page=30`,
        opts
      ),
    ]);

    if (!infoRes.ok) {
      console.error(`Club info fetch failed: ${infoRes.status}`);
      return null;
    }

    // Log status + shape so Vercel Function logs make it obvious when
    // Strava returns a 4xx (usually a scope/permissions issue on the
    // members and activities endpoints) versus a legitimately-empty
    // window. The Snapshot on the homepage can't distinguish "quiet
    // week" from "auth denied" without this.
    if (!membersRes.ok) {
      console.error(
        `Club members fetch failed: ${membersRes.status} ${membersRes.statusText}`
      );
    }
    if (!activitiesRes.ok) {
      console.error(
        `Club activities fetch failed: ${activitiesRes.status} ${activitiesRes.statusText}`
      );
    }

    const info: ClubInfo = await infoRes.json();
    const members: ClubMember[] = membersRes.ok ? await membersRes.json() : [];
    const activities: ClubActivity[] = activitiesRes.ok
      ? await activitiesRes.json()
      : [];

    console.log(
      `[club] fetched members=${members.length} activities=${activities.length} (member_count from info=${info.member_count})`
    );

    // Any Strava activity whose type or sport_type contains "Ride" counts:
    // Ride, GravelRide, MountainBikeRide, EBikeRide, VirtualRide,
    // EMountainBikeRide, Handcycle-adjacent variants. For a gravel-heavy
    // Hawai'i club, the old strict "Ride"-only filter dropped most rides
    // on the floor and made the homepage totals look zero'd.
    const isRideish = (a: ClubActivity) =>
      (a.sport_type || a.type || "").toLowerCase().includes("ride");
    const rides = activities.filter(isRideish);

    const totalMiles = Math.round(
      rides.reduce((sum, a) => sum + metersToMiles(a.distance), 0)
    );
    const totalElevationFt = Math.round(
      rides.reduce((sum, a) => sum + metersToFeet(a.total_elevation_gain), 0)
    );

    // Tally miles per member to surface the most consistent recent rider.
    const milesByMember = new Map<string, number>();
    for (const a of rides) {
      const name = `${a.athlete.firstname} ${a.athlete.lastname[0]}.`;
      milesByMember.set(
        name,
        (milesByMember.get(name) ?? 0) + metersToMiles(a.distance)
      );
    }
    let topMember: string | null = null;
    let topMiles = 0;
    for (const [name, miles] of milesByMember) {
      if (miles > topMiles) {
        topMiles = miles;
        topMember = name;
      }
    }

    return {
      info,
      members,
      activities,
      stats: {
        totalMiles,
        totalElevationFt,
        totalRides: rides.length,
        topMember,
      },
    };
  } catch (err) {
    console.error("Club fetch failed:", err);
    return null;
  }
});
