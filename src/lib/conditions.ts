// Live conditions across the four main Hawaiian cycling islands, pulled
// from Open-Meteo (free, no key) and narrated with a Laura one-liner.
// Powers the Ride Today panel at the top of the homepage.
//
// Coordinates picked to represent the most common cycling hub on each
// island rather than the population center, since a rider looking here
// wants to know what conditions will be like *where they'd ride*, not
// where the airport is.

export type Island = "maui" | "bigisland" | "oahu" | "kauai";

interface IslandSpec {
  key: Island;
  label: string;
  hub: string; // shown under the temp so people know where we're measuring
  lat: number;
  lon: number;
}

// Kula on Maui (upcountry, near Haleakalā approaches).
// Waimea on Big Island (the cool-side cycling hub between Kona/Kohala/Hilo climbs).
// Hale'iwa on O'ahu (North Shore, popular loop start).
// Līhu'e on Kaua'i (east-side, most cycling begins on this side).
const ISLANDS: IslandSpec[] = [
  { key: "maui", label: "Maui", hub: "Kula", lat: 20.84, lon: -156.33 },
  { key: "bigisland", label: "Big Island", hub: "Waimea", lat: 20.02, lon: -155.67 },
  { key: "oahu", label: "O'ahu", hub: "Hale'iwa", lat: 21.59, lon: -158.10 },
  { key: "kauai", label: "Kaua'i", hub: "Līhu'e", lat: 21.98, lon: -159.37 },
];

export interface IslandConditions {
  island: Island;
  label: string;
  hub: string;
  tempF: number;
  windMph: number;
  windDir: string;
  windDeg: number; // for the little rotating arrow in the UI
  weatherText: string;
  prescription: string;
}

// Kept as an alias so the older page.tsx import doesn't break if anyone
// still references it while we transition.
export type MauiConditions = IslandConditions;

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function compass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

// Laura-style prescription. Deterministic, no API cost, keeps voice
// consistent. If we ever want per-island color (Kona-specific, Hāna
// tailwind, etc.) we can branch on island here.
function prescribe(c: {
  island: Island;
  tempF: number;
  windMph: number;
  windDir: string;
  weatherText: string;
}): string {
  const w = c.weatherText.toLowerCase();
  if (w.includes("rain") || w.includes("shower") || w.includes("thunder")) {
    return "Wet. Roll easy or roll inside.";
  }
  if (w.includes("fog")) {
    return "Upcountry's in the clouds. Stay coastal.";
  }
  const easterly = ["E", "NE"].includes(c.windDir);
  if (c.windMph >= 20 && easterly) {
    return "Trades are honking. Ride east, drift home.";
  }
  if (c.windMph >= 20) {
    return `${c.windDir} at ${c.windMph}. Pick your direction.`;
  }
  if (c.windMph < 8) {
    return "Eerie calm. Don't waste it.";
  }
  if (c.tempF >= 85) {
    return "Hot. Extra bottle, shaded climbs.";
  }
  if (c.tempF <= 60) {
    return "Cool. Arm warmers in the pocket.";
  }
  return "Decent. No excuses.";
}

async function fetchOne(spec: IslandSpec): Promise<IslandConditions | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${spec.lat}` +
    `&longitude=${spec.lon}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  try {
    // 30-min ISR window — conditions don't need to be minute-fresh, and this
    // keeps Open-Meteo's free tier well below their fair-use limits even
    // with heavy traffic.
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.error(`Open-Meteo ${spec.label} ${res.status}`);
      return null;
    }
    const data = await res.json();
    const cur = data.current;
    const tempF = Math.round(cur.temperature_2m);
    const windMph = Math.round(cur.wind_speed_10m);
    const windDeg = Math.round(cur.wind_direction_10m);
    const windDir = compass(windDeg);
    const weatherText = WEATHER_CODES[cur.weather_code] ?? "Mixed skies";
    const prescription = prescribe({
      island: spec.key,
      tempF,
      windMph,
      windDir,
      weatherText,
    });
    return {
      island: spec.key,
      label: spec.label,
      hub: spec.hub,
      tempF,
      windMph,
      windDir,
      windDeg,
      weatherText,
      prescription,
    };
  } catch (err) {
    console.error(`Open-Meteo ${spec.label} fetch failed:`, err);
    return null;
  }
}

// The homepage-facing call. Returns whatever islands we could resolve;
// individual island failures degrade gracefully instead of breaking the
// whole panel.
export async function getAllIslandConditions(): Promise<IslandConditions[]> {
  const results = await Promise.all(ISLANDS.map(fetchOne));
  return results.filter((r): r is IslandConditions => r !== null);
}

// Backward-compat: the old single-Maui fetcher still exports so nothing
// downstream breaks while we transition. Delete once nothing imports it.
export async function getMauiConditions(): Promise<IslandConditions | null> {
  const maui = ISLANDS[0];
  return fetchOne(maui);
}
