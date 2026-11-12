// Everything the coach looks at, computed from a list of rides.
// Pure: pass the rides, the rider's numbers and today's date.

import {
  dayKey,
  dayNumber,
  loadSeries,
  resolveProfile,
  rideLoad,
  weekStartOf,
  weekdayOf,
  type ResolvedProfile,
} from "./load";
import type {
  CoachAnalysis,
  CoachRide,
  IntensitySplit,
  LoadMethod,
  NotableEffort,
  PeriodTotals,
  RiderProfile,
  WeekSummary,
} from "./types";

/** Weeks shown in the volume chart. */
export const WEEKS_SHOWN = 12;
/** Days of fitness / fatigue history shown. */
export const LOAD_DAYS_SHOWN = 90;

// ── Intensity boundaries ────────────────────────────────────────────
// Three bands: easy, moderate, hard.
//
// Second-by-second data (imported files):
//   heart rate   below 80% of max / 80 to 90% / 90% and up. The same
//                boundaries the ride pages on this site already use
//                (zones 1-3, zone 4, zone 5).
//   power        below 76% of FTP / 76 to 105% / above 105%
//                (Coggan's endurance, tempo-to-threshold, and above).
//
// Ride averages only (Strava summaries): a whole ride is put in one
// band from its average, with lower cut-offs because an average
// includes coasting and stops.
export const HR_ZONE_EDGES = [0.8, 0.9];
export const POWER_ZONE_EDGES = [0.76, 1.05];
export const HR_RIDE_EDGES = [0.72, 0.82];
export const POWER_RIDE_EDGES = [0.75, 0.88];

interface DatedRide {
  ride: CoachRide;
  day: number;
  load: number;
  method: LoadMethod;
}

function totals(rides: DatedRide[]): PeriodTotals {
  const out: PeriodTotals = { rides: 0, hours: 0, distanceM: 0, climbM: 0, load: 0, longestSec: 0 };
  for (const { ride, load } of rides) {
    out.rides++;
    out.hours += ride.movingSec / 3600;
    out.distanceM += ride.distanceM;
    out.climbM += ride.climbM;
    out.load += load;
    if (ride.movingSec > out.longestSec) out.longestSec = ride.movingSec;
  }
  return out;
}

function weightedCadence(rides: DatedRide[]): number | undefined {
  let sum = 0;
  let seconds = 0;
  for (const { ride } of rides) {
    if (!ride.avgCadence || ride.avgCadence < 30) continue;
    sum += ride.avgCadence * ride.movingSec;
    seconds += ride.movingSec;
  }
  return seconds > 0 ? sum / seconds : undefined;
}

function band(fraction: number, edges: number[]): 0 | 1 | 2 {
  return fraction < edges[0] ? 0 : fraction < edges[1] ? 1 : 2;
}

function intensitySplit(rides: DatedRide[], profile: ResolvedProfile): IntensitySplit {
  const empty: IntensitySplit = {
    basis: "none",
    signal: null,
    easyPct: 0,
    moderatePct: 0,
    hardPct: 0,
    hours: 0,
    ridesWithData: 0,
    ridesTotal: rides.length,
  };
  if (rides.length === 0) return empty;

  const totalSec = rides.reduce((s, r) => s + r.ride.movingSec, 0);

  // 1. True time in zone, where rides carry second-by-second data.
  const zone = [0, 0, 0];
  let zoneRides = 0;
  let zoneRideSec = 0;
  let usedPower = 0;
  for (const { ride } of rides) {
    if (profile.ftp && ride.powerHist?.length) {
      for (let bin = 0; bin < ride.powerHist.length; bin++) {
        const s = ride.powerHist[bin];
        if (s) zone[band((bin * 10 + 5) / profile.ftp, POWER_ZONE_EDGES)] += s;
      }
      zoneRides++;
      usedPower++;
      zoneRideSec += ride.movingSec;
    } else if (ride.hrHist?.length) {
      for (let bpm = 0; bpm < ride.hrHist.length; bpm++) {
        const s = ride.hrHist[bpm];
        if (s) zone[band(bpm / profile.maxHr, HR_ZONE_EDGES)] += s;
      }
      zoneRides++;
      zoneRideSec += ride.movingSec;
    }
  }
  const zoneTotal = zone[0] + zone[1] + zone[2];
  if (zoneTotal > 0 && zoneRideSec >= totalSec * 0.6) {
    return {
      basis: "time-in-zone",
      signal: usedPower > zoneRides / 2 ? "power" : "hr",
      easyPct: (zone[0] / zoneTotal) * 100,
      moderatePct: (zone[1] / zoneTotal) * 100,
      hardPct: (zone[2] / zoneTotal) * 100,
      hours: zoneTotal / 3600,
      ridesWithData: zoneRides,
      ridesTotal: rides.length,
    };
  }

  // 2. One band per ride, from its average.
  const byRide = [0, 0, 0];
  let withData = 0;
  let powerRides = 0;
  for (const { ride } of rides) {
    const power = ride.normPower ?? ride.avgPower;
    if (profile.ftp && power && ride.powerMeasured !== false) {
      byRide[band(power / profile.ftp, POWER_RIDE_EDGES)] += ride.movingSec;
      withData++;
      powerRides++;
    } else if (ride.avgHr) {
      byRide[band(ride.avgHr / profile.maxHr, HR_RIDE_EDGES)] += ride.movingSec;
      withData++;
    }
  }
  const rideTotal = byRide[0] + byRide[1] + byRide[2];
  if (rideTotal === 0) return empty;
  return {
    basis: "by-ride",
    signal: powerRides > withData / 2 ? "power" : "hr",
    easyPct: (byRide[0] / rideTotal) * 100,
    moderatePct: (byRide[1] / rideTotal) * 100,
    hardPct: (byRide[2] / rideTotal) * 100,
    hours: rideTotal / 3600,
    ridesWithData: withData,
    ridesTotal: rides.length,
  };
}

function shortDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

function notableEfforts(rides: DatedRide[]): NotableEffort[] {
  if (rides.length === 0) return [];
  const efforts: NotableEffort[] = [];
  const add = (label: string, value: string, r: DatedRide) =>
    efforts.push({ label, value, day: dayKey(r.day), rideName: r.ride.name });
  const best = (score: (r: DatedRide) => number | undefined): DatedRide | undefined => {
    let top: DatedRide | undefined;
    let topScore = 0;
    for (const r of rides) {
      const s = score(r);
      if (s !== undefined && s > topScore) {
        top = r;
        topScore = s;
      }
    }
    return top;
  };

  const longest = best((r) => r.ride.movingSec);
  if (longest) add("Longest ride", shortDuration(longest.ride.movingSec), longest);
  const farthest = best((r) => r.ride.distanceM);
  if (farthest && farthest !== longest) {
    add("Farthest ride", `${(farthest.ride.distanceM / 1609.344).toFixed(1)} mi`, farthest);
  }
  const climbiest = best((r) => (r.ride.climbM >= 150 ? r.ride.climbM : undefined));
  if (climbiest) add("Most climbing", `${Math.round(climbiest.ride.climbM * 3.28084).toLocaleString("en-US")} ft`, climbiest);
  const hardest = best((r) => r.load);
  if (hardest) add("Biggest day by load", `${Math.round(hardest.load)} points`, hardest);
  const twenty = best((r) => r.ride.peaks?.m20);
  if (twenty) add("Best 20 minutes", `${twenty.ride.peaks!.m20} W`, twenty);
  else {
    const power = best((r) =>
      r.ride.powerMeasured !== false && r.ride.movingSec >= 1200 ? (r.ride.normPower ?? r.ride.avgPower) : undefined
    );
    if (power) add("Highest ride power", `${power.ride.normPower ?? power.ride.avgPower} W`, power);
  }
  const fastest = best((r) =>
    r.ride.distanceM >= 30_000 && !r.ride.indoor ? r.ride.distanceM / r.ride.movingSec : undefined
  );
  if (fastest) {
    add("Fastest ride over 30 km", `${((fastest.ride.distanceM / fastest.ride.movingSec) * 2.23694).toFixed(1)} mph`, fastest);
  }
  return efforts;
}

/**
 * @param today "YYYY-MM-DD" in the rider's local time.
 */
export function analyzeRides(rides: CoachRide[], profileIn: RiderProfile, today: string): CoachAnalysis {
  const todayN = dayNumber(today);
  const profile = resolveProfile(profileIn, rides);

  // Keep rides (not hikes), drop anything dated in the future, oldest first.
  const dated: DatedRide[] = rides
    .filter((r) => r.kind !== "other" && r.movingSec > 0 && /^\d{4}-\d{2}-\d{2}/.test(r.start))
    .map((ride) => ({ ride, day: dayNumber(ride.start), ...rideLoad(ride, profile) }))
    .filter((r) => r.day <= todayN)
    .sort((a, b) => a.day - b.day || a.ride.start.localeCompare(b.ride.start));

  const inRange = (from: number, to: number) => dated.filter((r) => r.day >= from && r.day <= to);
  const firstDay = dated.length ? dated[0].day : null;

  // ── Weekly volume ──
  const thisWeek = weekStartOf(todayN);
  const weeks: WeekSummary[] = [];
  for (let i = WEEKS_SHOWN - 1; i >= 0; i--) {
    const start = thisWeek - i * 7;
    const inWeek = inRange(start, start + 6);
    const t = totals(inWeek);
    const cadence = weightedCadence(inWeek);
    weeks.push({
      weekStart: dayKey(start),
      rides: t.rides,
      hours: t.hours,
      distanceM: t.distanceM,
      climbM: t.climbM,
      load: t.load,
      longestSec: t.longestSec,
      ...(cadence !== undefined ? { avgCadence: cadence } : {}),
      current: i === 0,
    });
  }

  const last28Rides = inRange(todayN - 27, todayN);
  const prev28Rides = inRange(todayN - 55, todayN - 28);

  // ── Consistency: the six complete weeks before this one ──
  const weeksConsidered = 6;
  let weeksRidden = 0;
  let ridesInThoseWeeks = 0;
  for (let i = 1; i <= weeksConsidered; i++) {
    const start = thisWeek - i * 7;
    const count = inRange(start, start + 6).length;
    if (count > 0) weeksRidden++;
    ridesInThoseWeeks += count;
  }
  const last42 = inRange(todayN - 41, todayN);
  let longestGap = 0;
  let previous = todayN - 42;
  for (const r of last42) {
    longestGap = Math.max(longestGap, r.day - previous - 1);
    previous = r.day;
  }
  longestGap = Math.max(longestGap, todayN - previous);
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of inRange(todayN - 55, todayN)) weekdayCounts[weekdayOf(r.day)]++;
  const usualDays = weekdayCounts
    .map((count, weekday) => ({ count, weekday }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || a.weekday - b.weekday)
    .map((d) => d.weekday);

  const calendarStart = thisWeek - 7 * 7;
  const minutesByDay = new Map<number, number>();
  for (const r of dated) minutesByDay.set(r.day, (minutesByDay.get(r.day) ?? 0) + r.ride.movingSec / 60);
  const calendar: { day: string; minutes: number }[] = [];
  for (let d = calendarStart; d <= thisWeek + 6; d++) {
    calendar.push({ day: dayKey(d), minutes: Math.round(minutesByDay.get(d) ?? 0) });
  }

  // ── Load, fitness, fatigue, form ──
  const loads = new Map<number, number>();
  const methodCounts: Record<LoadMethod, number> = { power: 0, hr: 0, duration: 0 };
  for (const r of dated) loads.set(r.day, (loads.get(r.day) ?? 0) + r.load);
  for (const r of last42.length ? last42 : dated) methodCounts[r.method]++;
  const counted = methodCounts.power + methodCounts.hr + methodCounts.duration;
  let method: LoadMethod | "mixed" = "duration";
  if (counted > 0) {
    const top = (Object.keys(methodCounts) as LoadMethod[]).sort((a, b) => methodCounts[b] - methodCounts[a])[0];
    method = methodCounts[top] >= counted * 0.8 ? top : "mixed";
  }
  const fullSeries = firstDay === null ? [] : loadSeries(loads, firstDay, todayN);
  const lastPoint = fullSeries[fullSeries.length - 1];
  const weekAgo = fullSeries[fullSeries.length - 8];
  const historyDays = firstDay === null ? 0 : todayN - firstDay + 1;

  // ── Cadence ──
  const recentCadence = weightedCadence(last28Rides);
  const previousCadence = weightedCadence(prev28Rides);
  let cadenceTrend: CoachAnalysis["cadence"]["trend"] = null;
  if (recentCadence !== undefined && previousCadence !== undefined) {
    const delta = recentCadence - previousCadence;
    cadenceTrend = delta >= 2 ? "up" : delta <= -2 ? "down" : "steady";
  }

  const lastRide = dated[dated.length - 1];

  return {
    today,
    rideCount: dated.length,
    firstDay: firstDay === null ? null : dayKey(firstDay),
    historyDays,
    profile,
    weeks,
    last28: totals(last28Rides),
    prev28: totals(prev28Rides),
    consistency: {
      weeksRidden,
      weeksConsidered,
      ridesPerWeek: ridesInThoseWeeks / weeksConsidered,
      longestGapDays: longestGap,
      daysSinceLastRide: lastRide ? todayN - lastRide.day : null,
      usualDays,
      calendar,
    },
    load: {
      method,
      methodCounts,
      series: fullSeries.slice(-LOAD_DAYS_SHOWN),
      // Fitness and fatigue as of the end of today; form is what the rider started today with.
      fitness: lastPoint?.fitness ?? 0,
      fatigue: lastPoint?.fatigue ?? 0,
      form: lastPoint?.form ?? 0,
      ramp: lastPoint && weekAgo ? lastPoint.fitness - weekAgo.fitness : 0,
      warmingUp: historyDays < 42,
    },
    intensity: intensitySplit(last28Rides, profile),
    cadence: {
      ...(recentCadence !== undefined ? { recent: recentCadence } : {}),
      ...(previousCadence !== undefined ? { previous: previousCadence } : {}),
      trend: cadenceTrend,
    },
    efforts: notableEfforts(inRange(todayN - 41, todayN)),
  };
}
