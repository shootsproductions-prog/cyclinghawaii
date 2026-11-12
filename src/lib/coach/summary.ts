// The compact summary that is sent to the server when a rider asks
// for the AI-written read.
//
// Two rules shape this file:
//
//   1. Send as little as possible. Weekly totals and a handful of
//      rounded numbers. No ride names, no GPS, no files, no photos.
//   2. Trust nothing that comes back in. The server re-validates every
//      field with `sanitizeSummary` before any of it reaches a prompt:
//      numbers are clamped to sane ranges, enums are checked, and the
//      few short strings are stripped to a plain character set.
//
// Pure functions, shared by the browser (build) and the server (sanitize).

import type { FitSummary } from "@/lib/fit/analyze";
import type { CoachAnalysis, CoachRead } from "./types";

export interface CoachSummary {
  today: string;
  historyDays: number;
  rideCount: number;
  profile: { maxHr: number; maxHrSource: string; maxHrTrusted: boolean; restHr: number; ftp: number | null };
  weeks: {
    weekStart: string;
    rides: number;
    hours: number;
    miles: number;
    climbFt: number;
    load: number;
    longestHours: number;
    cadence: number | null;
    inProgress: boolean;
  }[];
  last28: Period;
  prev28: Period;
  consistency: {
    weeksRidden: number;
    weeksConsidered: number;
    ridesPerWeek: number;
    longestGapDays: number;
    daysSinceLastRide: number | null;
    usualDays: string[];
  };
  load: { method: string; fitness: number; fatigue: number; form: number; rampPerWeek: number; warmingUp: boolean };
  intensity: { basis: string; signal: string | null; easyPct: number; moderatePct: number; hardPct: number; hours: number };
  cadence: { recent: number | null; previous: number | null; trend: string | null };
  efforts: { label: string; value: string; day: string }[];
  fit: {
    date: string;
    style: string;
    openChange: string | null;
    findings: { label: string; value: number; unit: string; status: string }[];
  } | null;
  /** What the built-in rules chose, so the model can agree or say why not. */
  baseline: { focus: string; plannedHours: number };
}

interface Period {
  rides: number;
  hours: number;
  miles: number;
  climbFt: number;
  load: number;
  longestHours: number;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const r1 = (v: number) => Math.round(v * 10) / 10;
const miles = (m: number) => Math.round(m / 1609.344);
const feet = (m: number) => Math.round(m * 3.28084);

export function buildSummary(a: CoachAnalysis, baseline: CoachRead, fit?: FitSummary | null): CoachSummary {
  const period = (p: CoachAnalysis["last28"]): Period => ({
    rides: p.rides,
    hours: r1(p.hours),
    miles: miles(p.distanceM),
    climbFt: feet(p.climbM),
    load: Math.round(p.load),
    longestHours: r1(p.longestSec / 3600),
  });
  return {
    today: a.today,
    historyDays: a.historyDays,
    rideCount: a.rideCount,
    profile: {
      maxHr: a.profile.maxHr,
      maxHrSource: a.profile.maxHrSource,
      maxHrTrusted: a.profile.maxHrTrusted,
      restHr: a.profile.restHr,
      ftp: a.profile.ftp ?? null,
    },
    weeks: a.weeks.map((w) => ({
      weekStart: w.weekStart,
      rides: w.rides,
      hours: r1(w.hours),
      miles: miles(w.distanceM),
      climbFt: feet(w.climbM),
      load: Math.round(w.load),
      longestHours: r1(w.longestSec / 3600),
      cadence: w.avgCadence !== undefined ? Math.round(w.avgCadence) : null,
      inProgress: w.current,
    })),
    last28: period(a.last28),
    prev28: period(a.prev28),
    consistency: {
      weeksRidden: a.consistency.weeksRidden,
      weeksConsidered: a.consistency.weeksConsidered,
      ridesPerWeek: r1(a.consistency.ridesPerWeek),
      longestGapDays: a.consistency.longestGapDays,
      daysSinceLastRide: a.consistency.daysSinceLastRide,
      usualDays: a.consistency.usualDays.slice(0, 4).map((d) => DAY_NAMES[d]),
    },
    load: {
      method: a.load.method,
      fitness: r1(a.load.fitness),
      fatigue: r1(a.load.fatigue),
      form: r1(a.load.form),
      rampPerWeek: r1(a.load.ramp),
      warmingUp: a.load.warmingUp,
    },
    intensity: {
      basis: a.intensity.basis,
      signal: a.intensity.signal,
      easyPct: Math.round(a.intensity.easyPct),
      moderatePct: Math.round(a.intensity.moderatePct),
      hardPct: Math.round(a.intensity.hardPct),
      hours: r1(a.intensity.hours),
    },
    cadence: {
      recent: a.cadence.recent !== undefined ? Math.round(a.cadence.recent) : null,
      previous: a.cadence.previous !== undefined ? Math.round(a.cadence.previous) : null,
      trend: a.cadence.trend,
    },
    // Labels and values only. Ride names stay on the device.
    efforts: a.efforts.map((e) => ({ label: e.label, value: e.value, day: e.day })),
    fit: fit
      ? {
          date: fit.createdAt.slice(0, 10),
          style: fit.style,
          openChange: fit.openChange,
          findings: fit.findings.map((f) => ({ label: f.label, value: f.value, unit: f.unit, status: f.status })),
        }
      : null,
    baseline: {
      focus: baseline.focus.title,
      plannedHours: r1(baseline.week.reduce((s, d) => s + d.minutes, 0) / 60),
    },
  };
}

// ───────────────────── Server-side validation ─────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function num(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
}

function int(v: unknown, min: number, max: number): number | null {
  const n = num(v, min, max);
  return n === null ? null : Math.round(n);
}

/** Letters, digits and plain punctuation only; nothing that reads as markup or an instruction block. */
function plain(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/[^A-Za-z0-9 .,:%'()\-+/]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  return cleaned.length > 0 ? cleaned : null;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

const day = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

function period(v: unknown): Period | null {
  if (!isRecord(v)) return null;
  const rides = int(v.rides, 0, 400);
  const hours = num(v.hours, 0, 700);
  if (rides === null || hours === null) return null;
  return {
    rides,
    hours,
    miles: int(v.miles, 0, 20_000) ?? 0,
    climbFt: int(v.climbFt, 0, 2_000_000) ?? 0,
    load: int(v.load, 0, 50_000) ?? 0,
    longestHours: num(v.longestHours, 0, 48) ?? 0,
  };
}

/**
 * Re-validate a summary received over the network. Returns null if it
 * is not recognisably a summary; otherwise a clean copy containing only
 * known fields with clamped values.
 */
export function sanitizeSummary(input: unknown): CoachSummary | null {
  if (!isRecord(input)) return null;
  const today = day(input.today);
  const last28 = period(input.last28);
  const prev28 = period(input.prev28);
  if (!today || !last28 || !prev28) return null;
  if (!isRecord(input.profile) || !isRecord(input.consistency) || !isRecord(input.load)) return null;
  if (!isRecord(input.intensity) || !isRecord(input.cadence) || !isRecord(input.baseline)) return null;
  if (!Array.isArray(input.weeks) || input.weeks.length > 16) return null;

  const weeks: CoachSummary["weeks"] = [];
  for (const w of input.weeks) {
    if (!isRecord(w)) return null;
    const weekStart = day(w.weekStart);
    const p = period(w);
    if (!weekStart || !p) return null;
    weeks.push({
      weekStart,
      rides: p.rides,
      hours: p.hours,
      miles: p.miles,
      climbFt: p.climbFt,
      load: p.load,
      longestHours: p.longestHours,
      cadence: int(w.cadence, 20, 200),
      inProgress: w.inProgress === true,
    });
  }

  const { profile, consistency, load, intensity, cadence, baseline } = input;
  const focus = plain(baseline.focus, 60);
  if (!focus) return null;

  const efforts: CoachSummary["efforts"] = [];
  if (Array.isArray(input.efforts)) {
    for (const e of input.efforts.slice(0, 8)) {
      if (!isRecord(e)) continue;
      const label = plain(e.label, 40);
      const value = plain(e.value, 24);
      const d = day(e.day);
      if (label && value && d) efforts.push({ label, value, day: d });
    }
  }

  let fit: CoachSummary["fit"] = null;
  if (isRecord(input.fit)) {
    const date = day(input.fit.date);
    const style = oneOf(input.fit.style, ["endurance", "performance", "gravel"] as const);
    if (date && style) {
      const findings: NonNullable<CoachSummary["fit"]>["findings"] = [];
      if (Array.isArray(input.fit.findings)) {
        for (const f of input.fit.findings.slice(0, 12)) {
          if (!isRecord(f)) continue;
          const label = plain(f.label, 40);
          const value = int(f.value, -500, 500);
          const unit = oneOf(f.unit, ["deg", "mm"] as const);
          const status = oneOf(f.status, ["in-range", "borderline", "out"] as const);
          if (label && value !== null && unit && status) findings.push({ label, value, unit, status });
        }
      }
      fit = { date, style, openChange: plain(input.fit.openChange, 60), findings };
    }
  }

  const usualDays = Array.isArray(consistency.usualDays)
    ? consistency.usualDays.filter((d): d is string => DAY_NAMES.includes(d as string)).slice(0, 7)
    : [];

  return {
    today,
    historyDays: int(input.historyDays, 0, 4000) ?? 0,
    rideCount: int(input.rideCount, 0, 5000) ?? 0,
    profile: {
      maxHr: int(profile.maxHr, 100, 230) ?? 190,
      maxHrSource: oneOf(profile.maxHrSource, ["entered", "observed", "default"] as const) ?? "default",
      maxHrTrusted: profile.maxHrTrusted === true,
      restHr: int(profile.restHr, 30, 100) ?? 60,
      ftp: int(profile.ftp, 50, 600),
    },
    weeks,
    last28,
    prev28,
    consistency: {
      weeksRidden: int(consistency.weeksRidden, 0, 12) ?? 0,
      weeksConsidered: int(consistency.weeksConsidered, 1, 12) ?? 6,
      ridesPerWeek: num(consistency.ridesPerWeek, 0, 21) ?? 0,
      longestGapDays: int(consistency.longestGapDays, 0, 60) ?? 0,
      daysSinceLastRide: int(consistency.daysSinceLastRide, 0, 4000),
      usualDays,
    },
    load: {
      method: oneOf(load.method, ["power", "hr", "duration", "mixed"] as const) ?? "duration",
      fitness: num(load.fitness, 0, 400) ?? 0,
      fatigue: num(load.fatigue, 0, 600) ?? 0,
      form: num(load.form, -400, 400) ?? 0,
      rampPerWeek: num(load.rampPerWeek, -100, 100) ?? 0,
      warmingUp: load.warmingUp === true,
    },
    intensity: {
      basis: oneOf(intensity.basis, ["time-in-zone", "by-ride", "none"] as const) ?? "none",
      signal: oneOf(intensity.signal, ["hr", "power"] as const),
      easyPct: int(intensity.easyPct, 0, 100) ?? 0,
      moderatePct: int(intensity.moderatePct, 0, 100) ?? 0,
      hardPct: int(intensity.hardPct, 0, 100) ?? 0,
      hours: num(intensity.hours, 0, 700) ?? 0,
    },
    cadence: {
      recent: int(cadence.recent, 20, 200),
      previous: int(cadence.previous, 20, 200),
      trend: oneOf(cadence.trend, ["up", "down", "steady"] as const),
    },
    efforts,
    fit,
    baseline: { focus, plannedHours: num(baseline.plannedHours, 0, 60) ?? 0 },
  };
}

// ───────────────────── Validating what the model writes ─────────────────────

const KINDS = ["rest", "easy", "endurance", "tempo", "hard", "long", "skills"] as const;

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length > 0 ? t.slice(0, max) : null;
}

/**
 * Check that a model response is a complete read and normalise it.
 * Returns null on anything short of that, so the caller falls back to
 * the rules-based read rather than showing something half-formed.
 */
export function validateRead(input: unknown): CoachRead | null {
  if (!isRecord(input) || !isRecord(input.focus) || !Array.isArray(input.week)) return null;
  const headline = text(input.headline, 220);
  const title = text(input.focus.title, 80);
  const observe = text(input.focus.observe, 700);
  const cue = text(input.focus.cue, 300);
  const drill = text(input.focus.drill, 700);
  const recheck = text(input.focus.recheck, 500);
  if (!headline || !title || !observe || !cue || !drill || !recheck) return null;

  const byDay = new Map<string, CoachRead["week"][number]>();
  for (const d of input.week) {
    if (!isRecord(d)) return null;
    const name = oneOf(d.day, DAY_NAMES);
    const kind = oneOf(d.kind, KINDS);
    const dayTitle = text(d.title, 60);
    const detail = text(d.detail, 400);
    const minutes = int(d.minutes, 0, 600);
    if (!name || !kind || !dayTitle || !detail || minutes === null) return null;
    byDay.set(name, { day: name, kind, title: dayTitle, detail, minutes: kind === "rest" ? 0 : minutes });
  }
  if (byDay.size !== 7) return null;

  const list = (v: unknown, max: number, each: number): string[] =>
    Array.isArray(v) ? v.map((s) => text(s, each)).filter((s): s is string => !!s).slice(0, max) : [];

  const note = text(input.fitNote, 400);
  return {
    source: "claude",
    headline,
    goingWell: list(input.goingWell, 3, 300),
    focus: { title, observe, cue, drill, recheck },
    week: DAY_NAMES.map((d) => byDay.get(d)!),
    ...(note ? { fitNote: note } : {}),
    caveats: list(input.caveats, 4, 300),
  };
}
