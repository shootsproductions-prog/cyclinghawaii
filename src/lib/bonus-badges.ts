import { put, list } from "@vercel/blob";
import { StravaActivity, FormattedStats } from "@/types/strava";
import { metersToMiles, metersToFeet } from "./formatters";

export type BonusBadgeId =
  | "first-century"
  | "haleakala-crown"
  | "month-streak"
  | "six-thousand-mile-year";

export interface BonusBadge {
  id: BonusBadgeId;
  name: string;
  description: string;
  iconKey: string;
  earnedAt: string;
  details?: string;
  rideId?: number;
  rideName?: string;
  rideDate?: string;
}

const BLOB_KEY = "bonus-badges.json";

export async function loadBonusBadges(): Promise<BonusBadge[]> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length === 0) return [];
    const res = await fetch(blobs.blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function saveBonusBadges(badges: BonusBadge[]): Promise<void> {
  try {
    await put(BLOB_KEY, JSON.stringify(badges), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    console.error("Failed to save bonus badges:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Detection helpers
// ─────────────────────────────────────────────────────────────────────

function isRide(a: StravaActivity): boolean {
  return a.type === "Ride" || a.sport_type === "Ride";
}

/** Longest streak of consecutive ride-days inside the given activities. */
function longestConsecutiveRideStreak(activities: StravaActivity[]): number {
  const rideDays = new Set(
    activities
      .filter(isRide)
      .map((a) => a.start_date_local.slice(0, 10))
  );
  if (rideDays.size === 0) return 0;

  const sorted = Array.from(rideDays).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const curr = new Date(sorted[i] + "T00:00:00Z");
    const dayDiff = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayDiff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

/** Parse a formatted stats string like "1,247" → 1247. Empty/garbage → 0. */
function parseFormattedNumber(s: string): number {
  const n = parseInt(s.replace(/[,]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

// ─────────────────────────────────────────────────────────────────────
// All bonus badge checks. Each returns the badge data if criteria met,
// or null otherwise. Award logic is idempotent — if it's already in the
// existing list, it won't be re-awarded.
// ─────────────────────────────────────────────────────────────────────

type Detected = Omit<BonusBadge, "earnedAt">;

function detectBonusBadges(
  activities: StravaActivity[],
  stats: FormattedStats
): Detected[] {
  const out: Detected[] = [];
  const rides = activities.filter(isRide);

  // 🏔️ First Century — single ride distance >= 100 mi
  const century = rides.find((a) => metersToMiles(a.distance) >= 100);
  if (century) {
    out.push({
      id: "first-century",
      name: "First Century",
      description: "Crossed 100 miles in a single ride",
      iconKey: "century",
      details: `${metersToMiles(century.distance).toFixed(1)} mi`,
      rideId: century.id,
      rideName: century.name,
      rideDate: century.start_date_local.slice(0, 10),
    });
  }

  // 🌋 Haleakala Crown — single ride elevation >= 9,500 ft
  const haleakala = rides.find(
    (a) => metersToFeet(a.total_elevation_gain) >= 9500
  );
  if (haleakala) {
    out.push({
      id: "haleakala-crown",
      name: "Haleakala Crown",
      description: "9,500+ feet of climbing in a single ride",
      iconKey: "crown",
      details: `${Math.round(metersToFeet(haleakala.total_elevation_gain)).toLocaleString()} ft`,
      rideId: haleakala.id,
      rideName: haleakala.name,
      rideDate: haleakala.start_date_local.slice(0, 10),
    });
  }

  // 🔥 30-Day Streak — 30 consecutive days with at least one ride
  const streak = longestConsecutiveRideStreak(activities);
  if (streak >= 30) {
    out.push({
      id: "month-streak",
      name: "30-Day Streak",
      description: "Rode at least once a day for 30 days straight",
      iconKey: "fire",
      details: `${streak} consecutive days`,
    });
  }

  // 💎 6,000 Mile Year — YTD total over 6,000 miles
  const ytdMiles = parseFormattedNumber(stats.totalMiles);
  if (ytdMiles >= 6000) {
    out.push({
      id: "six-thousand-mile-year",
      name: "6K Year",
      description: "Crossed 6,000 miles year-to-date",
      iconKey: "diamond",
      details: `${ytdMiles.toLocaleString()} miles`,
    });
  }

  return out;
}

/** Run all bonus checks. Awards any newly earned ones to the persistent store. */
export async function awardBonusBadges(
  activities: StravaActivity[],
  stats: FormattedStats
): Promise<BonusBadge[]> {
  const existing = await loadBonusBadges();
  const existingIds = new Set(existing.map((b) => b.id));

  const detected = detectBonusBadges(activities, stats);
  const newOnes: BonusBadge[] = detected
    .filter((d) => !existingIds.has(d.id))
    .map((d) => ({ ...d, earnedAt: new Date().toISOString() }));

  if (newOnes.length === 0) return existing;

  const updated = [...existing, ...newOnes];
  await saveBonusBadges(updated);
  return updated;
}
