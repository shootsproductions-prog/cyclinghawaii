// Reduce a parsed ride file to the totals the coach works from.
// Pure: same input, same output, no clock, no network.

import type { ParsedRide, RideSample } from "./parsers/types";
import type { CoachRide, RideKind } from "./types";

/** A gap longer than this between samples is a pause, not riding. */
const PAUSE_SEC = 10;
/** Slower than this (3.6 km/h) without pedalling counts as stopped. */
const MOVING_MPS = 1;
/** GPS jumps faster than this are ignored (108 km/h is generous for a bike). */
const MAX_PLAUSIBLE_MPS = 30;
/** Elevation has to change this much before it counts, to ignore sensor chatter. */
const CLIMB_THRESHOLD_M = 3;

const EARTH_RADIUS_M = 6371008.8;
const RAD = Math.PI / 180;

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Normalized power: 30 second rolling average, raised to the 4th
 * power, averaged, 4th root (Coggan). `watts` is one value per second.
 * Returns 0 for efforts shorter than 30 seconds.
 */
export function normalizedPower(watts: number[]): number {
  const window = 30;
  if (watts.length < window) return 0;
  let sum = 0;
  for (let i = 0; i < window; i++) sum += watts[i];
  let fourth = (sum / window) ** 4;
  let count = 1;
  for (let i = window; i < watts.length; i++) {
    sum += watts[i] - watts[i - window];
    fourth += (sum / window) ** 4;
    count++;
  }
  return Math.pow(fourth / count, 0.25);
}

/** Best average over any `seconds`-long stretch of a per-second series, or undefined if too short. */
export function bestAverage(perSecond: number[], seconds: number): number | undefined {
  if (perSecond.length < seconds) return undefined;
  let sum = 0;
  for (let i = 0; i < seconds; i++) sum += perSecond[i];
  let best = sum;
  for (let i = seconds; i < perSecond.length; i++) {
    sum += perSecond[i] - perSecond[i - seconds];
    if (sum > best) best = sum;
  }
  return best / seconds;
}

function kindOf(parsed: ParsedRide): RideKind | "not-cycling" {
  const text = `${parsed.sport ?? ""} ${parsed.subSport ?? ""}`.toLowerCase();
  if (!text.trim()) return "road";
  if (/run|walk|hik|swim|ski|row|yoga|strength|sport_(?!2\b)/.test(text)) return "not-cycling";
  if (/gravel|cyclocross/.test(text)) return "gravel";
  if (/mountain|mtb|downhill/.test(text)) return "mtb";
  if (/virtual|indoor|spin|trainer/.test(text)) return "virtual";
  return "road";
}

/** "YYYY-MM-DDTHH:mm:ss" in the zone `utcOffsetMin` minutes east of UTC. */
export function localStamp(epochSec: number, utcOffsetMin: number): string {
  return new Date((epochSec + utcOffsetMin * 60) * 1000).toISOString().slice(0, 19);
}

export interface SummarizeOptions {
  id: string;
  /** Used when the file carries no name of its own. */
  fallbackName: string;
  /** Minutes east of UTC for the rider's local time. Honolulu is -600. */
  utcOffsetMin: number;
}

export type SummarizeResult =
  | { ok: true; ride: CoachRide }
  | { ok: false; reason: string };

export function summarizeRide(parsed: ParsedRide, options: SummarizeOptions): SummarizeResult {
  const kind = kindOf(parsed);
  if (kind === "not-cycling") {
    return { ok: false, reason: `That activity is recorded as "${parsed.sport}", not a ride.` };
  }

  const samples: RideSample[] = parsed.samples
    .filter((s) => Number.isFinite(s.t))
    .sort((a, b) => a.t - b.t);
  const session = parsed.session ?? {};

  if (samples.length < 2) {
    return { ok: false, reason: "That file has no timed track points to analyse." };
  }

  let movingSec = 0;
  let distance = 0;
  let climb = 0;
  let climbRef: number | undefined;
  let hrWeighted = 0;
  let hrSec = 0;
  let maxHr = 0;
  let cadWeighted = 0;
  let cadSec = 0;
  const hrHist: number[] = [];
  const powerHist: number[] = [];
  const powerPerSecond: number[] = [];
  let hasPower = false;
  let hasGps = false;

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    const dt = cur.t - prev.t;
    if (dt <= 0) continue;
    const paused = dt > PAUSE_SEC;

    let step = 0;
    if (cur.dist !== undefined && prev.dist !== undefined) {
      step = Math.max(0, cur.dist - prev.dist);
    } else if (cur.lat !== undefined && cur.lon !== undefined && prev.lat !== undefined && prev.lon !== undefined) {
      step = haversine(prev.lat, prev.lon, cur.lat, cur.lon);
    } else if (cur.speed !== undefined && !paused) {
      step = cur.speed * dt;
    }
    if (cur.lat !== undefined) hasGps = true;
    const speed = cur.speed ?? step / dt;
    if (step / dt > MAX_PLAUSIBLE_MPS) step = 0;
    distance += step;

    if (cur.ele !== undefined) {
      if (climbRef === undefined) climbRef = cur.ele;
      else if (cur.ele > climbRef + CLIMB_THRESHOLD_M) {
        climb += cur.ele - climbRef;
        climbRef = cur.ele;
      } else if (cur.ele < climbRef - CLIMB_THRESHOLD_M) {
        climbRef = cur.ele;
      }
    }

    if (paused) continue;

    const pedalling = (cur.power ?? 0) > 0 || (cur.cad ?? 0) > 0;
    if (speed >= MOVING_MPS || pedalling) movingSec += dt;

    if (cur.hr !== undefined && cur.hr > 0) {
      hrWeighted += cur.hr * dt;
      hrSec += dt;
      if (cur.hr > maxHr) maxHr = cur.hr;
      const bin = Math.min(255, Math.round(cur.hr));
      hrHist[bin] = (hrHist[bin] ?? 0) + dt;
    }
    if (cur.cad !== undefined && cur.cad > 0) {
      cadWeighted += cur.cad * dt;
      cadSec += dt;
    }
    if (cur.power !== undefined) {
      hasPower = true;
      const bin = Math.min(199, Math.floor(cur.power / 10));
      powerHist[bin] = (powerHist[bin] ?? 0) + dt;
      // One entry per second, so rolling windows are true time windows.
      const seconds = Math.max(1, Math.round(dt));
      for (let s = 0; s < seconds; s++) powerPerSecond.push(cur.power);
    }
  }

  const first = samples[0].t;
  const last = samples[samples.length - 1].t;
  const elapsedSec = session.elapsedSec ?? last - first;
  if (movingSec < 60) {
    // Indoor files sometimes carry no speed, power or cadence at all.
    movingSec = session.timerSec ?? 0;
  }
  if (movingSec < 60) {
    return { ok: false, reason: "That file has less than a minute of riding in it." };
  }

  const fill = (hist: number[]): number[] => Array.from({ length: hist.length }, (_, i) => hist[i] ?? 0);
  const avgPowerComputed = powerPerSecond.length
    ? powerPerSecond.reduce((s, v) => s + v, 0) / powerPerSecond.length
    : undefined;
  const np = hasPower ? normalizedPower(powerPerSecond) : 0;

  const ride: CoachRide = {
    id: options.id,
    source: "file",
    name: (parsed.name || options.fallbackName).slice(0, 120),
    start: localStamp(session.startTime ?? first, options.utcOffsetMin),
    kind,
    movingSec: Math.round(Math.min(movingSec, Math.max(elapsedSec, movingSec))),
    elapsedSec: Math.round(Math.max(elapsedSec, movingSec)),
    distanceM: Math.round(session.distanceM ?? distance),
    climbM: Math.round(session.ascentM ?? climb),
    indoor: !hasGps || kind === "virtual",
  };
  const avgHr = hrSec > 0 ? hrWeighted / hrSec : session.avgHr;
  if (avgHr) ride.avgHr = Math.round(avgHr);
  const peakHr = maxHr || session.maxHr;
  if (peakHr) ride.maxHr = Math.round(peakHr);
  if (hrSec > 0) ride.hrHist = fill(hrHist);
  const avgPower = avgPowerComputed ?? session.avgPower;
  if (avgPower !== undefined && avgPower > 0) {
    ride.avgPower = Math.round(avgPower);
    ride.normPower = Math.round(np || session.normPower || avgPower);
    ride.powerMeasured = true;
  }
  if (hasPower) {
    ride.powerHist = fill(powerHist);
    const peaks: NonNullable<CoachRide["peaks"]> = {};
    const s5 = bestAverage(powerPerSecond, 5);
    const m1 = bestAverage(powerPerSecond, 60);
    const m5 = bestAverage(powerPerSecond, 300);
    const m20 = bestAverage(powerPerSecond, 1200);
    if (s5) peaks.s5 = Math.round(s5);
    if (m1) peaks.m1 = Math.round(m1);
    if (m5) peaks.m5 = Math.round(m5);
    if (m20) peaks.m20 = Math.round(m20);
    ride.peaks = peaks;
  }
  const cadence = cadSec > 0 ? cadWeighted / cadSec : session.avgCadence;
  if (cadence) ride.avgCadence = Math.round(cadence);
  return { ok: true, ride };
}
