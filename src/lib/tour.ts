// Tour de Maui orchestration — completion detection, standings, jerseys.

import { cache } from "react";
import { getAccessToken } from "./strava";
import { metersToMiles, metersToFeet } from "./formatters";
import { findStageByActivity, TOUR_STAGES, type TourStage } from "./tour-stages";
import {
  loadCompletions,
  recordCompletions,
  type StageCompletion,
} from "./tour-store";
import type { StravaActivity } from "@/types/strava";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

interface SegmentEffortLite {
  elapsed_time: number;
  segment: { id: number; name: string };
}

interface DetailedActivity extends StravaActivity {
  segment_efforts?: SegmentEffortLite[];
}

/** Fetch full activity detail (with segment_efforts) for verification. */
async function fetchActivityDetail(
  activityId: number,
  token: string
): Promise<DetailedActivity | null> {
  try {
    const res = await fetch(
      `${STRAVA_API_BASE}/activities/${activityId}?include_all_efforts=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        // Once an activity is uploaded, segment efforts are stable — long cache OK.
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("fetchActivityDetail failed:", err);
    return null;
  }
}

function findSegmentMatch(
  detail: DetailedActivity,
  segmentId: number
): SegmentEffortLite | null {
  for (const effort of detail.segment_efforts ?? []) {
    if (effort.segment?.id === segmentId) return effort;
  }
  return null;
}

/** Pull recent activities and detect any newly tagged Tour completions. */
async function syncFromVini(): Promise<void> {
  if (!process.env.STRAVA_REFRESH_TOKEN) return;
  try {
    const token = await getAccessToken();
    const res = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?per_page=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 900, tags: ["tour-sync"] },
      }
    );
    if (!res.ok) return;
    const activities: StravaActivity[] = await res.json();

    // Already-recorded activity IDs (avoid re-fetching detail)
    const currentYear = new Date().getFullYear();
    const existing = await loadCompletions(currentYear);
    const seenKeys = new Set(
      existing.map((c) => `${c.activityId}-${c.stageNumber}`)
    );

    // Group new completions by year
    const byYear = new Map<number, StageCompletion[]>();
    for (const a of activities) {
      if (
        a.type !== "Ride" &&
        a.sport_type !== "Ride" &&
        a.sport_type !== "GravelRide"
      )
        continue;
      const stage = findStageByActivity(a.name);
      if (!stage) continue;

      const completionKey = `${a.id}-${stage.number}`;
      if (seenKeys.has(completionKey)) continue;

      // Verify if the stage has a segmentId
      let verified = false;
      let segmentEffortSeconds: number | undefined;
      if (stage.segmentId) {
        const detail = await fetchActivityDetail(a.id, token);
        if (detail) {
          const match = findSegmentMatch(detail, stage.segmentId);
          if (match) {
            verified = true;
            segmentEffortSeconds = match.elapsed_time;
          }
        }
      }

      const year = new Date(a.start_date_local).getFullYear();
      const completion: StageCompletion = {
        stageNumber: stage.number,
        athleteKey: "Vini P.",
        athleteFirstname: "Vini",
        athleteLastname: "Pimenta",
        activityId: a.id,
        activityName: a.name,
        distanceMi: Math.round(metersToMiles(a.distance) * 10) / 10,
        elevationFt: Math.round(metersToFeet(a.total_elevation_gain)),
        movingMinutes: Math.round(a.moving_time / 60),
        completedAt: Date.now(),
        rideDate: a.start_date_local,
        verified,
        segmentEffortSeconds,
      };
      const list = byYear.get(year) ?? [];
      list.push(completion);
      byYear.set(year, list);
    }

    for (const [year, completions] of byYear) {
      await recordCompletions(year, completions);
    }
  } catch (err) {
    console.error("Tour syncFromVini failed:", err);
  }
}

// ─── Standings ───────────────────────────────────────────────────────

export interface AthleteStanding {
  athleteKey: string;
  firstname: string;
  lastname: string;
  stagesCompleted: number;
  verifiedStages: number;
  totalElevationFt: number;
  totalMinutes: number;
  totalDistanceMi: number;
  firstCompletionAt: number;
  stageNumbers: number[]; // which stages they've finished
  verifiedStageNumbers: number[]; // subset that are segment-verified
}

export interface JerseyHolder {
  jersey: "yellow" | "polka" | "green" | "white" | "lanterne";
  athleteKey: string;
  firstname: string;
  lastname: string;
  stat: string;
  statValue: string;
  metric: string;
}

export interface TourStandings {
  year: number;
  totalCompletions: number;
  uniqueAthletes: number;
  ridersByStages: AthleteStanding[];
  jerseys: JerseyHolder[];
  /** stageNumber → number of completions */
  stageCompletionCounts: Map<number, number>;
  /** stageNumber → list of riders who finished it (with their data) */
  stageFinishers: Map<number, StageCompletion[]>;
}

function buildStandings(
  year: number,
  completions: StageCompletion[]
): TourStandings {
  const byAthlete = new Map<string, AthleteStanding>();
  const stageCompletionCounts = new Map<number, number>();
  const stageFinishers = new Map<number, StageCompletion[]>();

  for (const c of completions) {
    // Stage tally
    stageCompletionCounts.set(
      c.stageNumber,
      (stageCompletionCounts.get(c.stageNumber) ?? 0) + 1
    );
    const finishers = stageFinishers.get(c.stageNumber) ?? [];
    finishers.push(c);
    stageFinishers.set(c.stageNumber, finishers);

    // Athlete tally — count one stage once even if completed twice
    const existing = byAthlete.get(c.athleteKey);
    if (!existing) {
      byAthlete.set(c.athleteKey, {
        athleteKey: c.athleteKey,
        firstname: c.athleteFirstname,
        lastname: c.athleteLastname,
        stagesCompleted: 1,
        verifiedStages: c.verified ? 1 : 0,
        totalElevationFt: c.elevationFt,
        totalMinutes: c.movingMinutes,
        totalDistanceMi: c.distanceMi,
        firstCompletionAt: c.completedAt,
        stageNumbers: [c.stageNumber],
        verifiedStageNumbers: c.verified ? [c.stageNumber] : [],
      });
    } else {
      // Tally cumulative even on re-rides of the same stage (rewards consistency)
      existing.totalElevationFt += c.elevationFt;
      existing.totalMinutes += c.movingMinutes;
      existing.totalDistanceMi += c.distanceMi;
      if (!existing.stageNumbers.includes(c.stageNumber)) {
        existing.stagesCompleted += 1;
        existing.stageNumbers.push(c.stageNumber);
      }
      if (c.verified && !existing.verifiedStageNumbers.includes(c.stageNumber)) {
        existing.verifiedStages += 1;
        existing.verifiedStageNumbers.push(c.stageNumber);
      }
    }
  }

  const ridersByStages = Array.from(byAthlete.values()).sort((a, b) => {
    if (b.stagesCompleted !== a.stagesCompleted)
      return b.stagesCompleted - a.stagesCompleted;
    return a.totalMinutes - b.totalMinutes; // tiebreak: faster overall
  });

  // ── Jerseys ──
  const jerseys: JerseyHolder[] = [];

  if (ridersByStages.length > 0) {
    const yellow = ridersByStages[0];
    jerseys.push({
      jersey: "yellow",
      athleteKey: yellow.athleteKey,
      firstname: yellow.firstname,
      lastname: yellow.lastname,
      stat: `${yellow.stagesCompleted} stages`,
      statValue: yellow.stagesCompleted.toString(),
      metric: "Stages completed",
    });

    const polka = [...ridersByStages].sort(
      (a, b) => b.totalElevationFt - a.totalElevationFt
    )[0];
    jerseys.push({
      jersey: "polka",
      athleteKey: polka.athleteKey,
      firstname: polka.firstname,
      lastname: polka.lastname,
      stat: `${polka.totalElevationFt.toLocaleString()} ft`,
      statValue: polka.totalElevationFt.toLocaleString(),
      metric: "Total elevation",
    });

    // Green jersey: most stages, fastest cumulative time among those completing many
    const green = [...ridersByStages]
      .filter((r) => r.totalMinutes > 0)
      .sort((a, b) => {
        if (b.stagesCompleted !== a.stagesCompleted)
          return b.stagesCompleted - a.stagesCompleted;
        return a.totalMinutes - b.totalMinutes;
      })[0];
    if (green) {
      const hours = Math.floor(green.totalMinutes / 60);
      const mins = green.totalMinutes % 60;
      jerseys.push({
        jersey: "green",
        athleteKey: green.athleteKey,
        firstname: green.firstname,
        lastname: green.lastname,
        stat: `${hours}h ${mins}m`,
        statValue: `${hours}h ${mins}m`,
        metric: "Total moving time",
      });
    }

    // White jersey: most stages by anyone whose first completion is within 30 days
    const now = Date.now();
    const newcomers = ridersByStages.filter(
      (r) => now - r.firstCompletionAt < 1000 * 60 * 60 * 24 * 30
    );
    const white = newcomers[0];
    if (white) {
      jerseys.push({
        jersey: "white",
        athleteKey: white.athleteKey,
        firstname: white.firstname,
        lastname: white.lastname,
        stat: `${white.stagesCompleted} stages`,
        statValue: white.stagesCompleted.toString(),
        metric: "Best newcomer (30 days)",
      });
    }

    if (ridersByStages.length > 1) {
      const lanterne = ridersByStages[ridersByStages.length - 1];
      jerseys.push({
        jersey: "lanterne",
        athleteKey: lanterne.athleteKey,
        firstname: lanterne.firstname,
        lastname: lanterne.lastname,
        stat: `${lanterne.stagesCompleted} stage${
          lanterne.stagesCompleted === 1 ? "" : "s"
        }`,
        statValue: lanterne.stagesCompleted.toString(),
        metric: "Last in standings, first in our hearts",
      });
    }
  }

  return {
    year,
    totalCompletions: completions.length,
    uniqueAthletes: byAthlete.size,
    ridersByStages,
    jerseys,
    stageCompletionCounts,
    stageFinishers,
  };
}

/** Public entrypoint: detect new completions, then return standings for current year. */
export const getTourStandings = cache(
  async (): Promise<TourStandings> => {
    await syncFromVini();
    const year = new Date().getFullYear();
    const completions = await loadCompletions(year);
    return buildStandings(year, completions);
  }
);

export function stageProgressLabel(stage: TourStage, count: number): string {
  if (count === 0) return "Awaiting first finisher";
  if (count === 1) return "1 finisher";
  return `${count} finishers`;
}
