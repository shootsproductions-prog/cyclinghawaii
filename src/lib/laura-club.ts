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
  "Has a favorite gas station. Don't ask why.",
  "Average speed: deceptive. Never the slowest.",
  "Climbs Haleakalā for fun. Allegedly.",
  "Owns more chamois cream than groceries.",
  "Quiet rider. Loud at the coffee stop.",
  "First one out. Last one back. No witnesses.",
  "Knows every shoulder on every road.",
  "Has opinions about tire pressure. Strong ones.",
  "Rides like the wind. Specifically: into it.",
  "Counts climbs in feet. Like a native.",
  "Always smiling at mile 40. We don't trust it.",
  "Refuses Strava titles. Lets the data speak.",
  "Has been seen ordering a second malasada.",
  "Bonk avoidance specialist.",
  "Will descend faster than physics allows.",
  "Has a route for every wind direction.",
  "Treats stop signs as stretching opportunities.",
  "Keeps spare socks in the saddle bag. Iconic.",
  "Once rode a century by accident.",
  "Knows the trades like a paniolo knows pasture.",
  "Pacelines of one. Always.",
  "Has a thing for sunrise rides. Earned it.",
  "Quietly putting in the work. Always.",
  "The kind of rider who calls 30 mi 'a spin.'",
  "Strong on hills. Stronger on the way home.",
  "Coffee first. Climbing second. Conversation never.",
];

const FOUNDER_LINE =
  "Founded the club. Rides solo, mostly. Roasts himself first.";

// Stable hash from a string → small int.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Seeded mulberry32 PRNG so the shuffle is deterministic per-roster.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function memberKey(m: ClubMember): string {
  return `${m.firstname} ${m.lastname}`;
}

function isFounder(m: ClubMember): boolean {
  const f = m.firstname.toLowerCase();
  return f.startsWith("vinic") || f.startsWith("vini");
}

/**
 * Build a roster → line map with NO duplicates among the visible members.
 * The mapping is stable for the same roster identity (members + order),
 * so a member sees their assigned line consistently while it stays unique.
 */
export function rosterLinesFor(
  members: ClubMember[]
): Map<string, string> {
  const result = new Map<string, string>();
  const nonFounders: ClubMember[] = [];

  for (const m of members) {
    if (isFounder(m)) {
      result.set(memberKey(m), FOUNDER_LINE);
    } else {
      nonFounders.push(m);
    }
  }

  // Stable seed from the entire roster identity.
  const seed = hash(members.map(memberKey).sort().join("|"));
  const rng = mulberry32(seed);

  // Fisher-Yates shuffle of the line pool with the seeded RNG.
  const pool = [...ROSTER_LINES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Assign in roster order. Pool is large enough that we never wrap.
  nonFounders.forEach((m, i) => {
    result.set(memberKey(m), pool[i % pool.length]);
  });

  return result;
}

// Kept for back-compat / single-member callers (no dedup guarantee).
export function rosterLineFor(member: ClubMember): string {
  if (isFounder(member)) return FOUNDER_LINE;
  return ROSTER_LINES[hash(memberKey(member)) % ROSTER_LINES.length];
}

/**
 * Safe initial — first letter character only.
 * Usernames like "@JAW.SURF" lose the punctuation, so the avatar
 * fallback never shows weird symbols like "@".
 */
export function safeInitial(name: string): string {
  const m = name.match(/[A-Za-z]/);
  return m ? m[0].toUpperCase() : "?";
}

// ── The Wall — one-line narration per ride ──────────────────────────

const TAGGED_LINES = [
  "Answered the call. Mahalo for the tag.",
  "Used the magic word. The Roster is watching.",
  "Tagged us in. Free roast credit, redeemable anytime.",
  "Played the hashtag right. We see you.",
  "#cyclinghawaii spotted. Laura nodded.",
];

export function isTagged(a: ClubActivity): boolean {
  return /#?cyclinghawaii/i.test(a.name);
}

export function wallLineFor(a: ClubActivity): string {
  if (isTagged(a)) {
    return TAGGED_LINES[hash(a.name) % TAGGED_LINES.length];
  }

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

// ── Sport-type accents for the Wall ─────────────────────────────────
export function sportTypeColor(sport: string | undefined, type: string): {
  label: string;
  bg: string;
  text: string;
} {
  const t = sport || type || "Ride";
  switch (t) {
    case "GravelRide":
      return { label: "Gravel", bg: "bg-[#b45309]/15", text: "text-[#b45309]" };
    case "MountainBikeRide":
      return { label: "MTB", bg: "bg-[#059669]/15", text: "text-[#059669]" };
    case "VirtualRide":
      return { label: "Indoor", bg: "bg-[#7c3aed]/15", text: "text-[#7c3aed]" };
    case "EBikeRide":
      return { label: "E-Bike", bg: "bg-[#0ea5e9]/15", text: "text-[#0ea5e9]" };
    case "Ride":
    default:
      return { label: "Road", bg: "bg-strava/15", text: "text-strava" };
  }
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
