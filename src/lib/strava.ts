import { cache } from "react";
import {
  StravaTokenResponse,
  StravaActivity,
  StravaAthleteStats,
  StravaPhoto,
  StravaSegmentEffortRaw,
  FormattedRide,
  FormattedFeaturedRide,
  FormattedSegment,
  FormattedStats,
  MonthlyStats,
  ElevationPoint,
  StreamPoint,
  MaxStats,
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

// React.cache memoizes within a single request — dedupes token refresh
// across multiple call sites (strava.ts, blog.ts, challenge.ts, etc.)
export const getAccessToken = cache(async (): Promise<string> => {
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
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Strava token refresh failed: ${res.status}`, body);
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }

  const data: StravaTokenResponse = await res.json();
  return data.access_token;
});

async function getRecentActivities(
  token: string,
  count: number = 30
): Promise<StravaActivity[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?per_page=${count}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 900, tags: ["strava-activities"] },
    }
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
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 900, tags: ["strava-stats"] },
    }
  );
  if (!res.ok) throw new Error(`Strava stats fetch failed: ${res.status}`);
  return res.json();
}

export async function getActivityPhotos(
  token: string,
  activityId: number
): Promise<StravaPhoto[]> {
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/photos?size=600&photo_sources=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 900, tags: [`strava-photos-${activityId}`] },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

interface StravaStreamResponse {
  distance?: { data: number[] };
  altitude?: { data: number[] };
  heartrate?: { data: number[] };
  watts?: { data: number[] };
  velocity_smooth?: { data: number[] };
  grade_smooth?: { data: number[] };
}

interface ActivityStreams {
  elevation: ElevationPoint[];
  heartrate: StreamPoint[];
  power: StreamPoint[];
  maxStats: MaxStats;
}

function downsample<T>(arr: T[], targetCount: number = 150): T[] {
  if (arr.length <= targetCount) return arr;
  const step = Math.max(1, Math.floor(arr.length / targetCount));
  const result: T[] = [];
  for (let i = 0; i < arr.length; i += step) result.push(arr[i]);
  // Always include the last element
  if (result[result.length - 1] !== arr[arr.length - 1]) {
    result.push(arr[arr.length - 1]);
  }
  return result;
}

async function getActivityStreams(
  token: string,
  activityId: number
): Promise<ActivityStreams> {
  const empty: ActivityStreams = {
    elevation: [],
    heartrate: [],
    power: [],
    maxStats: { maxSpeed: 0, maxHeartrate: 0, maxPower: 0, maxGrade: 0 },
  };

  try {
    const res = await fetch(
      `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=distance,altitude,heartrate,watts,velocity_smooth,grade_smooth&key_by_type=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 900, tags: [`strava-streams-${activityId}`] },
      }
    );
    if (!res.ok) return empty;

    const data: StravaStreamResponse = await res.json();
    const distanceData = data.distance?.data || [];
    const altitudeData = data.altitude?.data || [];
    const hrData = data.heartrate?.data || [];
    const powerData = data.watts?.data || [];
    const velocityData = data.velocity_smooth?.data || [];
    const gradeData = data.grade_smooth?.data || [];

    // Convert distance from meters to miles once
    const distanceMi = distanceData.map(metersToMiles);

    // Build elevation profile (distance → altitude in feet)
    const elevationPoints: ElevationPoint[] =
      distanceData.length > 0 && altitudeData.length > 0
        ? downsample(
            distanceData.map((_, i) => ({
              distance: distanceMi[i] ?? 0,
              altitude: metersToFeet(altitudeData[i] ?? 0),
            }))
          )
        : [];

    // Build heartrate profile (distance → bpm)
    const heartratePoints: StreamPoint[] =
      distanceData.length > 0 && hrData.length > 0
        ? downsample(
            distanceData.map((_, i) => ({
              x: distanceMi[i] ?? 0,
              y: hrData[i] ?? 0,
            }))
          )
        : [];

    // Build power profile (distance → watts)
    const powerPoints: StreamPoint[] =
      distanceData.length > 0 && powerData.length > 0
        ? downsample(
            distanceData.map((_, i) => ({
              x: distanceMi[i] ?? 0,
              y: powerData[i] ?? 0,
            }))
          )
        : [];

    // Max stats computed from raw streams (not downsampled)
    const maxSpeedMps =
      velocityData.length > 0 ? Math.max(...velocityData) : 0;
    const maxStats: MaxStats = {
      maxSpeed: maxSpeedMps * 2.23694, // m/s → mph
      maxHeartrate: hrData.length > 0 ? Math.max(...hrData) : 0,
      maxPower: powerData.length > 0 ? Math.max(...powerData) : 0,
      maxGrade: gradeData.length > 0 ? Math.max(...gradeData) : 0,
    };

    return {
      elevation: elevationPoints,
      heartrate: heartratePoints,
      power: powerPoints,
      maxStats,
    };
  } catch (error) {
    console.error("Streams fetch failed:", error);
    return empty;
  }
}

interface StravaDetailedActivity extends StravaActivity {
  segment_efforts?: StravaSegmentEffortRaw[];
}

async function getActivityDetail(
  token: string,
  activityId: number
): Promise<StravaDetailedActivity | null> {
  try {
    const res = await fetch(
      `${STRAVA_API_BASE}/activities/${activityId}?include_all_efforts=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 900, tags: [`strava-detail-${activityId}`] },
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatSegments(
  efforts: StravaSegmentEffortRaw[] | undefined
): FormattedSegment[] {
  if (!efforts) return [];
  return efforts.slice(0, 6).map((e) => ({
    id: e.id,
    name: e.name,
    time: formatTime(e.elapsed_time),
    distanceMi: formatDistance(e.distance),
    avgGrade: Math.round(e.segment.average_grade * 10) / 10,
    avgWatts: e.average_watts ? Math.round(e.average_watts) : undefined,
    avgHeartrate: e.average_heartrate
      ? Math.round(e.average_heartrate)
      : undefined,
    isPR: e.pr_rank === 1,
    isKOM: e.kom_rank === 1,
    stravaUrl: `https://www.strava.com/segments/${e.segment.id}`,
  }));
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function buildMapSvg(
  polyline: string,
  width: number,
  height: number
): string {
  if (!polyline) return "";
  const points = decodePolyline(polyline);
  if (points.length < 2) return "";

  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const pad = 0.1;
  const rangeX = maxLng - minLng || 0.001;
  const rangeY = maxLat - minLat || 0.001;

  const svgPoints = points
    .map((p) => {
      const x = ((p[1] - minLng) / rangeX) * (1 - 2 * pad) + pad;
      const y = (1 - (p[0] - minLat) / rangeY) * (1 - 2 * pad) + pad;
      return `${(x * width).toFixed(1)},${(y * height).toFixed(1)}`;
    })
    .join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#f5f5f5"/><polyline points="${svgPoints}" fill="none" stroke="#fc5200" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function buildMapImageUrl(polyline: string, width: number, height: number): string {
  // Try Mapbox first
  const token = process.env.MAPBOX_TOKEN;
  if (token && polyline) {
    const encoded = encodeURIComponent(polyline);
    return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/path-3+fc5200-0.8(${encoded})/auto/${width}x${height}@2x?access_token=${token}&padding=40`;
  }
  // Fallback: inline SVG as data URI
  if (polyline) {
    const svg = buildMapSvg(polyline, width, height);
    if (svg) return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  return "";
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
    avgWatts: ride.average_watts,
    avgCadence: ride.average_cadence,
    achievements: ride.achievement_count || 0,
    polyline: ride.map?.summary_polyline || "",
    mapImageUrl: buildMapImageUrl(
      ride.map?.summary_polyline || "",
      400,
      200
    ),
    stravaUrl: `https://www.strava.com/activities/${ride.id}`,
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

function calculateMonthlyStats(activities: StravaActivity[]): MonthlyStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonth = activities.filter((a) => {
    const d = new Date(a.start_date_local);
    return d >= monthStart && (a.type === "Ride" || a.sport_type === "Ride");
  });

  const totalDistance = thisMonth.reduce((s, a) => s + a.distance, 0);
  const totalTime = thisMonth.reduce((s, a) => s + a.moving_time, 0);
  const totalElev = thisMonth.reduce((s, a) => s + a.total_elevation_gain, 0);
  const totalCalories = thisMonth.reduce((s, a) => s + (a.calories || 0), 0);

  return {
    miles: Math.round(metersToMiles(totalDistance) * 10) / 10,
    rides: thisMonth.length,
    elevationFt: Math.round(metersToFeet(totalElev)),
    movingTimeHours: Math.round((totalTime / 3600) * 10) / 10,
    calories: totalCalories,
    avgSpeedMph:
      totalTime > 0
        ? Math.round((metersToMiles(totalDistance) / (totalTime / 3600)) * 10) / 10
        : 0,
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
      getRecentActivities(token, 30),
      getAthleteStats(token, process.env.STRAVA_ATHLETE_ID!),
    ]);

    const allRides = formatActivities(activities);
    if (allRides.length === 0) return getFallbackData();

    const stats = formatStats(athleteStats);

    // Featured ride = first ride, with photos, large map, elevation, streams
    const featuredBase = allRides[0];
    const [photos, streams, detail] = await Promise.all([
      getActivityPhotos(token, featuredBase.id).catch(() => []),
      getActivityStreams(token, featuredBase.id),
      getActivityDetail(token, featuredBase.id),
    ]);

    const segments = formatSegments(detail?.segment_efforts);

    const featured: FormattedFeaturedRide = {
      ...featuredBase,
      photos,
      largeMapImageUrl: buildMapImageUrl(featuredBase.polyline, 800, 400),
      elevationProfile: streams.elevation,
      heartrateProfile: streams.heartrate,
      powerProfile: streams.power,
      maxStats: streams.maxStats,
      segments,
    };

    const monthlyStats = calculateMonthlyStats(activities);
    return { featured, rides: allRides.slice(1), stats, monthlyStats };
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
    avgHeartrate: 145,
    avgWatts: 185,
    avgCadence: 88,
    achievements: 5,
    polyline: "",
    mapImageUrl: "",
    stravaUrl: "#",
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
      elevationProfile: [],
      heartrateProfile: [],
      powerProfile: [],
      maxStats: { maxSpeed: 0, maxHeartrate: 0, maxPower: 0, maxGrade: 0 },
      segments: [],
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
    monthlyStats: {
      miles: 45,
      rides: 4,
      elevationFt: 3200,
      movingTimeHours: 6.5,
      calories: 2800,
      avgSpeedMph: 12.5,
    },
  };
}
