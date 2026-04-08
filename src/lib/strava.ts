import {
  StravaTokenResponse,
  StravaActivity,
  StravaAthleteStats,
  FormattedRide,
  FormattedStats,
} from "@/types/strava";
import {
  formatDistance,
  formatElevation,
  formatTime,
  formatDate,
  formatSpeed,
  metersToFeet,
  metersToMiles,
  mpsToMph,
} from "./formatters";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

async function getAccessToken(): Promise<string> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }

  const data: StravaTokenResponse = await res.json();
  return data.access_token;
}

async function getRecentActivities(
  token: string,
  count: number = 6
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${count}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Strava activities fetch failed: ${res.status}`);
  }

  return res.json();
}

async function getAthleteStats(
  token: string,
  athleteId: string
): Promise<StravaAthleteStats> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athletes/${athleteId}/stats`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Strava stats fetch failed: ${res.status}`);
  }

  return res.json();
}

function formatActivities(activities: StravaActivity[]): FormattedRide[] {
  // Filter to rides only
  const rides = activities.filter(
    (a) => a.type === "Ride" || a.sport_type === "Ride"
  );

  // Find max elevation for percentage calculation
  const maxElev = Math.max(...rides.map((r) => r.total_elevation_gain), 1);

  return rides.map((ride) => ({
    id: ride.id,
    name: ride.name,
    type: ride.type,
    distance: formatDistance(ride.distance),
    time: formatTime(ride.moving_time),
    elevation: formatElevation(ride.total_elevation_gain),
    date: formatDate(ride.start_date_local),
    elevationPct: Math.round((ride.total_elevation_gain / maxElev) * 100),
    averageSpeed: formatSpeed(ride.average_speed),
  }));
}

function formatStats(stats: StravaAthleteStats): FormattedStats {
  const ytd = stats.ytd_ride_totals;
  const avgSpeed =
    ytd.moving_time > 0
      ? (metersToMiles(ytd.distance) / (ytd.moving_time / 3600)).toFixed(1)
      : "0.0";

  return {
    totalMiles: Math.round(metersToMiles(ytd.distance)).toLocaleString(),
    totalRides: ytd.count.toString(),
    totalElevation: `${Math.round(metersToFeet(ytd.elevation_gain) / 1000)}k`,
    avgSpeed,
  };
}

export interface StravaData {
  rides: FormattedRide[];
  stats: FormattedStats;
}

export async function getStravaData(): Promise<StravaData> {
  // Check if env vars are configured
  if (
    !process.env.STRAVA_CLIENT_ID ||
    !process.env.STRAVA_CLIENT_SECRET ||
    !process.env.STRAVA_REFRESH_TOKEN ||
    !process.env.STRAVA_ATHLETE_ID
  ) {
    console.log("Strava env vars not configured, using fallback data");
    return getFallbackData();
  }

  try {
    const token = await getAccessToken();
    const [activities, athleteStats] = await Promise.all([
      getRecentActivities(token, 6),
      getAthleteStats(token, process.env.STRAVA_ATHLETE_ID!),
    ]);

    const rides = formatActivities(activities);
    const stats = formatStats(athleteStats);

    // If no rides found, use fallback
    if (rides.length === 0) {
      return getFallbackData();
    }

    return { rides, stats };
  } catch (error) {
    console.error("Strava API error, using fallback data:", error);
    return getFallbackData();
  }
}

function getFallbackData(): StravaData {
  return {
    rides: [
      {
        id: 1,
        name: "Haleakala Sunrise Bomb",
        type: "Ride",
        distance: "36.2",
        time: "1:48",
        elevation: "9,740",
        date: "Apr 4, 2026",
        elevationPct: 92,
        averageSpeed: "20.1",
      },
      {
        id: 2,
        name: "West Maui Loop",
        type: "Ride",
        distance: "52.8",
        time: "2:34",
        elevation: "3,210",
        date: "Apr 2, 2026",
        elevationPct: 48,
        averageSpeed: "20.5",
      },
      {
        id: 3,
        name: "Kohala Coast Century",
        type: "Ride",
        distance: "101.3",
        time: "5:12",
        elevation: "5,680",
        date: "Mar 30, 2026",
        elevationPct: 67,
        averageSpeed: "19.5",
      },
    ],
    stats: {
      totalMiles: "1,247",
      totalRides: "62",
      totalElevation: "142k",
      avgSpeed: "18.4",
    },
  };
}
