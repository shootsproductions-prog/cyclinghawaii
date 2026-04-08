import {
  StravaTokenResponse,
  StravaActivity,
  StravaAthleteStats,
  StravaPhoto,
  FormattedRide,
  FormattedFeaturedRide,
  FormattedStats,
  StravaData,
} from "@/types/strava";
import {
  formatDistance,
  formatElevation,
  formatTime,
  formatDate,
  formatSpeed,
  metersToFeet,
  metersToMiles,
} from "./formatters";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: process.env.STRAVA_REFRESH_TOKEN!,
  });

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Strava token refresh failed: ${res.status}`, body);
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }

  const data: StravaTokenResponse = await res.json();
  return data.access_token;
}

async function getRecentActivities(
  token: string,
  count: number = 10
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${count}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`);
  return res.json();
}

async function getAthleteStats(
  token: string,
  athleteId: string
): Promise<StravaAthleteStats> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athletes/${athleteId}/stats`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Strava stats fetch failed: ${res.status}`);
  return res.json();
}

async function getActivityPhotos(
  token: string,
  activityId: number
): Promise<StravaPhoto[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/photos?size=600&photo_sources=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

function buildMapImageUrl(
  polyline: string,
  width: number,
  height: number
): string {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || !polyline) return "";
  const encoded = encodeURIComponent(polyline);
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/path-3+fc5200-0.8(${encoded})/auto/${width}x${height}@2x?access_token=${token}&padding=40`;
}

function formatActivity(ride: StravaActivity, maxElev: number): FormattedRide {
  return {
    id: ride.id,
    name: ride.name,
    type: ride.type,
    distance: formatDistance(ride.distance),
    time: formatTime(ride.moving_time),
    elevation: formatElevation(ride.total_elevation_gain),
    date: formatDate(ride.start_date_local),
    elevationPct: Math.round((ride.total_elevation_gain / maxElev) * 100),
    averageSpeed: formatSpeed(ride.average_speed),
    kudos: ride.kudos_count || 0,
    comments: ride.comment_count || 0,
    calories: ride.calories || 0,
    avgHeartrate: ride.average_heartrate,
    achievements: ride.achievement_count || 0,
    polyline: ride.map?.summary_polyline || "",
    mapImageUrl: buildMapImageUrl(
      ride.map?.summary_polyline || "",
      400,
      200
    ),
  };
}

function formatActivities(activities: StravaActivity[]): FormattedRide[] {
  const rides = activities.filter(
    (a) => a.type === "Ride" || a.sport_type === "Ride"
  );
  const maxElev = Math.max(...rides.map((r) => r.total_elevation_gain), 1);
  return rides.map((ride) => formatActivity(ride, maxElev));
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

export async function getStravaData(): Promise<StravaData> {
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
      getRecentActivities(token, 10),
      getAthleteStats(token, process.env.STRAVA_ATHLETE_ID!),
    ]);

    const allRides = formatActivities(activities);
    if (allRides.length === 0) return getFallbackData();

    const stats = formatStats(athleteStats);

    // Featured ride = first ride, with photos and large map
    const featuredBase = allRides[0];
    let photos: StravaPhoto[] = [];
    try {
      photos = await getActivityPhotos(token, featuredBase.id);
    } catch {
      // Photos are optional
    }

    const featured: FormattedFeaturedRide = {
      ...featuredBase,
      photos,
      largeMapImageUrl: buildMapImageUrl(featuredBase.polyline, 800, 400),
    };

    return { featured, rides: allRides.slice(1), stats };
  } catch (error) {
    console.error("Strava API error, using fallback data:", error);
    return getFallbackData();
  }
}

function getFallbackData(): StravaData {
  const fallbackRide = {
    kudos: 12,
    comments: 3,
    calories: 1850,
    achievements: 5,
    polyline: "",
    mapImageUrl: "",
  };

  return {
    featured: {
      id: 1,
      name: "Haleakala Sunrise Bomb",
      type: "Ride",
      distance: "36.2",
      time: "1:48",
      elevation: "9,740",
      date: "Apr 4, 2026",
      elevationPct: 92,
      averageSpeed: "20.1",
      ...fallbackRide,
      photos: [],
      largeMapImageUrl: "",
    },
    rides: [
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
        ...fallbackRide,
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
        ...fallbackRide,
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
