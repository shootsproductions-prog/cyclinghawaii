// Live conditions for Maui — pulled from Open-Meteo, narrated by Laura.
// Used on the /club page's Conditions Report.

const MAUI_LAT = 20.84; // Pukalani-ish, central Maui
const MAUI_LON = -156.33;

export interface MauiConditions {
  tempF: number;
  windMph: number;
  windDir: string;
  weatherText: string;
  prescription: string;
}

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

function prescribe(c: {
  tempF: number;
  windMph: number;
  windDir: string;
  weatherText: string;
}): string {
  const w = c.weatherText.toLowerCase();
  if (w.includes("rain") || w.includes("shower") || w.includes("thunder")) {
    return "Wet day. Roll easy or roll inside. The hills will keep.";
  }
  if (w.includes("fog")) {
    return "Upcountry's in the clouds. Stick to the coast or wait it out.";
  }
  const easterly = ["E", "NE"].includes(c.windDir);
  if (c.windMph >= 20 && easterly) {
    return "Trades are honking. Tailwind toward Hāna — go take the bait.";
  }
  if (c.windMph >= 20) {
    return `${c.windDir} winds at ${c.windMph}mph. Pick your direction wisely.`;
  }
  if (c.windMph < 8) {
    return "Eerie calm. No wind. Don't waste it.";
  }
  if (c.tempF >= 85) {
    return "Hot one. Carry extra water. Take the shaded climbs.";
  }
  if (c.tempF <= 60) {
    return "Cool morning. Arm warmers in the jersey pocket. You'll thank me.";
  }
  return "Decent conditions. No excuses today.";
}

export async function getMauiConditions(): Promise<MauiConditions | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${MAUI_LAT}&longitude=${MAUI_LON}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data.current;
    const tempF = Math.round(cur.temperature_2m);
    const windMph = Math.round(cur.wind_speed_10m);
    const windDir = compass(cur.wind_direction_10m);
    const weatherText = WEATHER_CODES[cur.weather_code] ?? "Mixed skies";
    const prescription = prescribe({ tempF, windMph, windDir, weatherText });
    return { tempF, windMph, windDir, weatherText, prescription };
  } catch (err) {
    console.error("Open-Meteo fetch failed:", err);
    return null;
  }
}
