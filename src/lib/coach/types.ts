// Shared types for the coach (/coach).
//
// Like src/lib/fit, everything here is plain data and the analysis is
// pure functions, so it runs the same in the browser (imported ride
// files never leave the device) and in unit tests.

export type RideSource = "strava" | "file" | "sample";

export type RideKind = "road" | "gravel" | "mtb" | "virtual" | "other";

/**
 * One ride, reduced to what the coach needs. No GPS track, no route,
 * no start location: just totals and, for imported files, compact
 * histograms of heart rate and power.
 */
export interface CoachRide {
  id: string;
  source: RideSource;
  name: string;
  /** Local start time as "YYYY-MM-DDTHH:mm:ss" (no zone). Day and weekday come from this. */
  start: string;
  kind: RideKind;
  movingSec: number;
  elapsedSec: number;
  distanceM: number;
  climbM: number;
  avgHr?: number;
  maxHr?: number;
  /** Average power in watts while moving. */
  avgPower?: number;
  /** Normalized (30 s rolling, 4th-power) or weighted-average power. */
  normPower?: number;
  /** False when the power is an estimate (no power meter). */
  powerMeasured?: boolean;
  /** Average cadence while pedalling, rpm. */
  avgCadence?: number;
  /** Seconds spent at each heart rate; index is beats per minute. Files only. */
  hrHist?: number[];
  /** Seconds spent in each 10 W band; index is floor(watts / 10). Files only. */
  powerHist?: number[];
  /** Best average power over 5 s, 1 min, 5 min and 20 min. Files only. */
  peaks?: { s5?: number; m1?: number; m5?: number; m20?: number };
  indoor?: boolean;
}

export interface RiderProfile {
  /** Maximum heart rate. When blank, the highest value seen in the data is used. */
  maxHr?: number;
  /** Resting heart rate. Defaults to 60. */
  restHr?: number;
  /** Functional threshold power in watts. Power-based load needs it. */
  ftp?: number;
}

export type LoadMethod = "power" | "hr" | "duration";

export interface WeekSummary {
  /** Monday of the week, "YYYY-MM-DD". */
  weekStart: string;
  rides: number;
  hours: number;
  distanceM: number;
  climbM: number;
  load: number;
  longestSec: number;
  avgCadence?: number;
  /** True for the week that contains "today" (still in progress). */
  current: boolean;
}

export interface LoadPoint {
  day: string;
  load: number;
  fitness: number;
  fatigue: number;
  /** Yesterday's fitness minus yesterday's fatigue: how fresh the rider starts the day. */
  form: number;
}

export interface IntensitySplit {
  /** How the split was worked out, or "none" when there is no heart rate or power. */
  basis: "time-in-zone" | "by-ride" | "none";
  /** Which signal: heart rate or power. */
  signal: "hr" | "power" | null;
  easyPct: number;
  moderatePct: number;
  hardPct: number;
  /** Hours of riding the split is based on. */
  hours: number;
  ridesWithData: number;
  ridesTotal: number;
}

export interface NotableEffort {
  label: string;
  value: string;
  day: string;
  rideName: string;
}

export interface CoachAnalysis {
  today: string;
  rideCount: number;
  firstDay: string | null;
  /** Days of history available. */
  historyDays: number;
  profile: {
    maxHr: number;
    maxHrSource: "entered" | "observed" | "default";
    /** False when the max heart rate is a guess too weak to judge intensity by. */
    maxHrTrusted: boolean;
    restHr: number;
    ftp?: number;
  };
  weeks: WeekSummary[];
  last28: PeriodTotals;
  prev28: PeriodTotals;
  consistency: {
    /** Of the last 6 complete weeks, how many had at least one ride. */
    weeksRidden: number;
    weeksConsidered: number;
    ridesPerWeek: number;
    /** Longest run of days with no ride in the last 42 days. */
    longestGapDays: number;
    daysSinceLastRide: number | null;
    /** Weekdays ridden most, 0 = Monday. Most frequent first. */
    usualDays: number[];
    /** One entry per day for the last 8 weeks, oldest first: minutes ridden. */
    calendar: { day: string; minutes: number }[];
  };
  load: {
    /** How most of the recent load was measured. */
    method: LoadMethod | "mixed";
    methodCounts: Record<LoadMethod, number>;
    series: LoadPoint[];
    fitness: number;
    fatigue: number;
    form: number;
    /** Change in fitness over the last 7 days. */
    ramp: number;
    /** True when there is under six weeks of history, so fitness is still filling in. */
    warmingUp: boolean;
  };
  intensity: IntensitySplit;
  cadence: {
    recent?: number;
    previous?: number;
    trend: "up" | "down" | "steady" | null;
  };
  efforts: NotableEffort[];
}

export interface PeriodTotals {
  rides: number;
  hours: number;
  distanceM: number;
  climbM: number;
  load: number;
  longestSec: number;
}

export type SessionKind = "rest" | "easy" | "endurance" | "tempo" | "hard" | "long" | "skills";

export interface PlannedDay {
  /** "Mon" .. "Sun". */
  day: string;
  kind: SessionKind;
  title: string;
  detail: string;
  minutes: number;
}

/** The coach's read, in the same shape whether rules or Claude wrote it. */
export interface CoachRead {
  source: "rules" | "claude";
  headline: string;
  goingWell: string[];
  focus: {
    title: string;
    /** What the data shows. */
    observe: string;
    /** The one thing to do. */
    cue: string;
    /** A specific session that practises it. */
    drill: string;
    /** How the rider will know it worked, and when to look again. */
    recheck: string;
  };
  week: PlannedDay[];
  /** Tie-in to the latest bike fit session on this device, if there is one. */
  fitNote?: string;
  caveats: string[];
}
