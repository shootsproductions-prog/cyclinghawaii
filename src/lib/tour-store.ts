// Persistent log of Tour stage completions, stored in Vercel Blob.
// Idempotent — a given activity ID can only count once per stage.

import { put, list } from "@vercel/blob";

export interface StageCompletion {
  stageNumber: number;
  athleteKey: string; // "Vini P." style
  athleteFirstname: string;
  athleteLastname: string;
  activityId: number;
  activityName: string;
  distanceMi: number;
  elevationFt: number;
  movingMinutes: number;
  completedAt: number; // unix ms — when we recorded it
  rideDate: string; // ISO
}

interface TourYearLog {
  year: number;
  completions: StageCompletion[];
}

const BLOB_PATH_BASE = "tour-completions/";

function blobPathForYear(year: number): string {
  return `${BLOB_PATH_BASE}${year}.json`;
}

export async function loadCompletions(year: number): Promise<StageCompletion[]> {
  try {
    const path = blobPathForYear(year);
    const { blobs } = await list({ prefix: path });
    const exact = blobs.find((b) => b.pathname === path);
    if (!exact) return [];
    const res = await fetch(exact.url, { cache: "no-store" });
    if (!res.ok) return [];
    const log: TourYearLog = await res.json();
    return log.completions ?? [];
  } catch (err) {
    console.error("loadCompletions failed:", err);
    return [];
  }
}

export async function saveCompletions(
  year: number,
  completions: StageCompletion[]
): Promise<void> {
  const log: TourYearLog = { year, completions };
  await put(blobPathForYear(year), JSON.stringify(log, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/**
 * Idempotent merge: add new completions, skip duplicates by (activityId, stageNumber).
 * Returns true if anything new was added.
 */
export async function recordCompletions(
  year: number,
  newCompletions: StageCompletion[]
): Promise<boolean> {
  if (newCompletions.length === 0) return false;
  const existing = await loadCompletions(year);
  const seen = new Set(
    existing.map((c) => `${c.activityId}-${c.stageNumber}`)
  );
  const additions = newCompletions.filter(
    (c) => !seen.has(`${c.activityId}-${c.stageNumber}`)
  );
  if (additions.length === 0) return false;
  const merged = [...existing, ...additions];
  await saveCompletions(year, merged);
  return true;
}
