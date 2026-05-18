// The Honor Roll — Cycling Hawaii's multi-axis recognition system.
//
// Strava reduces every rider to a number. We name them characters
// instead. Each distinction in the catalog below is a deterministic
// rule that reads the club's recent activity feed and picks a winner.
// The same data, queried different ways, produces ten different stories.
//
// Design constraints:
//   - Pure functions. Same input → same output, no side effects, no
//     network. Easy to test, easy to render at ISR time.
//   - Club /activities API returns SummaryActivity without timestamps
//     (Strava strips them for privacy). So no "Early Bird" / "Sunset
//     Soldier" tonight — only distinctions computable from distance,
//     moving_time, total_elevation_gain, and sport_type.
//   - When data is too sparse to award a distinction (no qualifying
//     rides), we return null and the section simply doesn't render
//     that one.
//   - Ties broken alphabetically by rider key, deterministically.
//
// Adding a new distinction: append to DISTINCTIONS below. Each one is
// self-contained — define its rule, ship it.

import type { ClubActivity, ClubMember } from "./club";

const MI_PER_M = 1 / 1609.34;
const FT_PER_M = 3.28084;

/** "First L." display key — matches the rest of the club UI. */
function riderKey(a: { firstname: string; lastname: string }): string {
  return `${a.firstname} ${a.lastname[0]}.`;
}

/** Treat anything that smells like cycling as a Ride. */
function isRide(a: ClubActivity): boolean {
  const t = (a.sport_type || a.type || "").toLowerCase();
  return t.includes("ride");
}

function isGravel(a: ClubActivity): boolean {
  const t = (a.sport_type || a.type || "").toLowerCase();
  return t === "gravelride" || t.includes("gravel");
}

/** Sort + tiebreak: numeric desc, then alpha asc on rider key. */
function pickWinner<T extends { key: string; value: number }>(
  entries: T[]
): T | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort(
    (a, b) => b.value - a.value || a.key.localeCompare(b.key)
  );
  // Drop zero-value winners — no point naming "The Climber" with 0 ft.
  return sorted[0].value > 0 ? sorted[0] : null;
}

// ─── Public types ──────────────────────────────────────────────

export interface Distinction {
  id: string;
  label: string;
  /** Short Laura-style description of what this honors. */
  description: string;
  /**
   * Compute the winner from current club data. Return null if no rider
   * qualifies — the UI will skip rendering this distinction.
   */
  compute: (
    activities: ClubActivity[],
    members: ClubMember[]
  ) => AwardedDistinction | null;
}

export interface AwardedDistinction {
  id: string;
  label: string;
  description: string;
  /** "First L." form, used for join with members → avatar/profile. */
  winnerKey: string;
  /** Display name "First Last". */
  winnerName: string;
  /** The qualifying stat, formatted for display. e.g. "12,420 ft". */
  statText: string;
}

// ─── Helpers that aggregate activities by rider ────────────────

type RiderAgg = {
  key: string;
  firstname: string;
  lastname: string;
  miles: number;
  feetClimbed: number;
  rideCount: number;
  longestRideMi: number;
  longestRideMin: number;
  /** sum of speed * moving_time weights → divide by total moving_time for true average mph */
  movingTimeSec: number;
  gravelMiles: number;
};

function aggregateByRider(activities: ClubActivity[]): Map<string, RiderAgg> {
  const map = new Map<string, RiderAgg>();
  for (const a of activities) {
    if (!isRide(a)) continue;
    const key = riderKey(a.athlete);
    const cur =
      map.get(key) ??
      ({
        key,
        firstname: a.athlete.firstname,
        lastname: a.athlete.lastname,
        miles: 0,
        feetClimbed: 0,
        rideCount: 0,
        longestRideMi: 0,
        longestRideMin: 0,
        movingTimeSec: 0,
        gravelMiles: 0,
      } as RiderAgg);
    const mi = a.distance * MI_PER_M;
    const ft = a.total_elevation_gain * FT_PER_M;
    cur.miles += mi;
    cur.feetClimbed += ft;
    cur.rideCount += 1;
    cur.movingTimeSec += a.moving_time;
    cur.longestRideMi = Math.max(cur.longestRideMi, mi);
    cur.longestRideMin = Math.max(cur.longestRideMin, a.moving_time / 60);
    if (isGravel(a)) cur.gravelMiles += mi;
    map.set(key, cur);
  }
  return map;
}

function awardFromAgg(
  agg: RiderAgg,
  id: string,
  label: string,
  description: string,
  statText: string
): AwardedDistinction {
  return {
    id,
    label,
    description,
    winnerKey: agg.key,
    winnerName: `${agg.firstname} ${agg.lastname}`,
    statText,
  };
}

// ─── The Distinction catalog ──────────────────────────────────

export const DISTINCTIONS: Distinction[] = [
  {
    id: "rouleur",
    label: "The Rouleur",
    description: "Most miles in the feed. The engine of the club.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      const entries = [...agg.values()].map((r) => ({
        ...r,
        value: r.miles,
      }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "rouleur",
        "The Rouleur",
        "Most miles in the feed. The engine of the club.",
        `${Math.round(w.miles).toLocaleString()} mi`
      );
    },
  },
  {
    id: "climber",
    label: "The Climber",
    description: "Most vertical gain. Gravity disagrees.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      const entries = [...agg.values()].map((r) => ({
        ...r,
        value: r.feetClimbed,
      }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "climber",
        "The Climber",
        "Most vertical gain. Gravity disagrees.",
        `${Math.round(w.feetClimbed).toLocaleString()} ft`
      );
    },
  },
  {
    id: "long-hauler",
    label: "The Long Hauler",
    description: "Longest single ride in the feed.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      const entries = [...agg.values()].map((r) => ({
        ...r,
        value: r.longestRideMi,
      }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "long-hauler",
        "The Long Hauler",
        "Longest single ride in the feed.",
        `${Math.round(w.longestRideMi)} mi`
      );
    },
  },
  {
    id: "solo-hour",
    label: "The Solo Hour",
    description: "Longest single ride — by time on the bike.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      const entries = [...agg.values()].map((r) => ({
        ...r,
        value: r.longestRideMin,
      }));
      const w = pickWinner(entries);
      if (!w) return null;
      const h = Math.floor(w.longestRideMin / 60);
      const m = Math.round(w.longestRideMin % 60);
      const text = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return awardFromAgg(
        w,
        "solo-hour",
        "The Solo Hour",
        "Longest single ride — by time on the bike.",
        text
      );
    },
  },
  {
    id: "sprinter",
    label: "The Sprinter",
    description: "Fastest average pace in the feed.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      // Require at least 5 miles total to qualify — single short rides
      // can spike avg speed unrealistically.
      const entries = [...agg.values()]
        .filter((r) => r.miles >= 5 && r.movingTimeSec > 0)
        .map((r) => ({
          ...r,
          value: r.miles / (r.movingTimeSec / 3600),
        }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "sprinter",
        "The Sprinter",
        "Fastest average pace in the feed.",
        `${w.value.toFixed(1)} mph`
      );
    },
  },
  {
    id: "gravel-grinder",
    label: "The Gravel Grinder",
    description: "Most gravel miles. Tire choice as identity.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      const entries = [...agg.values()].map((r) => ({
        ...r,
        value: r.gravelMiles,
      }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "gravel-grinder",
        "The Gravel Grinder",
        "Most gravel miles. Tire choice as identity.",
        `${Math.round(w.gravelMiles)} mi gravel`
      );
    },
  },
  {
    id: "persistent",
    label: "The Persistent",
    description: "Most rides logged. Shows up, every time.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      const entries = [...agg.values()].map((r) => ({
        ...r,
        value: r.rideCount,
      }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "persistent",
        "The Persistent",
        "Most rides logged. Shows up, every time.",
        `${w.rideCount} rides`
      );
    },
  },
  {
    id: "iron-calves",
    label: "The Iron Calves",
    description: "Highest climbing density. Steepest miles per mile.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      // Require at least 10 miles total so the density isn't just one
      // wall-of-a-segment skewing it.
      const entries = [...agg.values()]
        .filter((r) => r.miles >= 10)
        .map((r) => ({
          ...r,
          value: r.feetClimbed / r.miles,
        }));
      const w = pickWinner(entries);
      if (!w) return null;
      return awardFromAgg(
        w,
        "iron-calves",
        "The Iron Calves",
        "Highest climbing density. Steepest miles per mile.",
        `${Math.round(w.value).toLocaleString()} ft/mi`
      );
    },
  },
  {
    id: "lanterne-rouge",
    label: "Lanterne Rouge",
    description: "Last across the line. First in our hearts.",
    compute(activities) {
      const agg = aggregateByRider(activities);
      // Active = appears in the feed at all. Lanterne is the lowest
      // miles among active members. Skip if fewer than 3 active riders
      // (the joke doesn't land when "last" is "second of two").
      const active = [...agg.values()].filter((r) => r.miles > 0);
      if (active.length < 3) return null;
      const sorted = [...active].sort(
        (a, b) => a.miles - b.miles || a.key.localeCompare(b.key)
      );
      const w = sorted[0];
      return {
        id: "lanterne-rouge",
        label: "Lanterne Rouge",
        description: "Last across the line. First in our hearts.",
        winnerKey: w.key,
        winnerName: `${w.firstname} ${w.lastname}`,
        statText: `${Math.round(w.miles)} mi · still counts`,
      };
    },
  },
  {
    id: "recruit",
    label: "The Recruit",
    description: "Newest face. Promising legs.",
    compute(activities, members) {
      // Strava /clubs/:id/members returns members in join order, newest
      // first. We trust that ordering. If empty, no award.
      if (members.length === 0) return null;
      const m = members[0];
      const agg = aggregateByRider(activities).get(riderKey(m));
      const miles = agg ? Math.round(agg.miles) : 0;
      return {
        id: "recruit",
        label: "The Recruit",
        description: "Newest face. Promising legs.",
        winnerKey: riderKey(m),
        winnerName: `${m.firstname} ${m.lastname}`,
        statText:
          miles > 0
            ? `${miles} mi so far`
            : "Just signed on — let's see what they've got",
      };
    },
  },
];

/**
 * Run every distinction's rule over the current club data and return
 * the awarded list. Distinctions that have no qualifying rider are
 * silently dropped.
 */
export function computeHonorRoll(
  activities: ClubActivity[],
  members: ClubMember[]
): AwardedDistinction[] {
  const awards: AwardedDistinction[] = [];
  for (const d of DISTINCTIONS) {
    const award = d.compute(activities, members);
    if (award) awards.push(award);
  }
  return awards;
}
