// A made-up rider, so visitors can see the coach work before they
// connect or import anything. Deterministic: the same `today` always
// produces the same fourteen weeks. No real person's data.

import { dayKey, dayNumber, weekStartOf } from "./load";
import type { CoachRide } from "./types";

/** Small seeded generator (mulberry32), the same one the site already uses for stable shuffles. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Template {
  weekday: number; // 0 = Monday
  name: string;
  kind: CoachRide["kind"];
  hours: number;
  /** Average heart rate as a fraction of the sample rider's maximum (182). */
  effort: number;
  mph: number;
  ftPerMile: number;
  cadence: number;
  hour: number;
}

const SAMPLE_MAX_HR = 182;

// A believable Maui week for a rider who goes medium-hard on almost
// every ride and grinds a low cadence: two things for the coach to find.
const WEEK: Template[] = [
  { weekday: 1, name: "Rollers before work", kind: "virtual", hours: 0.8, effort: 0.76, mph: 17, ftPerMile: 0, cadence: 76, hour: 6 },
  { weekday: 3, name: "Baldwin Avenue repeats", kind: "road", hours: 1.3, effort: 0.84, mph: 12.5, ftPerMile: 135, cadence: 72, hour: 16 },
  { weekday: 5, name: "Upcountry gravel loop", kind: "gravel", hours: 2.6, effort: 0.78, mph: 11.5, ftPerMile: 95, cadence: 74, hour: 7 },
  { weekday: 6, name: "North shore spin", kind: "road", hours: 1.5, effort: 0.68, mph: 16, ftPerMile: 40, cadence: 78, hour: 8 },
];

/**
 * Fourteen weeks of rides ending at `today` ("YYYY-MM-DD"). Volume
 * builds gently, one week is missed, and every fourth week is lighter.
 */
export function sampleRides(today: string): CoachRide[] {
  const todayN = dayNumber(today);
  const thisWeek = weekStartOf(todayN);
  const random = rng(20261112);
  const rides: CoachRide[] = [];

  for (let w = 13; w >= 0; w--) {
    const weekStart = thisWeek - w * 7;
    if (w === 9) continue; // a missed week (travel, life)
    const build = 0.8 + (13 - w) * 0.022;
    const easyWeek = w % 4 === 2 ? 0.7 : 1;
    for (const t of WEEK) {
      const day = weekStart + t.weekday;
      if (day > todayN) continue;
      if (random() < 0.12) continue; // the odd skipped ride
      const hours = t.hours * build * easyWeek * (0.9 + random() * 0.2);
      const movingSec = Math.round(hours * 3600);
      const miles = hours * t.mph * (0.95 + random() * 0.1);
      const avgHr = Math.round(SAMPLE_MAX_HR * t.effort * (0.97 + random() * 0.06));
      rides.push({
        id: `sample-${dayKey(day)}-${t.weekday}`,
        source: "sample",
        name: t.name,
        start: `${dayKey(day)}T${String(t.hour).padStart(2, "0")}:10:00`,
        kind: t.kind,
        movingSec,
        elapsedSec: Math.round(movingSec * (t.kind === "virtual" ? 1 : 1.12)),
        distanceM: Math.round(miles * 1609.344),
        climbM: Math.round((miles * t.ftPerMile) / 3.28084),
        avgHr,
        maxHr: Math.min(SAMPLE_MAX_HR, Math.round(avgHr + 18 + random() * 14)),
        avgCadence: Math.round(t.cadence + (random() - 0.5) * 4),
        indoor: t.kind === "virtual",
      });
    }
  }
  return rides;
}
