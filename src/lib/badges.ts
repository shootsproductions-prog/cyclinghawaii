import { put, list } from "@vercel/blob";
import { Challenge } from "./challenge";

export interface Badge {
  month: string;
  name: string;
  metric: string;
  metricLabel: string;
  goal: number;
  achieved: number;
  completedAt: string;
}

const BLOB_KEY = "badges.json";

export async function loadBadges(): Promise<Badge[]> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length === 0) return [];
    const res = await fetch(blobs.blobs[0].url);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function saveBadges(badges: Badge[]): Promise<void> {
  try {
    await put(BLOB_KEY, JSON.stringify(badges), {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error("Failed to save badges:", error);
  }
}

export async function checkAndAwardBadge(
  challenge: Challenge
): Promise<Badge[]> {
  const badges = await loadBadges();

  // Check if challenge is complete and badge not already awarded
  if (
    challenge.progressPct >= 100 &&
    !badges.some((b) => b.month === challenge.month)
  ) {
    const newBadge: Badge = {
      month: challenge.month,
      name: challenge.name,
      metric: challenge.metric,
      metricLabel: challenge.metricLabel,
      goal: challenge.goal,
      achieved: challenge.current,
      completedAt: new Date().toISOString(),
    };

    badges.unshift(newBadge);
    await saveBadges(badges);
  }

  return badges;
}
