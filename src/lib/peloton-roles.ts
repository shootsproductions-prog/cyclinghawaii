// Auto-assign peloton roles to The Twelve based on recent club activity.
// Each role lands on exactly one member. Stable across renders for the
// same roster + activity feed.

import type { ClubMember, ClubActivity } from "./club";

interface MemberStats {
  miles: number;
  elevationFt: number;
  rides: number;
  movingHours: number;
  avgMph: number;
  elevPerMi: number;
}

interface RoleAssignment {
  role: string;
  blurb: string; // small italic line under role
}

const FALLBACK_POOL: RoleAssignment[] = [
  { role: "Domestique", blurb: "Carries the wheels. Asks for nothing." },
  { role: "Puncheur", blurb: "Short hills, big efforts. No cruising." },
  { role: "Time Trialist", blurb: "Solo against the clock. Always." },
  { role: "Veteran", blurb: "Been here. Seen weather. Says little." },
  { role: "Recruit", blurb: "New blood. Promising legs." },
  { role: "Ghost", blurb: "Rarely seen. Always counted." },
  { role: "Wildcard", blurb: "Anything could happen. Usually does." },
  { role: "Road Captain", blurb: "Calls the line. Picks the coffee stop." },
  { role: "Closer", blurb: "Strongest in the last 10 miles." },
  { role: "Lieutenant", blurb: "Second in command. Sharper than first." },
];

function memberKey(m: ClubMember): string {
  return `${m.firstname} ${m.lastname[0]}.`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildStats(
  members: ClubMember[],
  activities: ClubActivity[]
): Map<string, MemberStats> {
  const map = new Map<string, MemberStats>();
  for (const m of members) {
    map.set(memberKey(m), {
      miles: 0,
      elevationFt: 0,
      rides: 0,
      movingHours: 0,
      avgMph: 0,
      elevPerMi: 0,
    });
  }
  for (const a of activities) {
    const key = `${a.athlete.firstname} ${a.athlete.lastname[0]}.`;
    const s = map.get(key);
    if (!s) continue;
    const miles = a.distance / 1609.34;
    const ftPerMi = miles > 0 ? (a.total_elevation_gain * 3.28084) / miles : 0;
    void ftPerMi;
    s.miles += miles;
    s.elevationFt += a.total_elevation_gain * 3.28084;
    s.rides += 1;
    s.movingHours += a.moving_time / 3600;
  }
  for (const s of map.values()) {
    s.avgMph = s.movingHours > 0 ? s.miles / s.movingHours : 0;
    s.elevPerMi = s.miles > 0 ? s.elevationFt / s.miles : 0;
  }
  return map;
}

export function assignRoles(
  members: ClubMember[],
  activities: ClubActivity[]
): Map<string, RoleAssignment> {
  const stats = buildStats(members, activities);
  const result = new Map<string, RoleAssignment>();
  const claimed = new Set<string>();

  const keys = members.map(memberKey);
  const active = keys.filter((k) => (stats.get(k)?.rides ?? 0) > 0);
  const inactive = keys.filter((k) => (stats.get(k)?.rides ?? 0) === 0);

  // 1. The Leader — most miles among active
  const leader = pickTop(active, stats, (s) => s.miles);
  if (leader) {
    result.set(leader, {
      role: "The Leader",
      blurb: "Top miles in the feed. The GC contender.",
    });
    claimed.add(leader);
  }

  // 2. The Sprinter — highest avg speed (min 5 miles to qualify)
  const sprinter = pickTop(
    active.filter((k) => !claimed.has(k)),
    stats,
    (s) => (s.miles >= 5 ? s.avgMph : 0)
  );
  if (sprinter) {
    result.set(sprinter, {
      role: "The Sprinter",
      blurb: "Fastest average in the feed. Bring the watts.",
    });
    claimed.add(sprinter);
  }

  // 3. The Climber — highest elev/mi (min 5 miles)
  const climber = pickTop(
    active.filter((k) => !claimed.has(k)),
    stats,
    (s) => (s.miles >= 5 ? s.elevPerMi : 0)
  );
  if (climber) {
    result.set(climber, {
      role: "The Climber",
      blurb: "Steepest miles per mile. Gravity disagrees.",
    });
    claimed.add(climber);
  }

  // 4. The Rouleur — most rides
  const rouleur = pickTop(
    active.filter((k) => !claimed.has(k)),
    stats,
    (s) => s.rides
  );
  if (rouleur) {
    result.set(rouleur, {
      role: "The Rouleur",
      blurb: "Most rides logged. Steady as the trades.",
    });
    claimed.add(rouleur);
  }

  // 5. The Lanterne Rouge — fewest miles among active (and not yet claimed)
  const lanterne = pickBottom(
    active.filter((k) => !claimed.has(k)),
    stats,
    (s) => s.miles
  );
  if (lanterne && !claimed.has(lanterne)) {
    result.set(lanterne, {
      role: "Lanterne Rouge",
      blurb: "Last in the standings. First in our hearts.",
    });
    claimed.add(lanterne);
  }

  // Fill remaining active members with fallback roles, hash-stable
  const unclaimedActive = active.filter((k) => !claimed.has(k));
  unclaimedActive.sort((a, b) => hash(a) - hash(b));
  unclaimedActive.forEach((k, i) => {
    result.set(k, FALLBACK_POOL[i % FALLBACK_POOL.length]);
  });

  // Inactive members → Recruit / Ghost
  inactive.forEach((k, i) => {
    result.set(k, i === 0
      ? { role: "Recruit", blurb: "New blood. Promising legs." }
      : { role: "Ghost", blurb: "Rarely seen. Always counted." }
    );
  });

  return result;
}

function pickTop(
  keys: string[],
  stats: Map<string, MemberStats>,
  score: (s: MemberStats) => number
): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const k of keys) {
    const s = stats.get(k);
    if (!s) continue;
    const sc = score(s);
    if (sc > bestScore) {
      bestScore = sc;
      best = k;
    }
  }
  return bestScore > 0 ? best : null;
}

function pickBottom(
  keys: string[],
  stats: Map<string, MemberStats>,
  score: (s: MemberStats) => number
): string | null {
  let worst: string | null = null;
  let worstScore = Infinity;
  for (const k of keys) {
    const s = stats.get(k);
    if (!s) continue;
    const sc = score(s);
    if (sc < worstScore && sc > 0) {
      worstScore = sc;
      worst = k;
    }
  }
  return worst;
}
