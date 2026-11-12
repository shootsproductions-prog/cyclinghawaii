// Training load: how hard a ride was, as one number, and the
// fitness / fatigue / form trend built from it.
//
// ── The method, in plain words ──────────────────────────────────────
//
// Every ride gets a LOAD score where 100 means "one hour at the
// hardest effort you could hold for an hour". It is worked out from
// the best signal the ride has:
//
//   1. Power (needs your FTP):   hours x (normalized power / FTP)^2 x 100
//      This is Coggan's Training Stress Score.
//   2. Heart rate:               Banister's TRIMP, which weights each
//      minute by how far the heart rate sits between resting and max
//      (exponentially, because hard minutes cost more than easy ones),
//      rescaled so an hour at threshold heart rate also scores 100.
//   3. Neither:                  50 points per hour, the load of a
//      steady endurance ride. A placeholder, flagged as an estimate.
//
// From the daily loads:
//
//   FITNESS = your average daily load over about the last six weeks
//             (an exponentially weighted average, 42 day time constant)
//   FATIGUE = the same over about the last week (7 day time constant)
//   FORM    = yesterday's fitness minus yesterday's fatigue. Positive
//             means fresh, negative means carrying fatigue.
//
// This is the impulse-response model of Banister (1975) in the form
// Coggan popularised as the Performance Management Chart. It is a
// bookkeeping model of what you did, not a measurement of your body.
// Treat the trend as real and the exact numbers as approximate,
// especially when load comes from heart rate or duration alone.

import type { CoachRide, LoadMethod, LoadPoint, RiderProfile } from "./types";

export const FITNESS_DAYS = 42;
export const FATIGUE_DAYS = 7;

/** Load per hour assumed for a ride with no heart rate or power. */
export const DURATION_ONLY_LOAD_PER_HOUR = 50;

export const DEFAULT_REST_HR = 60;
/** Used only when no max heart rate is entered and none can be seen in the data. Matches the site's ride pages. */
export const DEFAULT_MAX_HR = 190;

/**
 * Banister's weighting: each minute counts reserve x A x e^(B x reserve).
 * A cancels out when we rescale to "an hour at threshold = 100", so only
 * the exponent matters. 1.92 is the value published for men (1.67 for
 * women); after rescaling the two differ by a few percent on easy rides.
 */
const TRIMP_A = 0.64;
const TRIMP_B = 1.92;
/** Threshold effort as a fraction of heart rate reserve. */
const THRESHOLD_RESERVE = 0.85;

const trimpPerMinute = (reserve: number): number => {
  const r = Math.min(1, Math.max(0, reserve));
  return r * TRIMP_A * Math.exp(TRIMP_B * r);
};

const THRESHOLD_TRIMP_PER_HOUR = 60 * trimpPerMinute(THRESHOLD_RESERVE);

export interface ResolvedProfile {
  maxHr: number;
  maxHrSource: "entered" | "observed" | "default";
  /**
   * Whether maxHr is good enough to judge intensity by. An entered
   * value is. An observed one only is if the rider's heart rate has
   * clearly been well above their usual riding level at some point;
   * someone who only ever rides steady never shows their maximum, and
   * treating their highest steady reading as "max" would make every
   * ride look hard.
   */
  maxHrTrusted: boolean;
  restHr: number;
  ftp?: number;
}

/** An observed peak must sit this far above the typical ride average to count as a real maximum. */
const OBSERVED_MAX_MARGIN = 1.22;

/**
 * Fill in the rider's numbers. With no max heart rate entered we use
 * the highest heart rate seen across their rides, which is a floor on
 * the true maximum, not the maximum itself.
 */
export function resolveProfile(profile: RiderProfile, rides: CoachRide[]): ResolvedProfile {
  const restHr = profile.restHr && profile.restHr >= 30 && profile.restHr <= 100 ? profile.restHr : DEFAULT_REST_HR;
  const ftp = profile.ftp && profile.ftp >= 50 && profile.ftp <= 600 ? profile.ftp : undefined;
  if (profile.maxHr && profile.maxHr >= 120 && profile.maxHr <= 230) {
    return { maxHr: profile.maxHr, maxHrSource: "entered", maxHrTrusted: true, restHr, ftp };
  }
  let observed = 0;
  let weighted = 0;
  let seconds = 0;
  for (const ride of rides) {
    if (ride.maxHr && ride.maxHr > observed && ride.maxHr <= 230) observed = ride.maxHr;
    if (ride.avgHr) {
      weighted += ride.avgHr * ride.movingSec;
      seconds += ride.movingSec;
    }
  }
  if (observed >= 150) {
    const typical = seconds > 0 ? weighted / seconds : 0;
    return {
      maxHr: observed,
      maxHrSource: "observed",
      maxHrTrusted: typical > 0 && observed >= typical * OBSERVED_MAX_MARGIN,
      restHr,
      ftp,
    };
  }
  return { maxHr: DEFAULT_MAX_HR, maxHrSource: "default", maxHrTrusted: false, restHr, ftp };
}

export interface RideLoad {
  load: number;
  method: LoadMethod;
}

export function rideLoad(ride: CoachRide, profile: ResolvedProfile): RideLoad {
  const hours = ride.movingSec / 3600;

  const power = ride.normPower ?? ride.avgPower;
  if (profile.ftp && power && ride.powerMeasured !== false) {
    const intensity = power / profile.ftp;
    return { load: hours * intensity * intensity * 100, method: "power" };
  }

  const span = profile.maxHr - profile.restHr;
  if (span > 0) {
    // Second-by-second heart rate, when the ride came from a file.
    if (ride.hrHist && ride.hrHist.length > 0) {
      let trimp = 0;
      let seconds = 0;
      for (let bpm = 0; bpm < ride.hrHist.length; bpm++) {
        const s = ride.hrHist[bpm];
        if (!s) continue;
        trimp += (s / 60) * trimpPerMinute((bpm - profile.restHr) / span);
        seconds += s;
      }
      if (seconds > 0) {
        // Scale up for any part of the ride the strap dropped out.
        const coverage = Math.min(1, seconds / Math.max(ride.movingSec, 1));
        const scaled = coverage > 0.5 ? trimp / coverage : trimp;
        return { load: (scaled / THRESHOLD_TRIMP_PER_HOUR) * 100, method: "hr" };
      }
    }
    if (ride.avgHr && ride.avgHr > profile.restHr) {
      const trimp = (ride.movingSec / 60) * trimpPerMinute((ride.avgHr - profile.restHr) / span);
      return { load: (trimp / THRESHOLD_TRIMP_PER_HOUR) * 100, method: "hr" };
    }
  }

  return { load: hours * DURATION_ONLY_LOAD_PER_HOUR, method: "duration" };
}

// ───────────────────── Day arithmetic on "YYYY-MM-DD" keys ─────────────────────

const DAY_MS = 86_400_000;

/** Whole days since the Unix epoch for a "YYYY-MM-DD" key (or the date part of a longer stamp). */
export function dayNumber(key: string): number {
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7));
  const d = Number(key.slice(8, 10));
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function dayKey(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayOf(n: number): number {
  return (new Date(n * DAY_MS).getUTCDay() + 6) % 7;
}

export function weekStartOf(n: number): number {
  return n - weekdayOf(n);
}

/**
 * Daily fitness, fatigue and form from the first ride to `today`.
 * `loads` maps day number to that day's total load.
 */
export function loadSeries(loads: Map<number, number>, firstDay: number, today: number): LoadPoint[] {
  const kFitness = 1 - Math.exp(-1 / FITNESS_DAYS);
  const kFatigue = 1 - Math.exp(-1 / FATIGUE_DAYS);
  const series: LoadPoint[] = [];
  let fitness = 0;
  let fatigue = 0;
  for (let day = firstDay; day <= today; day++) {
    const load = loads.get(day) ?? 0;
    const form = fitness - fatigue; // uses yesterday's values
    fitness += (load - fitness) * kFitness;
    fatigue += (load - fatigue) * kFatigue;
    series.push({ day: dayKey(day), load, fitness, fatigue, form });
  }
  return series;
}
