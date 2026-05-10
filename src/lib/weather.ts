import { WeatherData } from "@/types/strava";

// Open-Meteo historical weather — no API key needed, free for non-commercial use.
// Docs: https://open-meteo.com/en/docs/historical-weather-api

const OM_BASE = "https://archive-api.open-meteo.com/v1/archive";

const WEATHER_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Showers",
  81: "Showers",
  82: "Heavy Showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function degToCompass(deg: number): string {
  return COMPASS[Math.round(deg / 45) % 8];
}

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

/**
 * Fetch historical weather for a given date and location.
 * Picks the hour closest to the ride start time.
 */
export async function getWeatherForRide(
  lat: number,
  lng: number,
  startDateLocal: string // ISO 8601 like "2026-04-09T07:19:00"
): Promise<WeatherData | null> {
  if (!lat || !lng) return null;

  // Open-Meteo uses YYYY-MM-DD
  const date = startDateLocal.slice(0, 10);
  const targetHour = parseInt(startDateLocal.slice(11, 13), 10) || 0;

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    start_date: date,
    end_date: date,
    hourly:
      "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
  });

  try {
    const res = await fetch(`${OM_BASE}?${params}`, {
      next: { revalidate: 86400, tags: [`weather-${date}-${lat}-${lng}`] },
    });
    if (!res.ok) return null;
    const data: OpenMeteoResponse = await res.json();
    if (!data.hourly || data.hourly.time.length === 0) return null;

    // Pick the hour closest to ride start
    const hourIdx = Math.min(targetHour, data.hourly.time.length - 1);
    const code = data.hourly.weather_code[hourIdx] ?? 0;

    return {
      tempF: Math.round(data.hourly.temperature_2m[hourIdx] ?? 0),
      windMph: Math.round(data.hourly.wind_speed_10m[hourIdx] ?? 0),
      windDir: degToCompass(data.hourly.wind_direction_10m[hourIdx] ?? 0),
      conditions: WEATHER_CODES[code] || "Unknown",
      humidity: Math.round(data.hourly.relative_humidity_2m[hourIdx] ?? 0),
    };
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return null;
  }
}
