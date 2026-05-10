import { put, list } from "@vercel/blob";
import { Challenge } from "./challenge";

export interface Badge {
  month: string; // "2026-04"
  monthLabel: string; // "April 2026"
  name: string;
  description: string;
  metric: string;
  metricLabel: string;
  goal: number;
  achieved: number;
  status: "earned" | "missed";
  completedAt: string;
}

const BLOB_KEY = "badges.json";

function formatMonthLabel(month: string): string {
  // month is "YYYY-MM" — render "April 2026"
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface RawBadge {
  month?: string;
  monthLabel?: string;
  name?: string;
  description?: string;
  metric?: string;
  metricLabel?: string;
  goal?: number;
  achieved?: number;
  status?: "earned" | "missed";
  completedAt?: string;
}

/** Migrate any old-shape badges (pre-status / pre-monthLabel) to the new shape. */
function normalizeBadge(raw: RawBadge): Badge {
  return {
    month: raw.month ?? "",
    monthLabel: raw.monthLabel ?? formatMonthLabel(raw.month ?? ""),
    name: raw.name ?? "Untitled Challenge",
    description: raw.description ?? "",
    metric: raw.metric ?? "miles",
    metricLabel: raw.metricLabel ?? "Miles",
    goal: typeof raw.goal === "number" ? raw.goal : 0,
    achieved: typeof raw.achieved === "number" ? raw.achieved : 0,
    // Pre-existing badges only existed when earned, so default to "earned"
    status: raw.status === "missed" ? "missed" : "earned",
    completedAt: raw.completedAt ?? new Date().toISOString(),
  };
}

export async function loadBadges(): Promise<Badge[]> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length === 0) return [];
    const res = await fetch(blobs.blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    const raw: RawBadge[] = await res.json();
    return raw.map(normalizeBadge);
  } catch {
    return [];
  }
}

async function saveBadges(badges: Badge[]): Promise<void> {
  try {
    await put(BLOB_KEY, JSON.stringify(badges), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    console.error("Failed to save badges:", error);
  }
}

/**
 * Finalize a challenge as a badge.
 *
 * - If the challenge is complete (>=100%) → award an "earned" badge immediately.
 * - If the challenge's month is already in the past and not yet earned → award a "missed" badge.
 * - If the challenge is still in its active month and not yet complete → do nothing yet.
 *
 * Idempotent — never creates duplicate badges for the same month.
 */
export async function finalizeMonthlyBadge(
  challenge: Challenge
): Promise<Badge[]> {
  const badges = await loadBadges();
  const existing = badges.find((b) => b.month === challenge.month);
  if (existing) return badges; // already finalized

  const earned = challenge.progressPct >= 100;
  const month = challenge.month;
  const isPastMonth = month < getCurrentMonth();

  // Don't award a "missed" badge for a month that's still active —
  // the cyclist might still hit the goal before month-end.
  if (!earned && !isPastMonth) {
    return badges;
  }

  const newBadge: Badge = {
    month,
    monthLabel: challenge.monthLabel,
    name: challenge.name,
    description: challenge.description,
    metric: challenge.metric,
    metricLabel: challenge.metricLabel,
    goal: challenge.goal,
    achieved: Math.round(challenge.current),
    status: earned ? "earned" : "missed",
    completedAt: new Date().toISOString(),
  };

  badges.unshift(newBadge);
  await saveBadges(badges);
  return badges;
}

// Backward-compat alias for the older name used in page.tsx.
export const checkAndAwardBadge = finalizeMonthlyBadge;
