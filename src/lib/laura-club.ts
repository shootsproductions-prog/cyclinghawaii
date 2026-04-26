// Laura's voice for the /club page — roster lines, Wall narration, Compass comparisons.
// All deterministic and free. We can upgrade to LLM-generated lines later.

import type { ClubMember, ClubActivity } from "./club";

const ROSTER_LINES = [
  "Suspiciously consistent.",
  "Knows the back roads.",
  "Carries spare tubes for everyone.",
  "Has more bibs than excuses.",
  "Tailwind enthusiast. Shameless.",
  "Reads the wind better than the weather app.",
  "Solo, but somehow always there.",
  "Refuses to ride in groups. Same.",
  "Logs everything. Says little.",
  "Pono pace, every time.",
  "Climbs everything. Complains about nothing.",
  "Joined for the views. Stayed for the malasadas.",
  "Probably out riding right now.",
  "Reliable as the trade winds.",
  "Stops for coffee. Always.",
  "Lives upcountry. Trains downcountry.",
  "Runs on shave ice and stubbornness.",
  "Once rode through a passing shower and called it a rinse.",
  "Owns a road bike, a gravel bike, and zero regrets.",
  "Will ride 60 miles for a good lunch.",
];

const FOUNDER_LINE = "Founded the club. Rides solo, mostly. Roasts himself first.";

// Stable hash from a string → small int. So each member always gets the same line.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function rosterLineFor(member: ClubMember): string {
  const isFounder =
    member.firstname.toLowerCase().startsWith("vinic") ||
    member.firstname.toLowerCase().startsWith("vini");
  if (isFounder) return FOUNDER_LINE;
  const key = `${member.firstname} ${member.lastname}`;
  return ROSTER_LINES[hash(key) % ROSTER_LINES.length];
}

// ── The Wall — one-line narration per ride ──────────────────────────
export function wallLineFor(a: ClubActivity): string {
  const milesRaw = a.distance / 1609.34;
  const elevFt = a.total_elevation_gain * 3.28084;
  const first = a.athlete.firstname;

  if (elevFt >= 4000) {
    return `${first} climbed ${Math.round(elevFt).toLocaleString()} ft. Gravity is a suggestion.`;
  }
  if (milesRaw >= 60) {
    return `${first} put down ${Math.round(milesRaw)} miles. The road won, eventually.`;
  }
  if (milesRaw >= 35) {
    return `${first} rolled ${Math.round(milesRaw)} solid miles. No drama, all signal.`;
  }
  if (milesRaw >= 15) {
    return `${first} got a clean ${Math.round(milesRaw)} in. Steady as the trades.`;
  }
  if (milesRaw >= 5) {
    return `${first} took a quick ${Math.round(milesRaw)}. Better than the couch.`;
  }
  return `${first} clipped in. That counts for something.`;
}

// ── The Compass — fun comparisons for collective totals ─────────────
export function milesCompare(miles: number): string {
  if (miles >= 1500) return "Roughly the distance from Maui to San Francisco.";
  if (miles >= 800) return "About the perimeter of all four main Hawaiian islands.";
  if (miles >= 500) return "Three laps around Maui's coastline.";
  if (miles >= 300) return "Maui to Kauai, end to end and most of the way back.";
  if (miles >= 150) return "Once around Maui, plus a stop for shave ice.";
  if (miles >= 50) return "Hāna and back, with margin.";
  return "A respectable start.";
}

export function elevationCompare(ft: number): string {
  const haleakala = 10023;
  const fuji = 12389;
  if (ft >= fuji * 5) return `Five Mt. Fujis, stacked.`;
  if (ft >= haleakala * 5) return `Five Haleakalās, summit-to-sea.`;
  if (ft >= haleakala * 3) return `Three Haleakalās, summit-to-sea.`;
  if (ft >= haleakala) return `Roughly one Haleakalā, summit to sea.`;
  if (ft >= 5000) return `Half a Haleakalā. Not nothing.`;
  return `A few hills. The road keeps going up.`;
}
