// Strava Routes API — pulls Vini's saved routes for the /routes library
// and the upcoming /tour stages.

import { cache } from "react";
import { getAccessToken } from "./strava";
import { metersToMiles, metersToFeet } from "./formatters";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export interface StravaRouteRaw {
  id: number;
  id_str: string;
  name: string;
  description: string;
  distance: number; // meters
  elevation_gain: number; // meters
  type: number; // 1 = ride, 2 = run
  sub_type: number; // 1 = road, 2 = mountain bike, 3 = cross, 4 = trail, 5 = mixed
  estimated_moving_time?: number;
  private: boolean;
  starred: boolean;
  timestamp: number;
  map: { id: string; summary_polyline: string };
  athlete: { id: number; firstname: string; lastname: string };
}

export interface FormattedRoute {
  id: string;
  name: string;
  description: string;
  distanceMi: number;
  elevationFt: number;
  type: "Road" | "MTB" | "Gravel" | "Trail" | "Mixed";
  estimatedHours: number;
  polyline: string;
  stravaUrl: string;
  isPrivate: boolean;
}

const SUB_TYPE_LABEL: Record<number, FormattedRoute["type"]> = {
  1: "Road",
  2: "MTB",
  3: "Gravel",
  4: "Trail",
  5: "Mixed",
};

// Heuristic for "this is a Hawaii route" — names usually mention island
// places. Catches Maui + Lanai + Big Island, excludes travel routes.
const HAWAII_KEYWORDS = [
  "maui",
  "lanai",
  "lana'i",
  "lanaʻi",
  "kahakuloa",
  "haleakala",
  "haleakalā",
  "haiku",
  "hāʻikū",
  "hana",
  "hāna",
  "kihei",
  "kīhei",
  "lahaina",
  "olinda",
  "kula",
  "paia",
  "pāʻia",
  "wailea",
  "wailuku",
  "waianapanapa",
  "wainapanapa",
  "honolua",
  "honokohau",
  "kahului",
  "iao",
  "ʻīao",
  "twin falls",
  "kalaoa",
  "hilo",
  "kona",
  "honolulu",
  "kauai",
  "kauaʻi",
  "molokai",
  "molokaʻi",
  "manele",
  "munroe",
  "lighthouse",
  "skyline",
  "ride to the sun",
  "imua",
  "veterans way",
  "veteran west",
  "aloha gravel",
  "upcountry",
  "kahului",
  "launiupoko",
  "kipahulu",
  "lahainaluna",
  "club lanai",
  "lopa",
  "kalamapau",
  "wainapanapa",
  "grandma",
  "figure 8",
];

function isHawaiiRoute(name: string): boolean {
  const n = name.toLowerCase();
  return HAWAII_KEYWORDS.some((k) => n.includes(k));
}

function formatRoute(r: StravaRouteRaw): FormattedRoute {
  return {
    id: r.id_str || String(r.id),
    name: r.name.trim(),
    description: r.description?.trim() ?? "",
    distanceMi: Math.round(metersToMiles(r.distance) * 10) / 10,
    elevationFt: Math.round(metersToFeet(r.elevation_gain)),
    type: SUB_TYPE_LABEL[r.sub_type] ?? "Mixed",
    estimatedHours: r.estimated_moving_time
      ? Math.round((r.estimated_moving_time / 3600) * 10) / 10
      : 0,
    polyline: r.map?.summary_polyline ?? "",
    stravaUrl: `https://www.strava.com/routes/${r.id_str || r.id}`,
    isPrivate: !!r.private,
  };
}

/** Fetch all routes for the authenticated athlete. */
export const getMyRoutes = cache(async (): Promise<FormattedRoute[]> => {
  if (!process.env.STRAVA_REFRESH_TOKEN) return [];
  try {
    const token = await getAccessToken();

    // Get athlete ID
    const athleteRes = await fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
    });
    if (!athleteRes.ok) {
      console.error("Athlete fetch failed:", athleteRes.status);
      return [];
    }
    const athlete = await athleteRes.json();

    // Get routes
    const res = await fetch(
      `${STRAVA_API_BASE}/athletes/${athlete.id}/routes?per_page=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) {
      console.error("Routes fetch failed:", res.status);
      return [];
    }

    const raw: StravaRouteRaw[] = await res.json();
    return raw.map(formatRoute).filter((r) => !r.isPrivate);
  } catch (err) {
    console.error("getMyRoutes failed:", err);
    return [];
  }
});

/** Just the Hawaii routes (filters out Patagonia, Germany, etc.) */
export const getHawaiiRoutes = cache(async (): Promise<FormattedRoute[]> => {
  const all = await getMyRoutes();
  return all.filter((r) => isHawaiiRoute(r.name));
});

/** Fetch a single route by ID. */
export async function getRoute(routeId: string): Promise<FormattedRoute | null> {
  try {
    const token = await getAccessToken();
    const res = await fetch(`${STRAVA_API_BASE}/routes/${routeId}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const raw: StravaRouteRaw = await res.json();
    return formatRoute(raw);
  } catch (err) {
    console.error("getRoute failed:", err);
    return null;
  }
}

/** Build a Mapbox Static Images URL for a route polyline. */
export function buildRouteMapUrl(
  polyline: string,
  width: number = 600,
  height: number = 320
): string | null {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || !polyline) return null;
  const encoded = encodeURIComponent(polyline);
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/path-3+fc5200-0.85(${encoded})/auto/${width}x${height}@2x?access_token=${token}&padding=30`;
}
