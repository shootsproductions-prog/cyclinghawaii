// One call that runs the whole pipeline for a session:
// landmarks -> measurements -> findings -> coaching plan. Pure.

import { assess } from "./assess";
import { buildPlan } from "./coaching";
import { legSegmentsMm, measureFrames } from "./measure";
import { SPECS, toleranceFor } from "./ranges";
import type {
  CoachingPlan,
  Finding,
  FitSession,
  FrameDiagnostics,
  FrameKind,
  MeasurementId,
  Measurements,
} from "./types";

export interface Analysis {
  measurements: Measurements;
  diagnostics: Partial<Record<FrameKind, FrameDiagnostics>>;
  findings: Finding[];
  plan: CoachingPlan;
}

export function analyzeSession(session: Pick<FitSession, "frames" | "settings">): Analysis {
  const { frames, settings } = session;
  const options = { crankLengthMm: settings.crankLengthMm, tiltDeg: settings.tiltDeg };
  const { measurements, diagnostics } = measureFrames(frames, options);
  const findings = assess(measurements, settings);
  const plan = buildPlan({
    findings,
    diagnostics,
    legSegments: legSegmentsMm(frames, options),
    settings,
  });
  return { measurements, diagnostics, findings, plan };
}

// ───────────────────── Before / after ─────────────────────

export type Verdict = "better" | "worse" | "same" | "in-range" | "new" | "gone";

export interface ComparisonRow {
  id: MeasurementId;
  label: string;
  unit: "deg" | "mm";
  before?: number;
  after?: number;
  /** after minus before. */
  delta?: number;
  verdict: Verdict;
  range: Finding["range"];
}

function distanceOutside(f: Finding): number {
  return f.side === "ok" ? 0 : f.deviation;
}

/**
 * Line up two analyses measurement by measurement. "Better" means the
 * number moved toward its range by more than a rounding error; the
 * range used is the newer session's.
 */
export function compareAnalyses(before: Analysis, after: Analysis): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  const ids = new Set<MeasurementId>([
    ...before.findings.map((f) => f.id),
    ...after.findings.map((f) => f.id),
  ]);
  for (const id of Object.keys(SPECS) as MeasurementId[]) {
    if (!ids.has(id)) continue;
    const b = before.findings.find((f) => f.id === id);
    const a = after.findings.find((f) => f.id === id);
    const spec = SPECS[id];
    const range = (a ?? b)!.range;
    let verdict: Verdict;
    if (a && !b) verdict = "new";
    else if (b && !a) verdict = "gone";
    else {
      const db = distanceOutside(b!);
      const da = distanceOutside(a!);
      // Changes smaller than a third of the measurement tolerance are noise.
      const noise = toleranceFor(id) / 3;
      if (da === 0 && db === 0) verdict = "in-range";
      else if (da < db - noise) verdict = "better";
      else if (da > db + noise) verdict = "worse";
      else verdict = "same";
    }
    rows.push({
      id,
      label: spec.label,
      unit: spec.unit,
      before: b?.value,
      after: a?.value,
      delta: a && b ? a.value - b.value : undefined,
      verdict,
      range,
    });
  }
  return rows;
}

/** A compact, image-free summary of a session, for the coach page. */
export interface FitSummary {
  sessionId: string;
  createdAt: string;
  style: FitSession["settings"]["style"];
  headline: string;
  openChange: string | null;
  findings: { label: string; value: number; unit: "deg" | "mm"; status: Finding["status"] }[];
}

export function summarizeSession(session: FitSession): FitSummary {
  const analysis = analyzeSession(session);
  return {
    sessionId: session.id,
    createdAt: session.createdAt,
    style: session.settings.style,
    headline: analysis.plan.headline,
    openChange: analysis.plan.primary?.title ?? null,
    findings: analysis.findings
      .filter((f) => !f.informational)
      .map((f) => ({ label: f.label, value: Math.round(f.value), unit: f.unit, status: f.status })),
  };
}
